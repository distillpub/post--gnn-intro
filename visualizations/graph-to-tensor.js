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
import { random } from '../utils';


export function graphToTensor() {
  var width = 350
  var height = 350
  var margin = {left: 20, top: 20, right: 20, bottom: 20}

  var fillColors = ['#ffc81d', '#c69700']
  var strokeColors = ['rgb(63, 70, 71)', 'rgb(84, 30, 30)']
  var globalColors = ['#fa9393', '#a62929']


  var linkColors = ['rgba(0,0,0,0)', '#315b7e', '#73b8f0']


  var sel = d3.select('#graph-to-tensor').html('')

  var nodes = window.graphToTensorNodes = window.graphToTensorNodes || 
    [0, 1, 1, 0, 0, 1, 1, 1].map((v, i) => ({v, i, isNode: true}))
  var n = nodes.length

  var randCounter = 3;
  var links = window.graphToTensorLinks = window.graphToTensorLinks || 
    d3.cross(nodes, nodes).map(([a, b]) => {
      if (a.i <= b.i) return 
      var [i, j] = [a.i, b.i].sort()
      var linkId = i + ' ' + j;
      var v = random[randCounter++] < .1 ? 2 : random[randCounter++] < .2 ? 1 : 0;
      return {a, b, linkId, v}
    })
    .filter(d => d)

  var globalVal = {isGlobal: true, v: 0}

  var renderFns = []
  function render(){
    renderFns.forEach(d => d())
  }

  function drawGraph(){
    var c = d3.conventions({
      sel: sel.append('div'), 
      width, height, margin,
    })

    var g = c.svg.append('g').translate(d => [width/2, height/2])

    var r = Math.min(width, height)/2

    nodes.forEach(d => {
      d.pos = [Math.cos(Math.PI/6 + d.i/n*Math.PI*2)*r, Math.sin(Math.PI/6 + d.i/n*Math.PI*2)*r]
    })

    links.forEach(d => {
      d.pathStr = 'M' + [d.a, d.b].map(d => d.pos).join('L')
    })

    var pad = 10
    var globalSel = g.appendMany('rect.global', [globalVal, globalVal])
      .at({
        width: width + pad*2,
        height: height + pad*2,
        x: -width/2 - pad,
        y: -height/2 - pad,
        rx: 100,
        ry: 100,
        fill: 'none',
        stroke: 'red',
        strokeDasharray: '4 4',
      })
    globalSel.filter((d, i) => i == 0)
      .st({strokeDasharray: '', opacity: 0, strokeWidth: 4})

    var linkBgSel = g.appendMany('path.link', links.filter(d => d.a.i > d.b.i))
      .at({
        d: d => d.pathStr,
        strokeWidth: 10,
      })

    var linkSel = g.appendMany('path.link', links.filter(d => d.a.i > d.b.i))
      .at({
        d: d => d.pathStr,
        strokeWidth: 2,
      })

    var nodeSel = g.appendMany('circle.node', nodes)
      .translate(d => d.pos)
      .at({r: 10})

    renderFns.push(() => {
      nodeSel.at({
        fill: d => fillColors[d.v], 
        stroke: d => strokeColors[d.v],
        strokeWidth: d => d.hover ? 3 : 1,
      })

      linkSel.at({
        stroke: d => linkColors[d.v], 
        strokeWidth: d => d.v ? 2 : 0
      })

      linkBgSel.at({
        stroke: d => d.hover ? '#ddd' : 'rgba(0,0,0,0)',
      })

      globalSel.at({
        stroke: d => globalColors[d.v],
        strokeWidth: d => d.hover ? 3 : 1,
      })
    })
  }

  function drawTensor(){
    var c = d3.conventions({
      sel: sel.append('div'), 
      layers: 'd',
      width, height, margin,
    })

    var [divSel] = c.layers


    divSel.append('div').append('span').text('Nodes')
    divSel.append('br')

    var nodeSel = divSel
      .append('div.monospace').st({wordBreak: 'break-all'})
      .append('span').text('[').parent()
      .appendMany('span.num.comma-after', nodes)


    divSel.append('br')
    divSel.append('br')

    divSel.append('div').append('span').text('Edges')
    divSel.append('br')

    var linkSel = divSel
      .append('div.monospace').st({wordBreak: 'break-all'})
      .append('span').text('[').parent()
      .appendMany('span.num.comma-after', links)


    divSel.append('br')
    divSel.append('br')

    divSel.append('div').append('span').text('Adjacency List')
    divSel.append('br')

    var adjSel = divSel
      .append('div.monospace').st({wordBreak: 'break-all'})
      .append('span').text('[').st({marginLeft: -10}).parent()
      .appendMany('span.num.adj.comma-after', links)
      .text(d => '[' + d.a.i + ', '  + d.b.i + ']')


    divSel.append('br')
    divSel.append('br')

    divSel.append('div').append('span').text('Global')
    divSel.append('br')

    var globalSel = divSel
      .append('div.monospace').st({wordBreak: 'break-all'})
      .append('span.num')
      .datum(globalVal)

    var numSel = divSel.selectAll('.num').st({fontSize: 15})

    linkSel.filter(d => d.a == d.b) 

    renderFns.push(() => {
      nodeSel
        .text(d => d.v)
        .st({
          outline: d => d.hover ? '2px solid #ddd' : '',
          color: d => fillColors[d.v],
        })

      globalSel
        .text(d => d.v)
        .st({
          outline: d => d.hover ? '2px solid #ddd' : '',
          color: d => globalColors[d.v],
        })

      links.forEach(d => d.isLast = false)
      links.filter(d => d.v).slice(-1).forEach(d => d.isLast = true)

      linkSel
        .text(d => d.v)
        .st({
          outline: d => d.hover ? '2px solid #ddd' : '',
          color: d => linkColors[d.v].replace('rgba(0,0,0,0)', '#ccc'),
        })
        .classed('hidden', d => !d.v)
        .classed('bracket-after', d => d.isLast)

      adjSel
        .st({
          outline: d => d.hover ? '2px solid #ddd' : '',
        })
        .classed('hidden', d => !d.v)
        .classed('bracket-after', d => d.isLast)

    })
  }

  function incClick(d){
    d.v = (d.v + 1) % (d.a ? 3 : 2)

    if (!d.isNode && !d.isGlobal){
      if (d.a == d.b) d.v = 0
      if (d.v == 0 && d3.select(this).classed('num')) d.v = 1
      links.forEach(e => e.v = e.linkId == d.linkId ? d.v : e.v)
    }

    render()
  }

  function setHover(d){
    nodes.forEach(d => d.hover = false)
    globalVal.hover = false
    d.hover = true

    if (!d.isNode){
      links.forEach(e => e.hover = e.linkId == d.linkId)
    }

    render()
  }


  drawGraph()
  drawTensor()

  sel.on('click', () => d3.event.target == sel.select('svg').node() && incClick(globalVal));

  sel.selectAll('.link, .node, .num, .pair, .global')
    .on('click', incClick)
    .on('mouseover', setHover)

  render()
}

if (module.hot) {
  graphToTensor()
  module.hot.accept()
}





