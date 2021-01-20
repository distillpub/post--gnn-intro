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
import { makeGraph, sleep, oneSwap, range } from '../utils';

export class ShuffleDiagram {
  parent = d3.select('#shuffle-diagram').classed('chart-yellow-bg', true);
  graphAdjHolder = this.parent.append('div').at({id: 'svgs-holder'});
  button = this.addShuffleButton();
  numNodes = 6;
  r = 12;
  order = range(this.numNodes);
  constructor() {
    const [nodes, links] = makeGraph(this.numNodes, this.numNodes, false);
    this.showGraph(nodes, links);
    this.showAdjMat(nodes, links);
  }

  showGraph(nodes, links) {
    const holder = this.graphAdjHolder.append('svg').classed('graphHolder', true).attr('font-size', '11px');
    const scale = 150;
    const pos = (x) => (x + .75) * scale;

    // Make the edges
    holder.selectAll(`line`)
      .data(links)
      .enter()
      .append('line')
      .style("stroke", "steelblue")
      .style("stroke-width", 1)
      .attr("x1", (d) => pos(d.a.x))
      .attr("x2", (d) => pos(d.b.x))
      .attr("y1", (d) => pos(d.a.y))
      .attr("y2", (d) => pos(d.b.y));

    // Make nodes
    const nodesHolder = holder.selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('transform', d => `translate(${pos(d.x)}, ${pos(d.y)})`)

    nodesHolder
      .append('circle')
      .attr('r', this.r)
      .attr('fill', 'white')
      .attr('stroke', '#000')
    this.addLabels(nodesHolder)
  }

  showAdjMat(nodes, links) {
    const holder = this.graphAdjHolder.append('svg').classed('adjMatHolder', true).attr('font-size', '11px')
      ;
    // Make circles on top
    const w = 25;
    const r = this.r;
    const top = holder.append('g');
    const topCircles = top.selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('transform', (d, i) => `translate(${(this.order[i] + 1) * w}, ${w})`)
    this.addLabels(topCircles)

    // Make circles on left
    const grid = holder.append('g');
    const downTransform = (i) => `translate(0px, ${(i + 1) * w}px)`;
    const linesGroup = grid.selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .style('transform', (d, i) => downTransform(i));

    const circleGroup = linesGroup.append('g')
      .attr('transform', `translate(0, ${w})`)
    this.addLabels(circleGroup)

    const rects = linesGroup.selectAll('rect')
      .data(nodes)
      .enter()
      .append('rect')
      .attr('y', w / 2)
      .attr('x', (d, i) => (this.order[i] + .5) * w)
      .attr('width', w)
      .attr('height', w)
      .attr('fill', function (d) {
        const parD = d3.select(this.parentNode).datum();
        return parD.neighbors.includes(d) ? 'steelblue' : '#fff';
      })
      .style("stroke", "#aaa")

    // When the grid is clicked, shuffle the elements.
    this.button.on('click', async () => {
      // Swap two horizontal lines
      oneSwap(this.order);
      linesGroup
        .transition(1000)
        .style('transform', (d, i) => downTransform(this.order[i]));

      await sleep(500);
      // Swap the elements in the vertical lines.
      rects
        .transition(1000, 'linear')
        .attr('x', (d, i) => (this.order[i] + .5) * w);

      topCircles
        .transition(1000, 'linear')
        .attr('transform', (d, i) => `translate(${(this.order[i] + 1) * w}, ${w})`)
    })
  }
  private addShuffleButton() {
    return this.parent.append('button').attr('id', 'shuffle-button').html('Shuffle node order');
  }

  private addLabels(sel) {
    const g = sel.append('g');
    g.append('text')
      .text('V')
      .attr('transform', 'translate(-7, 4)')
    g.append('text')
      .text((d, i) => i)
      .attr('font-size', 8)
      .attr('transform', 'translate(1, 5)')
  }
}