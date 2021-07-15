/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import * as d3 from 'd3';
import { makeGraph, sleep } from '../utils';


export class GraphDescriptionEmbeddings {
  parent = d3.select('#graph-description-embeddings');
  svg = this.parent.append('svg');
  textHolder = this.parent.append('div').classed('lines', true);
  numNodes = 5;
  selectedEdgeIdx = 1;
  selectedNodeIdx = 1;
  nodes;
  links;
  global;
  constructor() {
    const [nodes, links] = makeGraph(this.numNodes, this.numNodes * 2);
    this.nodes = nodes;
    this.links = links;
    const numEdgeEmbed = 8;
    const numNodeEmbed = 6;

    this.nodes.forEach(d => {
      d.color = d3.color(`hsl(51, 100%, ${Math.random() * 50 + 25}%)`);
      d.embedding = d3.range(numNodeEmbed).map(d => .05 + Math.random() * .95).map(d => { return { h: d } });
    });
    this.links.forEach(d => {
      d.color = d3.color(`hsl(207, 50%, ${Math.random() * 50 + 30}%)`);
      d.embedding = d3.range(numEdgeEmbed).map(d => .05 + Math.random() * .95).map(d => { return { h: d } });
    });
    this.showGraph(nodes, links);
    this.makeText();
  }

  showGraph(nodes, links) {
    const localOffset = 0.6;
    const localScale = 200;
    const pos = (x) => (x + localOffset) * localScale;

    const graphHolder = this.svg.append('g');

    // Make global box
    const numGlobEmbed = 5;
    this.global = [{
      color: d3.color('rgb(250, 147, 147)'),
      embedding: d3.range(numGlobEmbed).map(d => .05 + Math.random() * .95).map(d => {return {h: d}})
    }];
    graphHolder.selectAll('rect.global')
      .data(this.global)
      .enter()
      .append('rect.global')
      .attr('width', 250)
      .attr('height', 250)
      .attr('x', 0)
      .attr('y', -10)
      .attr('rx', 20)
      .attr('fill', 'none')
      .attr('stroke', d => d.color)
      .style("stroke-width", 8)
      .attr('stroke-dasharray', "4, 4")
      .on('mouseover', (d, i) => {this.makeText('g')})
      .on('mouseout', (d, i) => this.makeText(''));


    // Make edges 
    graphHolder.selectAll('line.vis')
      .data(links)
      .enter()
      .append('line')
      .classed('vis', true)
      .style("stroke", "#bbb")
      .style("stroke-width", 1)
      .attr("x1", (d) => pos(d.a.x))
      .attr("x2", (d) => pos(d.b.x))
      .attr("y1", (d) => pos(d.a.y))
      .attr("y2", (d) => pos(d.b.y))

    graphHolder.selectAll('line.target')
      .data(links)
      .enter()
      .append('line')
      .classed('target', true)
      .style("stroke", "rgba(0, 0, 0, 0)")
      .style("stroke-width", 20)
      .attr("x1", (d) => pos(d.a.x))
      .attr("x2", (d) => pos(d.b.x))
      .attr("y1", (d) => pos(d.a.y))
      .attr("y2", (d) => pos(d.b.y))
      .on('mouseover', (d, i) => {this.selectedEdgeIdx = i; this.makeText('l')})
      .on('mouseout', (d, i) => this.makeText(''));


    // Make nodes
    graphHolder.selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', 10)
      .attr('cx', (d) => pos(d.x))
      .attr('cy', (d) => pos(d.y))
      .style('fill', '#fff')
      .style("stroke-width", '1px')
      .style("stroke", '#bbb')
      .on('mouseover', (d, i) => {this.selectedNodeIdx = i; this.makeText('n')})
      .on('mouseout', (d, i) => this.makeText(''));
  }

  makeText(lastHovered: 'n' | 'l' | 'g' | '') {
    this.textHolder.selectAll('*').remove();
    const makeLine = (label, d, key) => {
      const selected = lastHovered === key;
      const div = this.textHolder.append('div')
        .classed('lines', true)
        .classed('selected', selected)

      const height = 20;
      const width = 20;
      div.append('div')
        .text(label)
      div
        .append('svg')
        .style('height', height)
        .selectAll('rect.emb')
        .data(d.embedding)
        .enter()
        .append('rect.emb')
        .attr('height', d => d.h * height)
        .attr('width', width)
        .attr('x', (d, i) => i * width)
        .attr('y', (d, i) => height - d.h * height)
        .attr('fill', dchild => d.color.darker(0.5 - dchild.h*1.1))
        .attr('stroke', 'white');
    }

    makeLine('Vertex (or node) embedding', this.nodes[this.selectedNodeIdx], 'n')
    makeLine('Edge (or link) attributes and embedding', this.links[this.selectedEdgeIdx], 'l')
    makeLine('Global (or master node) embedding', this.global[0], 'g')

    this.parent.selectAll('circle')
      .style("stroke-width", (d, i) => this.selectedNodeIdx == i ? 6 : 1)
      .style("stroke", (d, i) => this.selectedNodeIdx == i ? d.color : '#aaa');

    this.parent.selectAll('line.vis')
      .style("stroke-width", (d, i) => this.selectedEdgeIdx == i ? 10 : 1)
      .style("stroke", (d, i) => this.selectedEdgeIdx == i ? d.color : '#bbb');
  }
}