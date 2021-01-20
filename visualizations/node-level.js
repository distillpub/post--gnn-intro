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

export function nodeLevel() {

  d3.loadData('./graph.json', (err, res) => {
    var [graph] = res;

    var width = 450
    var height = 240
    var nodeR = 4

    var simulation = d3.forceSimulation()
      .nodes(graph.nodes)
      .force('charge', d3.forceManyBody().strength(-300))
      .force('link', d3.forceLink().distance(40).links(graph.links))
      .force('x', d3.forceX(width / 2).strength(.2))
      .force('y', d3.forceY(height / 2).strength(.4))
      .stop()

    for (var i = 0; i < 300; ++i) simulation.tick();

    graph.nodes.forEach(d => {
      d.i = d.index
      d.label = d.club == 'Mr. Hi' ? 1 : 0
      d.neighbours = {}
    })
    graph.links.forEach(d => {
      var n0 = graph.nodes[d.source.index]
      var n1 = graph.nodes[d.target.index]
      n0.neighbours[n1.i] = n1
      n1.neighbours[n0.i] = n0
    })

    var fillColors = ["rgb(179, 201, 204)", "rgb(241, 85, 85)"]
    var strokeColors = ["rgb(63, 70, 71)", "rgb(84, 30, 30)"]


    var sel = d3.select('div#node-level-problems').html('')
      .st({marginLeft: -115, width: 980})

    drawGraph(sel.append('div.left'), 0)
    drawGraph(sel.append('div.right'), 1)

    let hiLabel, johnLabel;

    function drawGraph(sel, isLabeled){
      sel.st({display: 'inline-block', position: 'relative', left: isLabeled ? 20 : -20, marginBottom: 40})
      var g = d3.conventions({
        sel: sel.append('div#layer-graph'),
        width,
        height,
        margin: { left: 0, top: 10, right: 20, bottom: 0 },
      })
      g.svg.parent().classed('chart-yellow-bg', 1).st({overflow: 'visible'})

      sel.append('div')
        .html(isLabeled ? 
          `<b>Output:</b> <span style='color: #999'> graph node labels</span>` :
          `<b>Input:</b> <span style='color: #999'>graph with unlabled nodes</span>`
        )
        .st({fontFamily: 'helvetica', fontSize: 14, marginTop: 10})

      if (isLabeled){
        var legendSel = g.svg.append('g').translate([5, g.height - 23])
          .st({fontFamily: 'helvetica', fontSize: 14})

        legendSel.append('text').text('Allegiance to John A')
          .st({fill: fillColors[0]})
        legendSel.append('text').text('Allegiance to Mr. Hi').translate(15, 1)
          .st({fill: fillColors[1]})


        // Add labels to Mr Hi and John A
        const label = (name, nodeIdx, colorIdx) => {
          const d = graph.nodes[nodeIdx];
          return g.svg.append('text')
            .text(name)
            .translate([d.x + 7, d.y])
            .st({fill: d3.color(fillColors[colorIdx]).darker()});
        }
        hiLabel = label('Mr. Hi', 0, 1)
        johnLabel = label('John A', graph.nodes.length-1, 0)

        g.svg.append('text').text('→')
          .translate([-20 - g.margin.left, g.height/2])
          .at({textAnchor: 'middle'})
      }

      g.svg.append('g').appendMany('path.graph-link.link', graph.links)
        .at({
          stroke: '#ccc',
          d: d => ['M', d.source.x, d.source.y, 'L', d.target.x, d.target.y].join(' '),
        })

      const isDark = i => (i == 0 || i == graph.nodes.length-1);
      g.svg.appendMany('circle.node', graph.nodes)
        .at({
          r: nodeR, 
          fill: !isLabeled ? '#fff' : ((d, i) =>  isDark(i) ? d3.color(fillColors[d.label]).darker(): fillColors[d.label]), 
          stroke: !isLabeled ? '#000' : d => strokeColors[d.label]
        })
        .on('mouseover', d => {
          nodeSel.classed('active', e => d.i == e.i)

          linkSel
            .classed('active', 0)
            .filter(e => e.source.index == d.i || e.target.index == d.i)
            .classed('active', 1)
            .raise()

          hiLabel.raise();
          johnLabel.raise();
        })
        .translate(d => [d.x, d.y])
        .call(d3.attachTooltip)

    }

    var nodeSel = sel.selectAll('.node')
    var linkSel = sel.selectAll('.link')
    hiLabel.raise();
    johnLabel.raise();
  })
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
  nodeLevel()
  module.hot.accept()
}
