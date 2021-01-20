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


import * as d3 from 'd3'
import * as d3_jp from 'd3-jetpack'

d3.keys(d3_jp).forEach(key => {
  try{
    d3[key] =  d3_jp[key]
  } catch(e) {}
})

export function poolingTable() {
  var sel = d3.select('#pooling-table').html('')
    .classed('chart-yellow-bg', 1)

  var comparisons = [
    [[2, 4], [4, 4]],
    [[3, 3], [3, -1]]
  ]
  var colWidth = 350

  var comparisonSel = sel.appendMany('div', comparisons)
    .st({width: colWidth, display: 'flex'})

  var colSel = comparisonSel.appendMany('div', d => d)
    .st({width: colWidth/2, display: 'flex'})
    .each(drawCol)

  function drawCol(d, i){
    var sel = d3.select(this)

    var s = 15
    var h = s*5
    var w = colWidth/5 + 10

    var rScale = d3.scaleSqrt().range([0, s])

    var pos = [
      [0, 0],
      [w, 0],
      [w/2, h]
    ]

    var svg = sel.append('svg')
      .at({width: w - 20, height: h + 230})
      .st({overflow: 'visible'})
      .append('g').translate([50, s + 20])
    addArrowHead(svg)

    svg.appendMany('path', [0, 1])
      .at({
        d: i => ['M', pos[i], 'L', lerp2(pos[i], pos[2], .75)].join(''),
        stroke: '#000',
        markerEnd: 'url(#arrow)',
        opacity: i => d[i] < 0 ? 0 : 1
      })

    var nodeSel = svg.appendMany('g', d.concat('?'))
      .translate((d, i) => pos[i])
      .st({opacity: d => d < 0 ? 0 : 1})

    nodeSel.append('circle')
      .at({r: s, fill: '#fff', stroke: '#000'})

    nodeSel.append('text').text(d => d)
      .at({textAnchor: 'middle', dy: '.33em'})


    var rowHeight = 47
    var rowSel = svg.appendMany('g', 'max mean sum'.split(' '))
      .translate((d, i) => h + s*4 + i*rowHeight, 1)

    if (!i){
      rowSel.append('text')
        .text(d => d[0].toUpperCase() + d.slice(1))
        .at({fontWeight: 400, textAnchor: 'middle', dy: '.33em', x: w + 53, })
      var rPad = 5
      rowSel
        .append('rect')
        .filter((_, i) => i == 2 ? 0 : i == 1 && d[0] == 2 ? 0 : 1)
        .at({
          fill: 'red',
          opacity: .5,
          rx: 4,
          ry: 4,
          height: s*2 + rPad*2,
          width: colWidth -90,
          y: -s - rPad,
        })
    }

    rowSel.append('circle')
      .translate(w/2, 0)
      .at({r: s, fill: '#fff', stroke: '#000'})

    rowSel.append('text')
      .translate(w/2, 0)
      .text(fn => d3[fn](d.filter(d => d >= 0)))
      .at({textAnchor: 'middle',  dy: '.33em'})

  }

  function lerp2(a, b, t){
    return [
      lerp(a[0], b[0], t),
      lerp(a[1], b[1], t),
    ]
  }

  function lerp(a, b, t){
    return a + t*(b - a)
  }

}

function addArrowHead(svg){
  svg.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '-10 -10 20 20')
      .attr('markerWidth', 20)
      .attr('markerHeight', 20)
      .attr('orient', 'auto')
    .append('path')
      .attr('d', 'M-6.75,-6.75 L 0,0 L -6.75,6.75')
}


if (module.hot) {
  poolingTable()
  module.hot.accept()
}
