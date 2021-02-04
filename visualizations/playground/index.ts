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
import { Graph, Mode } from './graph';
import { copy, setDataInitPos, getKeyByValue } from './util';
import * as featurization from './featurization';
import { Model } from './tfjs-model';
import { pcaLayers } from './pca-layers';

const PRED_LABEL = 'pungent'

export class Playground {
  private model = new Model();
  private graph: Graph;
  private scatter: pcaLayers;
  private tensors;
  private predLabelIdx;
  private resetButton;
  private currGraphIdx = 0;
  private hparamMap;
  private y;
  private allPredLabels;

  constructor() {
    this.init();
  }
  data() {
    const root = 'https://storage.googleapis.com/gnn-distill/';
    return {
      x_test: root + 'x_test.json',
      y_test: root + 'y_test.json',
      labelid_to_name: root + 'labelid_to_name.json',
      nodeid_to_name: root + 'nodeid_to_name.json',
      edgeid_to_name: root + 'edgeid_to_name.json',
      hparam_map: root + 'hparam_map.csv',
      testConfig: featurization.makeTestConfig(),
      description: 'For this <b>graph level prediction task</b>, each graph is a molecule. The task is to predict whether or not a molecule will smell pungent. In the scatter plot, each point represents a graph.'
    };
  }
  async init() {
    d3.select('#playground').html(`
    <div id='container'>
      <div id='model-opts'>

        <div class='opts-col' id='opts-col-desc'>
          <div class='model-info-title'> Task </div>
          <div>
            <div class='model-param' id='description'></div>
          </div>
        </div>

        <div class='opts-col'>
          <div class='model-info-title'> Model Options </div>

          <div class='model-params'>
            <div class='model-param'>Depth
              <select id='depth-select' class='param'>
                <option value="1">1 layer</option>
                <option value="2">2 layers</option>
                <option value="3" selected>3 layers</option>
                <option value="4">4 layers</option>
              </select>
            </div>

            <div class='model-param'> Aggregation function
              <select id='aggregation-select' class='param'>
                <option value="mean">Mean</option>
                <option value="sum" selected>Sum</option>
                <option value="max">Max</option>
              </select>
            </div>

            <div class='model-param'> 
              <div>
                <input type="checkbox" id="node-emb-checkbox" class='param' checked>
                <label for="node-emb-checkbox">Node embedding size</label>
              </div>
              <select id='node-emb-select' class='param'>
                <option value="12">25</option>
                <option value="25" selected>50</option>
                <option value="50">100</option>
              </select>
            </div>

            <div class='model-param'> 
              <div>
                <input type="checkbox" id="edge-emb-checkbox" class='param' checked>
                <label for="edge-emb-checkbox">Edge embedding size</label>
              </div>
              <select id='edge-emb-select' class='param'>
                <option value="5">5</option>
                <option value="10" selected>10</option>
                <option value="20">20</option>
              </select>
            </div>

            <div class='model-param'> 
              <div>
                <input type="checkbox" id="global-emb-checkbox" checked class='param'>
                <label for="global-emb-checkbox">Global embedding size</label>
              </div>
              <select id='global-emb-select' class='param'>
                <option value="25">25</option>
                <option value="50" selected>50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class='opts-col'>
          <div class='model-info-title'> Model AUC </div>
          <div id='acc'> </div>
        </div>
      </div>

      <div id='svgs'>
        <div id='loader'></div>
        <div id='svg-holder' class='hidden'>
          <svg width="100%" height="500"></svg>
          <div id='warning' class='hidden'></div>
          <div id='button-holder'>
            <div class='button disabled' id='reset'>Reset</div>
          </div>

          <div class='model-pred-holder'>
            <div class='simple-title'>Model Prediction</div>
            <div class='output' id='model-pred'></div>
            <div class='simple-title'>Ground Truth</div>
            <div class='output' id='ground-truth'></div>
          </div>
        </div>

        <div id='model-outputs'>
          <div id='scatter-holder'></div>
          <div id='epoch-slider-holder'> 
            <div>epoch: <span id='epoch'></span></div>
            <input type="range" min="0" max="101" value="10" step='1' id="epoch-slider"> 
          </div>
        </div>
        </div>
      </div>`);
    this.initModelButtonClickhandlers();
    this.initEpochsSliderHandlers();
    this.initCheckboxHandlers();
    await this.loadData();
    await this.createGraph();
    await this.findMatchingParam();
    this.addLegend();
    this.molEditedCallback(this.graph.data, true);
    this.toggleLoading(false);
  }

