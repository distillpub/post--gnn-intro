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

export const CIRC_FILL_BL = 'rgb(179, 201, 204)';
export const CIRC_FILL_RD = 'rgb(241, 85, 85)';
export const BG_COLOR = 'rgb(255, 254, 247)';


/** Make a graph. Returns an array of node dicts.*/
export function makeGraph(numNodes, expNumEdges, addSelfLoops = true) {
  const idxs = range(numNodes);
  const nodes = idxs.map(i => {
    return {
      i: i, x: Math.cos(i / numNodes * 2 * Math.PI) / 2,
      y: Math.sin(i / numNodes * 2 * Math.PI) / 2, neighbors: [],
      color: d3.schemeDark2[i % 8]
    }
  })

  const links = [];

  // Add a link between two nodes
  const addNeighbor =
    (i, j) => {
      const a = nodes[i];
      const b = nodes[j];

      // Don't duplicate, but do add 1 edge for each direction.
      if (!a.neighbors.includes(b)) {
        a.neighbors.push(b);
        links.push({ a: a, b: b });
      }
      if (!b.neighbors.includes(a)) {
        b.neighbors.push(a);
        links.push({ a: b, b: a });
      }
    }

  // Add a bunch of random edges.
  for (let i = 0; i < expNumEdges; i++) {
    const idx = i % numNodes;
    if (addSelfLoops) {
      addNeighbor(idx, idx);
    }
    let neighIdx = Math.floor(random[i] * numNodes);
    if (idx != neighIdx) {
      addNeighbor(idx, neighIdx);
    }
  }

  return [nodes, links]
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function range(n: number) {
  return Array.from(Array(n).keys())
}

/**
 * Shuffles array in place. ES6 version
 * @param {Array} a items An array containing the items.
 */
export function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Performs a swap of two random elements in an array,
 * @param {Array} a items An array containing the items.
 */
export function oneSwap(a) {
  const i = Math.floor(Math.random() * a.length);
  const j = Math.floor(Math.random() * a.length);
  [a[i], a[j]] = [a[j], a[i]];

  return a;
}

export function transposeArray(array) {
  return array[0].map((col, i) => array.map(row => row[i]));
}

export const random = [0.8751547364867525, 0.48703812515796163, 0.8853204837081521, 0.03665311234463231, 0.23381064092464188, 0.1348978356430306, 0.22403539718976173, 0.3516201087350268, 0.7266955195539337, 0.6939039610600852, 0.8115480860772051, 0.942291564934004, 0.32194106866015937, 0.25009618855008653, 0.7080826345629236, 0.4939836911933573, 0.5014807336560756, 0.4737558995199409, 0.28710635767250237, 0.7964228372249633, 0.23253366029986888, 0.15483341728099065, 0.9345549284963193, 0.524955190250286, 0.6707212640501186, 0.7244359946992129, 0.7657905625129635, 0.8876179001611688, 0.9089860690353977, 0.24414589490697258, 0.5495009844296725, 0.24037904275862543, 0.23375887188493127, 0.4228034514858334, 0.8150696192224922, 0.9457617171748411, 0.9356088401710381, 0.19650389991765604, 0.8847894963326248, 0.35644919218553217, 0.5369822013711312, 0.8981427214369839, 0.12173002385407439, 0.7885399102681385, 0.6038962958499163, 0.9491701879192804, 0.504586805255812, 0.43381024751262043, 0.1192159581227159, 0.4637076888455671, 0.0664066640625911, 0.8116805145981689, 0.1688798619172125, 0.291941485508016, 0.03968541868376496, 0.44562044111161203, 0.3546124859624551, 0.4985561778061718, 0.9696307021061441, 0.7928660276262496, 0.8283640028953678, 0.29190842262392414, 0.5258805863949767, 0.5611161309056327, 0.32514113410708, 0.643317831977311, 0.7355739231040863, 0.4147825775759493, 0.33050996204386496, 0.008034734400914179, 0.6276950790241489, 0.9245137339797826, 0.472061301009185, 0.3532309299788585, 0.09164645791020698, 0.5156001816013349, 0.9119637599183463, 0.8756499936035242, 0.05716932192137447, 0.2314874929334958, 0.6953957713650021, 0.47350835075512365, 0.8084836033123066, 0.5699267565105148, 0.21852879642369216, 0.7243632224721468, 0.16131849951161392, 0.4720328938939866, 0.6657903175402973, 0.6945192084721554, 0.2291629468515488, 0.4649852497667464, 0.374672659806516, 0.7086801070542101, 0.9912449229828748, 0.5244383583477008, 0.08411007283516292, 0.19848866811984944, 0.15651572462481145, 0.5067791470738072];
