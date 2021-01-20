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

export declare interface Props {
  [key: string]: string | number
}

export declare interface Node {
  initX?: number;
  initY?: number;
  properties?: Props;
  [key: string]: any;
}

export declare interface Edge {
  source: number | Node;
  target: number | Node;
  properties?: Props;
  [key: string]: any;
}

export declare interface Config {
  nodeDefaultProps: Props
  edgeDefaultProps: Props
}

export declare interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

export function sleep(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

export function copy(obj: object) {
  return JSON.parse(JSON.stringify(obj));
}

export function setDataInitPos(data: any[]) {
  for (let i = 0; i < data.length; i++) {
    const svg = d3.select("svg");
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    data[i].nodes.forEach((d, j) => {
      if (!d.processed) {
        if (d.initX) {
          d.initX = Math.floor(parseFloat(d.initX) * 40 + width / 2);
          d.initY = Math.floor(parseFloat(d.initY) * 40 + height / 2);
        } else {
          const [x, y] = getCircXY(j, data[i].nodes.length, width, height);
          d.initX = x;
          d.initY = y;
        }
        d.x = d.initX;
        d.y = d.initY;
        d.id = j;
        d.processed = true;
      }
    })
  }
}

function getCircXY(i, length, w, h) {
  const x = Math.floor(Math.cos(i / length * 2 * Math.PI) * 100 + w / 2);
  const y = Math.floor(Math.sin(i / length * 2 * Math.PI) * 100 + h / 2);
  return [x, y];
}

export function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}