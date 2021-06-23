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
import * as d3_jp from 'd3-jetpack';

const c0 = "#8ab0b5";
const c1 = "#f15555";
export class pcaLayers {
  private r = 5;
  private sNodeSel;
  private s;
  private currLayerIdx = 0;
  private xScales = [];
  private yScales = [];
  color;
  constructor(private parent, private scatterData, private clickCallback, private selIdx) {
    this.init();
  }
  
  // Initialize scatter plot, with PCA transformed embeddings 
  private async init() {
    var sel = this.parent.html('')
    var leftSel = sel.append('div.left')

    const w = Math.min(d3.select('#model-outputs').node().getBoundingClientRect().width, 525);
    this.s = d3_jp.conventions({
      sel: leftSel.append('div'),
      width: w,
      height: 525,
      margin: { left: this.r, top: this.r, right: this.r, bottom: this.r }
    });

    // Add the legend
    this.addLegend();

    // Get the ranges for each layer.
    this.currLayerIdx = this.lastLayer();
    const lastLayer = this.scatterData[this.currLayerIdx];

    this.scatterData.forEach((layerData) => {
      const xScale = d3.scaleLinear().domain(d3.extent(layerData.map(d => d.pos[0])));
      const yScale = d3.scaleLinear().domain(d3.extent(layerData.map(d => d.pos[1])));
      this.xScales.push(xScale);
      this.yScales.push(yScale);
    });

    this.color = d3.scaleLinear()
      .domain([0, 1])
      .range([c0, c1]);  

    // Make the actual node selections.
    this.sNodeSel = this.s.svg.appendMany('circle.node', lastLayer)
      .translate(d => this.scalePos(d.pos))
      .call((d) => this.styleNode(d));
    this.nodeSel = sel.selectAll('.node');
    this.setLayer(this.currLayerIdx);
  }
  private addLegend() {

    // Add the prediction and label legend
    this.s.sel
      .append('div')
      .classed('model-pred-holder', true)
      .html(`
      <div class='simple-title flex'> 
        Model Prediction &nbsp 
        <div class='legend-circ'></div>
      </div>
      <div class='simple-title flex'>
        Ground Truth &nbsp 
        <div class='legend-circ outline'></div>
      </div>
      <div class='simple-title'>Pungent</div>
      <div class='legend-range-holder simple-title'>
        <div class='legend-range-labels'> <div> 0% </div> <div>100%</div> </div>
        <div class='legend-range' style='background:linear-gradient(${c0}, ${c1})'></div>
      </div>
      `);
  }

  scalePos(initPos) {
    const x = this.xScales[this.currLayerIdx](initPos[0]) * this.s.width;
    const y = this.yScales[this.currLayerIdx](initPos[1]) * this.s.width;
    return [x, y]
  }

  lastLayer() {
    return this.scatterData.length - 1;
  }
  // Layer selection callback. Set initial layer to last.
  setLayer(layerIndex, dur = 0) {
    this.currLayerIdx = layerIndex;
    this.updateNodes(dur);
    d3.select('#epoch-slider').node().value = layerIndex.toString();
    d3.select('#epoch').html(layerIndex);
  }

  // Update the node selection.
  private updateNodes(dur) {
    this.sNodeSel.data(this.scatterData[this.currLayerIdx])
    this.sNodeSel
      .transition().ease(d3.easeCubicOut).duration(dur)
      .translate(d => this.scalePos(d.pos))
      .at({
        fill: (d, i) => this.selIdx == i ? d3.color(this.color(d.pred)).darker() : this.color(d.pred),
        stroke: (d, i) => this.selIdx == i ? d3.color(this.color(d.label)).darker() : this.color(d.label),
        opacity: (d, i) => this.selIdx == i ? 1 : 0.75,
        r: (d, i) => this.selIdx == i ? this.r * 2 : this.r
      });


    this.sNodeSel.filter(d => d.label).raise();
    this.sNodeSel.filter((d, i) => this.selIdx == i).raise();
  }

  private styleNode(sel){
    const that = this;
    sel
      .at({
        fill: d => this.color(d.pred),
        stroke: d => this.color(d.label),
        'stroke-width': 1.5,
        fillOpacity: .7,
      })
      .on('click', (d, i) => {
        this.selIdx = i;
        this.clickCallback(this.selIdx);
        this.updateNodes(250);
      })
      .on('mouseover', function (d) {d3.select(this).at({fillOpacity: 1}) })
      .on('mouseout', function (d, i) {
        d3.select(this).at({fillOpacity: that.selIdx == i ? 1 : 0.7})
      })
  }

  // Update a datapoint's value in the vis.
  updateDatapoint(pca, pred, dataIdx, epochChangeCallback) {
    if (this.currLayerIdx != this.lastLayer()) {
      epochChangeCallback();
    }
    this.setLayer(this.lastLayer());
    this.scatterData[this.currLayerIdx][dataIdx].pos = pca;
    this.scatterData[this.currLayerIdx][dataIdx].pred = pred;
    this.updateNodes(250);
  }
}