  private async modelUpdated(id) {
    this.toggleLoading(true, true);
    await this.model.initModel(id);
    await this.createScatter();
    this.molEditedCallback(this.graph.data, true);
    this.toggleLoading(false);
  }

  async loadData() {
    this.tensors = await d3.json(this.data().x_test);
    this.y = (await d3.json(this.data().y_test))[0].value;
    this.allPredLabels = await d3.json(this.data().labelid_to_name);
    this.predLabelIdx = getKeyByValue(this.allPredLabels, PRED_LABEL);
    this.hparamMap = (await d3.csv(this.data().hparam_map));
  }

  async createGraph() {
    const newGraph = featurization.tensorsToGraph(this.tensors[this.currGraphIdx]);
    setDataInitPos([newGraph]);
    this.graph = new Graph(copy(newGraph), this.data().testConfig, (data) => this.molEditedCallback(data));
  }

  private async molEditedCallback(data, showGroundTruth = false) {
    this.resetButton.classed('disabled', showGroundTruth)
    const tensors = featurization.graphToTensors(data);
    const predAndPCA = await this.model.runModel(tensors);

    // Sometimes the pca and preds are in reverse order from the model.
    let pred, pca;
    if (predAndPCA[0][0].length === 2) {
      [pca, pred] = predAndPCA;
    } else {
      [pred, pca] = predAndPCA;
    }

    const epochChangeCallback = () => this.setWarningMsg(true)
    this.scatter.updateDatapoint(pca[0], pred[0], this.currGraphIdx, epochChangeCallback);

    this.setPred(pred[0][0]);
    this.setGT(showGroundTruth);
  }

  private setGT(showGroundTruth) {
    const rawGroundTruth = this.y[this.currGraphIdx][this.predLabelIdx];
    const groundTruth = showGroundTruth ? (rawGroundTruth ? PRED_LABEL : `not ${PRED_LABEL}`) : 'unknown';
    const color = showGroundTruth ? this.scatter.color(rawGroundTruth) : '#777';
    d3.select('#ground-truth')
      .html(groundTruth)
      .style('color', color);
  }

  // Update the visualization to use a different graph.
  private updateGraph(i: number) {
    this.currGraphIdx = i;
    const newGraph = featurization.tensorsToGraph(this.tensors[this.currGraphIdx]);
    setDataInitPos([newGraph]);
    this.graph.updateData(newGraph);

    const epoch = d3.select('#epoch-slider').node().value;
    this.setPred(this.model.preds[this.currGraphIdx][0][epoch]);
    this.setGT(true);
  }

  // Create the scatterplot.
  private async createScatter() {

    const pca = this.model.pca;
    const num_datapoints = pca.length;
    const scatterData = [];
    for (let epoch_idx = 0; epoch_idx < pca[0][0].length; epoch_idx++) {
      const epochData = []
      for (let datapoint_idx = 0; datapoint_idx < num_datapoints; datapoint_idx++) {
        const xPos = pca[datapoint_idx][0][epoch_idx];
        const yPos = pca[datapoint_idx][1][epoch_idx];
        const datapoint = {
          pos: [xPos, yPos],
          pred: this.model.preds[datapoint_idx][0][epoch_idx],
          label: this.y[datapoint_idx][this.predLabelIdx]
        }
        epochData.push(datapoint);
      }
      scatterData.push(epochData);
    }

    this.updateUIWithModelInfo(scatterData);
    this.setAcc(scatterData.length - 1);

    // Make the scatterplot itself.
    const clickCallback = (i) => this.updateGraph(i);
    this.scatter = new pcaLayers(d3.select('#scatter-holder'), scatterData, clickCallback, this.currGraphIdx);
  }

  private setAcc(epoch) {
    d3.select('#acc').html((1*this.model.stats[epoch].test_auc).toFixed(2));
  }

  private pct(val, decimalPlaces = 1) {
    return (val * 100).toFixed(decimalPlaces) + '%';
  }

  private initModelButtonClickhandlers() {
    this.resetButton = d3.select('#reset');
    this.resetButton.on('click', () => this.reset())

    // Add buttons and handlers.
    d3.select('#add').on('click', () => this.graph.setMode(Mode.Add));
    d3.select('#remove').on('click', () => this.graph.setMode(Mode.Remove));
  }

