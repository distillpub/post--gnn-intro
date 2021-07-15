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


export class GraphDescription {
  parent = d3.select('#graph-description');
  svg = this.parent.append('svg');
  numNodes = 5;
  constructor() {
    const [nodes, links] = makeGraph(this.numNodes, this.numNodes * 2);
    this.showGraph(nodes, links);
    this.showText();
  }

  showGraph(nodes, links) {
    const localOffset = 0.6;
    const localScale = 200;
    const pos = (x) => (x + localOffset) * localScale;

    const graphHolder = this.svg.append('g');

    // Make global box
    graphHolder.append('rect')
      .attr('width', 250)
      .attr('height', 250)
      .attr('x', 0)
      .attr('y', -10)
      .attr('rx', 20)
      .attr('fill', '#fff')
      .attr('stroke', '#ddd')
      .style("stroke-width", 2)
      .attr('stroke-dasharray', "4, 4")
      .on('mouseover', () => this.highlightGlobal())
      .on('mouseout', () => this.unhighlightAll());
      
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
    .style("stroke", "rgba(0, 0, 0, 0")
    .style("stroke-width", 20)
    .attr("x1", (d) => pos(d.a.x))
    .attr("x2", (d) => pos(d.b.x))
    .attr("y1", (d) => pos(d.a.y))
    .attr("y2", (d) => pos(d.b.y))
    .on('mouseover', () => this.highlightEdges())
    .on('mouseout', () => this.unhighlightAll());

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
      .on('mouseover', () =>  this.highlightNodes())
      .on('mouseout', () => this.unhighlightAll());
  }

  showText() {
    const textHolder = this.parent.append('div').classed('line-holder', true);

    const makeLine = (letter, desc, eg, mouseover) => {
      const div = textHolder.append('div')
        .classed('line-holder', true)
        .attr('id', letter);
      div.append('div').text(letter).classed('letter', true);
      div.append('div').text(desc).classed('desc', true);
      div.append('div').text(eg).classed('eg', true);

      div.on('mouseover', mouseover);
      div.on('mouseout', () => this.unhighlightAll()));
    }

    makeLine('V', 'Vertex (or node) attributes', 'e.g., node identity, number of neighbors', () => this.highlightNodes())
    makeLine('E', 'Edge (or link) attributes and directions', 'e.g., edge identity, edge weight', () => this.highlightEdges())
    makeLine('U', 'Global (or master node) attributes', 'e.g., number of nodes, longest path', () => this.highlightGlobal())
  }
  highlightEdges() {
    this.parent.select('#E').classed('selected', true);
    this.parent.selectAll('line.vis')
      .style("stroke", "#000")
      .style("stroke-width", 10)
  }

  highlightNodes() {
    this.parent.select('#V').classed('selected', true);
    this.parent.selectAll('circle')
      .style("stroke-width", 6)
      .style("stroke", '#000')
      .attr("r", 11)
  }

  highlightGlobal() {
    this.parent.select('#U').classed('selected', true);
    this.parent.selectAll('rect')
      .style("stroke", '#000')
      .style("stroke-width", 8);
  }

  unhighlightAll() {
    this.parent.selectAll('*').classed('selected', false);
    this.parent.selectAll('line.vis')
      .style("stroke", "#bbb")
      .style("stroke-width", '1px');

    this.parent.selectAll('circle')
    .style("stroke-width", '1px')
    .style("stroke", '#aaa')
    .attr("r", 10);

    this.parent.selectAll('rect')
      .style("stroke-width", 2)
      .style("stroke", '#ddd')
  }
}