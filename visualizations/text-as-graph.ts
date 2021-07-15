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
import { CIRC_FILL_BL } from '../utils';
const padding = 30
const wordSpacing = 30
const fontSize = 30
const charWidth = calcCharWidth();
const steelblue = d3.color('steelblue')
const blue = steelblue.darker(-.5);
const blueDark =steelblue.darker(2);

export class TextAsGraph {

  private rectSel;
  private textSel;
  private inputNode;
  private rectData;
  private sel = d3.select('#text-as-graph');
  private wordsHolder = this.sel.append('div');
  private coords = [null, null];
  private adjMatSel;

  constructor() {

    // Make the z index lower to make overflow go behind words.
    this.sel.parent().style('z-index', '-1')
    const c = d3.conventions({ sel: this.wordsHolder, margin: { left: 0 }, layers: 'sd', height: 250 });
    const [svgSel, divSel] = c.layers;

    divSel.st({ left: padding, top: 20 + padding, height: 30 })
    const that = this;
    const inputSel = divSel.append('input')
      .st({ 'word-spacing': wordSpacing + 'px', fontSize })
      .at({ maxlength: 30 })
      .on('input', () => this.render())
      .on('mousemove', function () {
        // Calculate what word we're on by figuring out how much space they each take up.
        const x = d3.mouse(this)[0];
        let offset = 0;
        let wordIdx = 0;
        for (let l of [...this.value]) {
          const isSpace = l == ' ';
          offset += isSpace ? charWidth + wordSpacing : charWidth;
          wordIdx += isSpace ? 1 : 0;
          if (offset > x) {
            that.hover(wordIdx, isSpace ? wordIdx - 1 : wordIdx);
            return;
          };
        };
      })
      .on('mouseout', d => this.hover())


    this.inputNode = inputSel.node();
    this.inputNode.value = 'Graphs are all around us';

    const height = 100; // height of input node

    this.rectData = d3.range(20).map(i => ({ i }));

    this.rectSel = svgSel.appendMany('rect', this.rectData)
      .at({ stroke: '#000', fill: d => `hsl(51, 100%, ${Math.random()*75 + 25}%)`, height: height / 2, y: height / 4, 'rx': height / 6, 'ry': height / 6 })
      .translate(padding, 0)
      .each(function (d) { d.rectSel = d3.select(this) })


    this.textSel = svgSel.appendMany('text', this.rectData)
      .text('→')
      .at({ y: height / 2, dy: '.33em', textAnchor: 'middle', fill: blue })
      .st({ fontSize: 30 })
      .translate(padding, 0)
      .each(function (d) { d.textSel = d3.select(this) })

    this.adjMatSel = this.sel.append('svg')
      .st({ position: 'absolute', top: 150, left: 50 })

    this.render();
  }
  private render() {
    this.rectSel.at({ opacity: 0 });
    this.textSel.at({ opacity: 0 });

    const words = this.inputNode.value.split(' ').map((word, i) => ({ word, i }));

    let x = 0;
    const pad = 5;
    const spaceWidth = charWidth + wordSpacing;

    words.forEach(d => {
      const width = d.word.length * charWidth;

      this.rectData[d.i].rectSel
        .at({ opacity: 1, x: x - pad, width: width + pad * 2 });

      x += width + spaceWidth;

      if (!words[d.i + 1]) return // skip arrow for last word

      this.rectData[d.i].textSel
        .at({ opacity: 1, x: x - spaceWidth / 2 })
    });

    // Center the words
    const width = this.wordsHolder.node().getBoundingClientRect().width;
    this.wordsHolder.st({ left: (width - x) / 2 })

    this.makeAdjMat(words);

  }


  private makeAdjMat(words) {
    this.adjMatSel.selectAll('*').remove();

    this.adjMatSel
      .attr('font-size', 12)
      .attr('fill', 'gray');
    const pairs = d3.cross(words, words);
    const w = 20;
    this.adjMatSel
      .selectAll('rect')
      .data(pairs)
      .enter()
      .append('rect')
      .attr('width', w)
      .attr('height', w)
      .attr('transform', d => `translate(${d[0].i * w}, ${d[1].i * w})`)
      .attr('fill', d => this.isEdge(d) ? blue : 'white')
      .attr('stroke', '#aaa')
      .attr('stroke-width', .2)
      .on('mouseover', d => this.hover(d[0].i, d[1].i))
      .on('mouseout', d => this.hover())

    // center adj matrix
    const width = this.wordsHolder.node().getBoundingClientRect().width;
    this.adjMatSel.st({ left: (width - w * words.length) / 2 });

    // Add top words
    this.adjMatSel.selectAll('text.top')
      .data(words)
      .enter()
      .append('text.top')
      .attr('transform', d => `translate(${d.i * w + w / 2}, -5) rotate(-90)`)
      .text(d => d.word);

    // Add side words
    this.adjMatSel.selectAll('text.side')
      .data(words)
      .enter()
      .append('text.side')
      .attr('transform', d => `translate(-5, ${(d.i + .75) * w})`)
      .attr('text-anchor', 'end')
      .text(d => d.word);
  }

  private isEdge(d) {
    return d[0].i - d[1].i === 1;
  }

  private hover(i?: number, j?: number) {
    if (this.coords[0] == i && this.coords[1] == j) {
      return;
    }
    this.coords = [i, j];
    // Update the adj mat square color
    this.adjMatSel.selectAll('rect')
      .attr('fill', d => !this.isEdge(d) ? 'white' : (d[0].i === i && d[1].i === j ? blueDark : blue));

    // highlight the text on the adj mat
    const highlightColor = '#000';
    this.adjMatSel.selectAll('text.top')
      .attr('fill', d => d.i === i ? highlightColor : 'gray')
      .style('font-weight', d => d.i === i ? 'bold' : '');
    this.adjMatSel.selectAll('text.side')
      .attr('fill', d => d.i === j ? highlightColor : 'gray');

    this.rectSel.each(
      dRectSel => {
        dRectSel.rectSel.at({
          stroke: d => (d.i === i || d.i === j) ? highlightColor : '#000',
          strokeWidth: d => (d.i === i || d.i === j) ? 3 : 1,
        })
        dRectSel.textSel.at({
          stroke: d => (d.i === j && j === i - 1) ? blueDark : blue,
          strokeWidth: d => (d.i === j && j === i - 1) ? 4 : 0,
          fill: d => (d.i === j && j === i - 1) ? blueDark : blue,
        }
        );
      }
}

function calcCharWidth() {
  const spanSel = d3.select('body').append('span').text('x')
    .st({ fontFamily: 'monospace', fontSize })
  const w = spanSel.node().offsetWidth;
  spanSel.remove();
  return w;
}