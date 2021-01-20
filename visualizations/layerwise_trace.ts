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
import {makeGraph, sleep} from '../utils';

const hexColor = ["#f2b200", "#c69700", "#ffeaa9", "#ffd255", "#d19f00", "#edc949", "#f2b200", "#c69700", "#ffeaa9", "#ffd255", "#d19f00", "#edc949", "#f2b200", "#c69700", "#ffeaa9", "#ffd255", "#d19f00", "#edc949"]
const color = hexColor.map(c => d3.color(c))

export class LayerwiseTrace {
  parent = d3.select('#layerwise-trace');
  numLayers = 4;
  numNodes = 5;
  highlightCancelled = false;
  zIdxCounter = 0;
  constructor() {
    const [nodes, links] = makeGraph(this.numNodes, this.numNodes*2);
    for (let layer=this.numLayers-1; layer>-1; layer--){
      this.showGraph(nodes, links, layer);
    }
    for (let layer=0; layer < this.numLayers; layer ++){
      this.addLayerLines(links, layer);
    }
    this.showLines(false);
  }

  showGraph(nodes, links, layer) {

    const localOffset = .75;
    const localScale = 200;
    const pos = (x)  => (x + localOffset) * localScale;

    const layerGap = 170;
    const fullWidth = 700;
    const leftPad = fullWidth - layerGap * this.numLayers + 50;


    const layerDiv = this.parent;

    layerDiv
      .append('div')
      .classed('lines-holder-div', true)
      .style('z-index', this.zIdxCounter++)
      .append('svg')
      .attr('id', `layer_${layer}`)

    layerDiv.append('text')
      .text('Layer ' + layer)
      .style('font-size', '16px')
      .style('font-weight', '600')
      .attr('x', leftPad - 200)
      .attr('y', 50)

    const graphDiv = layerDiv.append('div')
      .classed('graph-div', true)
      .style('left', layer*200 + 'px')
      .style('z-index', this.zIdxCounter++)

    const holder = graphDiv.append('svg').classed('holderAll', true);
    const graphHolder = holder
      .append('g')
      .classed('holder', true)
      
    // Make the edges
    graphHolder.selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .style("stroke", "#ccc")
      .style("stroke-width", 1)
      .attr("x1", (d) => pos(d.a.x))
      .attr("x2", (d) => pos(d.b.x))
      .attr("y1", (d) => pos(d.a.y))
      .attr("y2", (d) => pos(d.b.y));

    // Make nodes
    const darker = layer/2;
    graphHolder.selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', 15)
      .attr('id', d => this.id(layer, d.i))
      .attr('cx', (d) => pos(d.x))
      .attr('cy', (d) => pos(d.y))
      .style('fill', d=> color[d.i].darker(darker))
      .style("stroke", d=> color[d.i].darker(darker).darker(1))
      .on('mouseenter', (d) => {
        this.highlightCancelled = false;
        this.selectHeirarchy(layer, d, true);
      })
      .on('mouseout', (d) => {
        this.highlightCancelled = true;
        this.deselectAll();
      })
      .on('click', (d) => {
        this.highlightCancelled = false;
        this.selectHeirarchy(layer, d, false);
      })
  }

  addLayerLines(links, layer){
    if (layer < this.numLayers - 1) {
      d3.select(`#layer_${layer}`).selectAll('line.link')
        .data(links)
        .enter()
        .append('line')
        .style("stroke", '#000')
        .style('stroke-opacity', 0)
        .style("stroke-width", 1)
        .attr('stroke-dasharray', "2, 2")
        .attr("class", (d) => this.id(layer, d.a.i))
        .classed('link', true);
    }
  }

  bbox(l, i) {
    return d3.select('#' + this.id(l, i)).node().getBoundingClientRect()
  };

  id(layer, i){
    return `layer${layer}_id_${i}`;
  };

  async selectHeirarchy(layer, d, count) {
    if (this.highlightCancelled) {
      return this.deselectAll();
    }
    if (count > this.numLayers) {
      return;
    }

    // Utility function to set the selected value based on the data.
    const setSel = (l, i) => d3.select('#' + this.id(l, i)).classed('selected', true);

    // Select yourself.
    setSel(layer, d.i);
    await sleep(500);
    if (this.highlightCancelled) {
      return this.deselectAll();
    }

    this.showLines(true, layer, d.i)

    // Select all neighbors in the previous layer (and back and back.)
    await sleep(500);
    d.neighbors.forEach(n => {
      this.selectHeirarchy(layer + 1, n, count+1)
    })
  }

  showLines(selected, layer?:number, i?:number) {
    const offset = this.parent.node().getBoundingClientRect();
    const leftOffset = offset.left - 15;
    const topOffset = offset.top - 15;

    if (selected && i !== undefined) {
      d3.selectAll('.' + this.id(layer, i))
        .classed('selected', true)
        .transition()
        .duration(1000)
        .attr("x1", (d) => this.bbox(layer, d.a.i).left - leftOffset)
        .attr("x2", (d) => this.bbox(layer+1, d.b.i).left - leftOffset)
        .attr("y1", (d) => this.bbox(layer, d.a.i).top - topOffset)
        .attr("y2", (d) => this.bbox(layer+1, d.b.i).top - topOffset);
    } else {
      for (let layer=0; layer<this.numLayers; layer++){
        d3.select(`#layer_${layer}`).selectAll('line.link')
          .attr("x1", (d) => this.bbox(layer, d.a.i).left - leftOffset)
          .attr("x2", (d) => this.bbox(layer, d.a.i).left - leftOffset)
          .attr("y1", (d) => this.bbox(layer, d.a.i).top - topOffset)
          .attr("y2", (d) => this.bbox(layer, d.a.i).top - topOffset)
      }
    }
  }

  deselectAll() {
    this.parent.selectAll('.selected')
      .classed('selected', false)
    this.showLines(false);
  }
}