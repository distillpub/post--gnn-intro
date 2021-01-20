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
import * as _ from 'underscore'
import {swoopyDrag} from '../third_party/swoopy-drag'
import { random } from '../utils';

export function nodeStep() {
  var width = 150
  var barWidth = 100
  var xOffset = 0
  var height = 200
  var margin = {left: 20, top: 40, right: 20, bottom: 20}
  var numEmbed = 8
  var sel = d3.select('#node-step').html('')

  var nodes = window.stepNodes = window.stepNodes || d3.range(5).map((v, i) => {

    var color = ["#f2b200", "#c69700", "#ffeaa9", "#ffd255", "#d19f00", "#edc949", "#af7aa1", "#ff9da7", "#9c755f", "#bab0ab"][i]
    var rv = {v, i, isNode: true, color: d3.color(color), neighbors: []}
    rv.embed = d3.range(numEmbed).map(d => .05 + Math.random()*.95).map((v, i) => ({node: rv, v, i}))
    rv.outembed = d3.range(numEmbed).map(d => .05 + Math.random()*.95).map((v, i) => ({node: rv, v, i}))

    return rv
  })


  var n = nodes.length

  var links = window.stepLinks = window.stepLinks || d3.cross(nodes, nodes)
    .map(([a, b]) => {
      var [i, j] = [a.i, b.i]
      if (i <= j) return 

      var linkId = i + ' ' + j
      var v = random[i] < .3 ? 1 : 0
      if (v){
        nodes[i].neighbors.push(nodes[j])
        nodes[j].neighbors.push(nodes[i])
      }
      return {a, b, linkId, v}
    })
    .filter(d => d)

  var renderFns = []
  function render(){
    renderFns.forEach(d => d())
  }


  var c = d3.conventions({
    sel: sel.append('div').st({margin: '0px auto'}),
    width: 800,
    height: 220,
    margin: {top: 70},
  })

  function drawGraph(isSecond){
    var g = c.svg.append('g').translate(d => [width/2 + xOffset, height/2 - 60])
    var r = Math.min(width, height)/2

    g.append('text').text('Layer N' + (isSecond ? ' + 1' : ''))
      .at({x: -40, y: -height/2 - 10, fontWeight: 600})
      .st({fontSize: 16})

    nodes.forEach(d => {
      d.pos = [Math.cos(Math.PI/6 + d.i/n*Math.PI*2)*r, Math.sin(Math.PI/6 + d.i/n*Math.PI*2)*r]
    })

    links.forEach(d => {
      d.pathStr = 'M' + [d.a, d.b].map(d => d.pos).join('L')
    })

    var linkSel = g.append('g').appendMany('path.link', links.filter(d => d.a.i > d.b.i))
      .at({
        d: d => d.pathStr,
        strokeWidth: 2,
      })

    var nodeSel = g.appendMany('circle.node', nodes)
      .translate(d => d.pos)
      .at({r: 10})

    renderFns.push(() => {
      nodeSel.at({
        fill: d => d.hover ? (d.color.darker(isSecond ? 1 : 0)) : 'white', 
        stroke: d => d.color.darker(isSecond ? 1 : 0),
        strokeWidth: d => 6,
      })

      linkSel.at({
        stroke: d => d.hover && !isSecond ? '#000' : '#ccc', 
        strokeWidth: d => d.v ? 1 : 0
      })
      .filter(d => d.hover)
      .raise()
    })

    xOffset += width + 60
  }

  var bw = Math.floor(barWidth/numEmbed)
  var bh = bw*1
  var bpad = 10

  function drawAdditionCol(){
    var g = c.svg.append('g').translate([xOffset, 40.5])

    var allEmbeds = _.flatten(nodes.map(d => d.embed))
    allEmbeds.forEach(d => {
      d.height = Math.round(d.v*bh)
    })

    var botSel = g.append('g').translate((bh + bpad)*(nodes.length - 1), 1)
    var seperateSel = g.appendMany('rect', allEmbeds)
    var stackSel = botSel.append('g').translate(bpad*2, 1).appendMany('rect', allEmbeds)

    botSel.append('path').at({
      d: `M 0 ${bpad} H ${bw*numEmbed}`,
      stroke: '#000',
    })

    botSel.append('text').text('+')
      .at({fontSize: 25, x: -25, fontWeight: 100, dy: '.33em', y: -bpad})
      .st({fontSize: 25})

    renderFns.push(() => {
      _.sortBy(nodes, d => d.hover ? 2 : d.neighbor ? 1 : 0)
        .forEach((d, i) => d.stackIndex = i)

      seperateSel
        .at({
          x: d => d.i*bw,
          width: bw - 1,
          height: d => d.height,
          y: d => (bh + bpad)*d.node.stackIndex - d.height,
          fill: d => d.node.color,
          opacity: d => d.node.neighbor ? 1 : 0,
        })

      d3.nestBy(_.sortBy(allEmbeds, d => -d.node.stackIndex), d => d.i).forEach(col => {
        var prev = 0 
        col.forEach(d => {
          d.prev = prev
          prev += d.height
        })
      })

      stackSel
        .at({
          x: d => d.i*bw,
          width: bw - 1,
          height: d => d.height,
          y: d => d.prev - d.height*0,
          fill: d => d.node.color,
          opacity: d => d.node.neighbor ? 1 : 0,
        })
    })


    xOffset += width + 0
  }

  function drawFunctionColumn(){
    var g = c.svg.append('g').translate([xOffset, 70.5 + (bh + bpad)*(nodes.length - 1)])


    g.append('text').text('𝑓')
      .at({fontSize: 25, x: 85, fontWeight: 100, y: bpad, dy: '.33em', y: 0, textAnchor: 'middle'})
      .st({fontSize: 25})

    var embedSel = g.append('g').translate([220, 15]).appendMany('rect', d3.range(numEmbed))

    renderFns.push(() => {
      embedSel.data(hoverNode.embed)
        .at({
          x: d => d.i*bw,
          width: bw - 1,
          height: d => d.height,
          y: d => -d.height,
          fill: d => d.node.color.darker(1),
          opacity: d => d.node.neighbor ? 1 : 0,
        })
    })


    xOffset += width + 50
  }

  function addAnnotations(){
    var isDrag = 0

    // Enable to edit annotations
    // if (!isDrag) annotations.forEach(d => d.text = d.html ? '' : d.text)
    // if (isDrag){
    //   d3.select('#sections').st({pointerEvents: 'none'})
    // }

    // copy('window.annotations = ' + JSON.stringify(annotations, null, 2))


window.annotations = [
  {
    "path": "M333,162L412,163",
    "text": "Aggregate information from adjacent nodes",
    "textOffset": [
      189,
      228
    ]
  },
  {
    "path": "M471,164L556,165",
    "text": "Transform information",
    "textOffset": [
      419,
      228
    ],
    "width": 18
  },
  {
    "path": "M 0 0",
    "text": "Update graph with new information",
    "textOffset": [
      571,
      227
    ],
    "width": 18
  },
  {
    "path": "M 686,165 A 44.813 44.813 0 0 0 711,98",
    "outIndex": 0
  },
  {
    "path": "M 681,160 A 33.022 33.022 0 0 0 641,109",
    "outIndex": 1
  },
  {
    "path": "M 678,158 A 91.451 91.451 0 0 0 583,46",
    "outIndex": 2
  },
  {
    "path": "M 686,165 A 105.087 105.087 0 1 0 631,-35",
    "outIndex": 3
  },
  {
    "path": "M 686,165 A 90.104 90.104 0 0 0 715,-5",
    "outIndex": 4
  },
  {
    "path": "M 138,55 A 34.298 34.298 0 0 1 189,35",
    "srcIndex": 0
  },
  {
    "path": "M 67,133 A 83.886 83.886 0 0 0 183,142",
    "srcIndex": 1
  },
  {
    "path": "M -8,68 A 109.522 109.522 0 0 0 191,151",
    "srcIndex": 2
  },
  {
    "path": "M 58,-38 A 114.015 114.015 0 0 1 219,15",
    "srcIndex": 3
  },
  {
    "path": "M 147,-13 A 198.21 198.21 0 0 1 204,26",
    "srcIndex": 4
  }
]
  var swoopy = swoopyDrag()
      .x(d => 0)
      .y(d => 0)
      .draggable(isDrag)
      .annotations(annotations)

    // var htmlAnnoSel = divSel.appendMany('div.annotation', annotations.filter(d => d.html))
    //   .translate(d => [c.x(d.x), c.y(d.y)]).st({position: 'absolute', opacity: 0})
    //   .append('div')
    //   .translate(d => d.textOffset)
    //   .html(d => d.html)
    //   .st({width: 150})

    var swoopySel = c.svg.append('g.annotations').call(swoopy)

    c.svg.append('marker')
        .attr('id', 'arrow')
        .attr('viewBox', '-10 -10 20 20')
        .attr('markerWidth', 20)
        .attr('markerHeight', 20)
        .attr('orient', 'auto')
      .append('path')
        .attr('d', 'M-6.75,-6.75 L 0,0 L -6.75,6.75')

    swoopySel.selectAll('path')
      .attr('marker-end', 'url(#arrow)')
      .st({'opacity': d => d.path == 'M 0 0' ? 0 : 1})

    swoopySel.selectAll('text')
      .each(function(d){
        d3.select(this)
          .text('')                        //clear existing text
          .tspans(d3.wordwrap(d.text, d.width || 20), 16) //wrap after 20 char
      })

    var outSwoops = swoopySel.selectAll('g')
      .filter(d => isFinite(d.outIndex))

    var srcSwoops = swoopySel.selectAll('g')
      .filter(d => isFinite(d.srcIndex))

    renderFns.push(d => {
      outSwoops
        .st({display: d => d.outIndex == hoverNode.i ? '' : 'none'})

      srcSwoops
        .st({display: d => nodes[d.srcIndex].neighbor ? '' : 'none'})
    })  
  }

  function setHover(d){
    nodes.forEach(e => {
      e.hover = false
      e.neighbor = false
    })
    d.hover = true
    d.neighbor = true
    d.neighbors.forEach(e => {
      e.neighbor = true
    })

    window.hoverNode = d

    links.forEach(l => {
      l.hover = l.a == d || l.b == d
    })

    if (!d.isNode){
      links.forEach(e => e.hover = e.linkId == d.linkId)
    }

    render()
  }


  drawGraph(0)
  drawAdditionCol()
  drawFunctionColumn()
  drawGraph(1)
  addAnnotations()

  sel.selectAll('.node')
    .on('mouseover', setHover)

  setHover(nodes[0])
}

if (module.hot) {
  nodeStep()
  module.hot.accept()
}





