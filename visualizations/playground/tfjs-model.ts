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


import * as tf from '@tensorflow/tfjs';
import * as d3 from 'd3';

tf.setBackend('cpu');
console.log(tf.version);

export class Model {
  private model: tf.GraphModel;
  preds;
  pca;
  stats;
  /** for debugging (only log outputs once) */
  private logged = true;
  constructor() {
    registerOps();
  }

  async initModel(modelId: number) {

    if (this.model) {
      this.model.dispose();
    }

    const root = `https://storage.googleapis.com/gnn-distill/hparams/${modelId}/`;
    this.pca = (await d3.json(root + 'emb_pca_test.json'))[0].value;
    this.preds = (await d3.json(root + 'pred_test.json'))[0].value;
    this.model = await tf.loadGraphModel(root + 'tfjs/model.json');
    this.stats = (await d3.csv(root + 'stats.csv'));
  }

  async runModel(inputs, tensorName = null) {
    // Fix the tensor order.
    inputs = this.fixInputsOrder(inputs);
    this.logAllOpShapes(inputs);

    // Run the model
    const output = tensorName ? this.model.execute(inputs, tensorName) : this.model.predict(inputs);
    const out = output.length ? output.map(out => out.arraySync()) : output.arraySync();
    return out
  }

  /**
   * Due to esoteric dict ordering inconsistencies, reorder the input tensors based
   * on the order of the graph's inputs (which are called, e.g., "input_0")
   */
  private fixInputsOrder(tensors) {
    const inputs = new Array(tensors.length)
    const inputNames = this.model.executor._inputs.map(x => x.name);
    const sortedInputNames = [...inputNames].sort();
    for (let i = 0; i < inputNames.length; i++) {
      const idx = sortedInputNames.indexOf(inputNames[i]);
      const t = tensors[idx];
      inputs[i] = tf.tensor(t.value, undefined, t.dtype);
    }
    return inputs;
  }

  /**
   * Log the output shapes of all ops in the graph. For debugging purposes.
   */
  private logAllOpShapes(tensors) {
    if (!this.logged) {
      this.model.artifacts.modelTopology.node.forEach(node => {
        const res = this.model.execute(tensors, node.name);
        console.log(node.name, res.shape);
      });
      this.logged = true;
    }
  }
}

function registerOps() {
  const cumsum = (node) => {
    const x = node.inputs[0];
    const axis = node.inputs[1];
    const exclusive = node.attrs['exclusive'];
    const reverse = node.attrs['reverse'];
    return tf.cumsum(x, axis, exclusive, reverse);
  }

  const UnsortedSegmentSum = (node) => {
    const x = node.inputs[0];
    const segmentIds = node.inputs[1].asType('int32');
    const numSegments = node.inputs[2].asType('int32');
    return tf.unsortedSegmentSum(x, segmentIds, numSegments.arraySync());
  }

  tf.registerOp('Cumsum', cumsum);
  tf.registerOp('UnsortedSegmentSum', UnsortedSegmentSum);
}