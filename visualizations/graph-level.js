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

export function graphLevel() {

  var files = [
    'ZINC31829493_True_size13',
    'ZINC65550950_False_size16',
    'ZINC39079287_False_size10',
    'ZINC91366060_False_size16',
  ].map(d => 'graph-level/' + d + '.json')

  d3.loadData(...files, (err, graphs) => {
    if (err) return console.log(err)

    var width = 450
    var height = 240
    var nodeR = 4
    var scale = 16

    graphs.forEach((graph, i) => {
      graph.file = files[i]
      graph.i = i
      graph.nodes.forEach(d => {
        d.i = d.index
        d.neighbours = {}

        d.pos = d.xy.map(d => d*scale)
      })

      graph.links.forEach(d => {
        d.n0 = graph.nodes[d.source]
        d.n1 = graph.nodes[d.target]
        d.n0.neighbours[d.n1.i] = d.n1
        d.n1.neighbours[d.n0.i] = d.n0
      })
    })

    var fillColors = ["rgb(179, 201, 204)", "rgb(241, 85, 85)"]
    var strokeColors = ["rgb(63, 70, 71)", "rgb(84, 30, 30)"]

    var sel = d3.select('div#graph-level-problems').html('')
      .st({marginLeft: -115, width: 980})

    drawSide(sel.append('div.left'), 0)
    drawSide(sel.append('div.right'), 1)

    function drawSide(sel, isLabeled){
      sel.st({display: 'inline-block', position: 'relative', left: isLabeled ? 20 : -20, marginBottom: 40})
      var g = d3.conventions({
        sel: sel.append('div#layer-graph'),
        width,
        height,
        margin: { left: 0, top: 10, right: 20, bottom: 0 },
      })
      g.svg.parent().classed('chart-yellow-bg', 1).st({overflow: 'visible'})

      graphs.forEach((graph, i) => {
        var gSel = g.svg.append('g').translate([i % 2 ? 130 : 130 + 250, i > 1 ? 180 : 60])
          .datum(graph)

        var pxSnap = d => Math.round(d)
        var [x0, x1] = d3.extent(graph.nodes, d => d.pos[0]).map(pxSnap)
        var [y0, y1] = d3.extent(graph.nodes, d => d.pos[1]).map(pxSnap)
        var pad = 10

        gSel.append('rect')
          .at({
            x: x0 - pad,
            y: y0 - pad,
            width: x1 - x0 + pad*2, 
            height: y1 - y0 + pad*2, 
            stroke: d => (d.file.includes('True') || d.file.includes('ZINC91366060_False_size16')) ? '#F15529' : '#b3c9cc',
          })
          .at({fill: 'none', strokeWidth: isLabeled ? 2 : 0, rx: pad, ry: pad})
          .call(d3.attachTooltip)


        gSel.append('g').appendMany('path.graph-link.link', graph.links)
          .at({
            stroke: '#ccc',
            d: d => ['M', d.n0.pos, 'L', d.n1.pos].join(' '),
          })

        gSel.appendMany('circle.node', graph.nodes)
          .at({
            r: nodeR, 
            fill: '#fff', 
            stroke: '#000'
          })
          .on('mouseover', d => {
            nodeSel.classed('active', e => e == d)

            linkSel
              .classed('active', 0)
              .filter(e => e.n0 == d || e.n1 == d)
              .classed('active', 1)
              .raise()
          })
          .translate(d => d.pos)
          .call(d3.attachTooltip)
      })

      sel.append('div')
        .html(isLabeled ? 
          `<b>Output:</b> <span style='color: #999'>labels for each graph, (e.g., "does the graph contain two rings?")</span>` :
          `<b>Input:</b> <span style='color: #999'>graphs</span>`
        )
        .st({fontFamily: 'helvetica', fontSize: 14, marginTop: 10})

      if (isLabeled && 0){
        var legendSel = g.svg.append('g').translate([5, g.height - 23])
          .st({fontFamily: 'helvetica', fontSize: 14})

        legendSel.append('text').text('Label A')
          .st({fill: fillColors[0]})
        legendSel.append('text').text('Label B').translate(15, 1)
          .st({fill: fillColors[1]})

        g.svg.append('text').text('→')
          .translate([-20 - g.margin.left, g.height/2])
          .at({textAnchor: 'middle'})
      }

    }


    var nodeSel = sel.selectAll('.node')
    var linkSel = sel.selectAll('.link')
  })
}



if (module.hot) {
  graphLevel()
  module.hot.accept()
}
