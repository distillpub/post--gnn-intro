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

d3.keys(d3_jp).forEach(key => {
  try {
    d3[key] = d3_jp[key];
  } catch (e) {
  }
});
import {graphLevel} from './visualizations/graph-level';
import {graphToTensor} from './visualizations/graph-to-tensor';
import {imageAsGraph} from './visualizations/image-as-graph';
import {LayerwiseTrace} from './visualizations/layerwise_trace';
import {XsAsGraphs} from './visualizations/mols-as-graph';
import {nodeLevel} from './visualizations/node-level';
import {pcaLayers} from './visualizations/pca-layers';
import {nodeStep} from './visualizations/node-step';
import {nodeStepSmall} from './visualizations/node-step-small';
import {shuffleSm} from './visualizations/shuffle-sm';
import {poolingTable} from './visualizations/pooling-table';
import {TextAsGraph} from './visualizations/text-as-graph';
import {Playground} from './visualizations/playground/index';
import { GraphDescription } from './visualizations/graph-description';
import { Table } from './visualizations/table';
import { GraphDescriptionEmbeddings } from './visualizations/graph-description-embeddings';


window.onload = function() {
  pcaLayers();
  nodeStepSmall();
  poolingTable();
  nodeLevel();
  graphLevel();
  graphToTensor();
  nodeStep();
  shuffleSm();
  new LayerwiseTrace();
  new TextAsGraph();
  new XsAsGraphs();
  new Playground();
  new GraphDescription();
  new GraphDescriptionEmbeddings();
  imageAsGraph();
  new Table();
};