  private initEpochsSliderHandlers() {
    const slider = d3.select('#epoch-slider');
    const epochDiv = d3.select('#epoch');
    slider.on('input', () => {
      console.log('INPUT')
      const epoch = slider.node().value;
      this.scatter.setLayer(epoch, 250);
      this.setAcc(epoch);
      epochDiv.html(epoch);
      this.setPred(this.model.preds[this.currGraphIdx][0][epoch])

      // If the molecule has been edited, show warning and revert it.
      if (!this.resetButton.classed('disabled')) {
        this.setWarningMsg(false);
        this.reset();
      }
    });
  }

  private setPred(rawPred) {
    const pred = this.pct(rawPred, 0);
    d3.select('#model-pred').html(`${pred} ${PRED_LABEL}`).style('color', this.scatter.color(rawPred));
  }

  private initCheckboxHandlers() {
    d3.selectAll('.param').on('change', () => this.findMatchingParam());
  }

  private async findMatchingParam() {
    const nodeCheckVal = d3.select('#node-emb-checkbox').node().checked;
    const edgeCheckVal = d3.select('#edge-emb-checkbox').node().checked;
    const globalCheckVal = d3.select('#global-emb-checkbox').node().checked;

    const nodeSelVal = d3.select('#node-emb-select').node().value;
    const edgeSelVal = d3.select('#edge-emb-select').node().value;
    const globalSelValue = d3.select('#global-emb-select').node().value;

    const depthVal = d3.select('#depth-select').node().value;
    const aggVal = d3.select('#aggregation-select').node().value;

    const v = (i, val) => this.hparamMap[i][val];

    const modelId = Object.keys(this.hparamMap).find(key =>
      (nodeCheckVal === (v(key, 'learn_nodes') == 'True')) &&
      (edgeCheckVal === (v(key, 'learn_edges') == 'True')) &&
      (globalCheckVal === (v(key, 'learn_globals') == 'True')) &&

      (nodeSelVal === v(key, 'node_dim')) &&
      (edgeSelVal === v(key, 'edge_dim')) &&
      (globalSelValue === v(key, 'globals_dim')) &&

      (depthVal === v(key, 'n_layers')) &&
      (aggVal === v(key, 'aggregation_type'))
    );
    await this.modelUpdated(modelId);
  }

  private updateUIWithModelInfo(data) {
    // Set the max slider value
    const slider = d3.select('#epoch-slider');
    const dLength = data.length - 1;
    slider.attr('max', dLength);
    d3.select('#epoch').html(dLength);

    // Set the description
    d3.select('#description').html(this.data().description);
  }

  private toggleLoading(hide = false, halfscreen = false) {
    d3.select('#svg-holder').classed('hidden', hide && !halfscreen);
    d3.select('#model-outputs').classed('hidden', hide);
    d3.select('#loader').classed('hidden', !hide).classed('halfscreen', halfscreen);
  }

  private async addLegend() {
    // Add atom legend
    const idsToName = ['Carbon', 'Nitrogen', 'Oxygen', 'Sulphur'];
    d3.select('#svg-holder')
      .append('div')
      .classed('legend', true)
      .html(`
        ${this.graph.nodeColors.map((color, i) => `
        <div class='legend-line'>
          <div style='color:${color}'>${idsToName[i]}</div>
        </div>
        `).join('')}
      `);

    // Add edge legend
    const edgeLegendInfo = [
      ['&nbsp&nbsp Single Bond', ['–'], 'scale(2.5, 1)'],
      ['&nbsp&nbsp Double Bond', ['='], 'scale(2.5, 1)'],
      ['&nbsp Triple Bond', ['≡'], 'scale(2.5, 1)'],
      ['Aromatic Bond', ['≡', '≡'], 'rotate(90deg) translateY(3px) scale(1, 1.3)']];
    d3.select('#svg-holder')
      .append('div')
      .classed('legend', true)
      .attr('id', 'edge-legend')
      .html(`
        ${edgeLegendInfo.map((i) => `
        <div class='legend-line' >
            ${i[1].map(symb => `<div style='transform: ${i[2]}'> ${symb}</div>`).join('')} 
           ${i[0]}
        </div>
        `).join('')}
      `);
  }

  private setWarningMsg(molEdited) {
    let text = 'Model predictions for edited molecules are only available for the fully trained model. '
    text += molEdited ?
      'Displaying predictions from the last epoch.' :
      'Reseting molecule.'
    const warning = d3.select('#warning');
    warning.html('<b>Warning: </b>' + text)
      .classed('hidden', false);
    setTimeout(() => warning.classed('hidden', true), 7000);

  }

  private reset() {
    this.graph.resetData();
    this.updateGraph(this.currGraphIdx);
    this.resetButton.classed('disabled', true);
  }
}
