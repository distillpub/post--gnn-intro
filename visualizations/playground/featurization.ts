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


import {Config, GraphData, copy} from './util';
type TensorData = {
  dtype: string,
  name: string,
  value: any[]
}

export function makeTestConfig() {
  const config: Config = {
    nodeDefaultProps: {'prop_0': 1, 'prop_2': 0, 'prop_3': 0, 'prop_4': 0},
    edgeDefaultProps: {'prop_0': 1, 'prop_2': 0, 'prop_3': 0, 'prop_4': 0},
  }
  return config;
}

function wrapVal(name, dtype, value){
  return {
    name,
    dtype,
    value
  };
}

export function graphToTensors(graph: GraphData): TensorData[] {
  const gNodes = graph.nodes;
  const gEdges = graph.edges;

  const tNodesValue = gNodes.map(node => Object.values(node.properties));
  const tNodes = wrapVal('nodes', 'float32', tNodesValue);

  const tEdgesValue = gEdges.map(edge => Object.values(edge.properties));
  const tEdges = wrapVal('edges', 'float32', tEdgesValue);

  const tReceiversValue  = gEdges.map(edge => edge.target.index);
  const tReceivers = wrapVal('receivers', 'int32', tReceiversValue);

  const tSendersValue  = gEdges.map(edge => edge.source.index);
  const tSenders = wrapVal('senders', 'int32', tSendersValue);

  const tGlobalsValue = [[0]]; //Input globals are 0, for now.
  const tGlobals = wrapVal('globals', 'float32', tGlobalsValue);

  const tNumNodesValue = [gNodes.length];
  const tNumNodes = wrapVal('n_node', 'int32', tNumNodesValue);

  const tNumEdgesValue = [gEdges.length];
  const tNumEdges = wrapVal('n_edge', 'int32', tNumEdgesValue);

  return [tNodes, tEdges, tReceivers, tSenders, tGlobals, tNumNodes, tNumEdges]
}

export function tensorsToGraph(tensors) {
  const [tNodes, tEdges, tReceivers, tSenders, tGlobals, tNumNodes, tNumEdges] = tensors;
  const graph: GraphData = {
    'nodes': [],
    'edges': []
  }

  // Add node properties.
  tNodes.value.forEach(node => {
    const properties = {};
    node.forEach((j, prop) => { properties[`prop_${prop}`] =j });
    graph.nodes.push({ properties });
  });

  // Add edge properties and values.
  for (let i=0; i<tNumEdges.value; i++) {
    const source = tSenders.value[i];
    const target = tReceivers.value[i];
    const properties = {};
    tEdges.value[i].forEach((j, prop) => { properties[`prop_${prop}`] =j });
    graph.edges.push({
      properties,
      source,
      target
    });
  }

  return graph;
}