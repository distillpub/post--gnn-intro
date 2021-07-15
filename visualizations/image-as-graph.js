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
const pixColors = [d3.color('#c69700'), d3.color('#fff2ca')];
var img = `
.0.0.
.....
..0..
0...0
.000.
`.trim()

function lerp(x0, x1, t){
  return x0 + t*(x1 - x0)
}

function lerp2([x0, y0], [x1, y1], t){
  var x = x0 + t*(x1 - x0)
  var y = y0 + t*(y1 - y0)
  return [x, y]
}

function addVec2([x0, y0], [x1, y1]){
  return [x0 + x1, y0 + y1]
}

function makeDrag(simulation){
  return d3.drag()
    .on('start', d => {
      if (!d3.event.active) simulation.alphaTarget(0.2).restart()
      d.fx = d.x
      d.fy = d.y
    })
    .on('drag', d => {
      d.fx = d3.event.x
      d.fy = d3.event.y
    })
    .on('end', d => {
      if (!d3.event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    })
}
function fontColor(d) {
  return d.isOn ? '#fff' : '#777';
}

var blue = 'steelblue'
var dBlue = d3.color(blue).darker(-.5);
var lBlue = d3.color(blue).darker(2);

export function imageAsGraph() {

  var n = img.split('\n').length
  var s = n*12
  var w = s*n

  var pixels = []

  img.split('\n').forEach((row, j) => {
    row.split('').forEach((d, i) => {
      pixels.push({i, j, isOn: d == '0', pos: [i*s, j*s], x:i*s, y:j*s})
    })
  })

  pixels.forEach((d, i) => {
    d.pixelIndex = i
    d.str = d.i + '-' + d.j
  })

  var p = s/n
  var pairs = d3.cross(pixels, pixels)
  pairs.forEach(d => {
    var [a, b] = d
    d.dist = Math.max(Math.abs(a.i - b.i), Math.abs(a.j - b.j))
    d.pos = [a.pixelIndex*p, b.pixelIndex*p]
  })

  var sel = d3.select('#image-as-graph').html('')
    .st({marginBottom: 20})
  var margin = {left: .5, right: 0, top: .5, bottom: 0}
  var i = d3.conventions({
    sel: sel.append('div.image'),
    width: w,
    height: w,
    margin,
  })

  var g = d3.conventions({
    sel: sel.append('div.graph'),
    width: w,
    height: w,
    margin,
  })

  var f = d3.conventions({
    sel: sel.append('div.force'),
    width: w,
    height: w,
    margin,
  })


  sel.selectAll('svg > g').append('text.chart-label')
    .data(['Image Pixels', 'Adjacency Matrix', 'Graph'])
    .text(d => d)
    .translate([w/2, w + 20])
    .at({textAnchor: 'middle'})


  i.svg.append('rect').at({width: w, height: w, fillOpacity: 1, fill: '#aaa'})
  i.svg.on('mouseleave', updateActivePixel)

  var iRectSel = i.svg.appendMany('rect', pixels)
    .at({height: s - 1,width: s - 1})
    .translate(d => d.pos)
    .call(attachPixelHandlers)

  var iTextSel = i.svg.appendMany('text', pixels)
    .text(d => d.str)
    .translate(d => d.pos)
    .at({fontSize: 10, fill: d => fontColor(d), x: s/2, y: s/2, textAnchor: 'middle', dy: '.33em'})

  function pairPath([a, b]){
    var pos0 = addVec2(a.pos, [s/2, s/2])
    var pos1 = addVec2(b.pos, [s/2, s/2])

    return ['M', lerp2(pos0, pos1, .2), 'L', lerp2(pos0, pos1, 1 - .2)].join(' ')
  }
  var iPathSel = i.svg.appendMany('path', pairs.filter(d => d.dist == 1))
    .at({stroke: lBlue, d: pairPath, pointEvents: 'none', strokeWidth: 3})


  var gRectSel = g.svg.appendMany('rect', pairs)
    .at({
      height: p - .2,
      width: p - .2,
      fill: d => d.dist == 1 ? dBlue : '#fff',
    })
    .translate(d => d.pos)
    .on('mouseover', updateActivePair)

  g.svg.appendMany('g', pixels).translate(d => [d.pixelIndex*p + p/2, -10])
    .append('text').at({transform: 'rotate(-90)'})
  g.svg.appendMany('text', pixels).translate(d => [-10, d.pixelIndex*p + p/2])

  var gTextSel = g.svg.selectAll('text')
    .filter(d => d && d.str)
    .text(d => d.str)
    .at({fontSize: 6, fill: '#999', textAnchor: 'middle', dy: '.33em'})
    .call(attachPixelHandlers)


  f.svg.parent().st({background: '#fff'})

  var links = pairs
    .filter(d => d.dist == 1)
    .filter(d => d[0].pixelIndex < d[1].pixelIndex)
  links.forEach(d => {
    d.source = d[0].pixelIndex
    d.target = d[1].pixelIndex
  })

  var simulation = d3.forceSimulation()
    .nodes(pixels)
    .force('charge', d3.forceManyBody().strength(-300))
    .force('link', d3.forceLink().distance(40).links(links).id(d => d.pixelIndex))
    .force('x', d3.forceX(f.width / 2))
    .force('y', d3.forceY(f.height / 2))
    .on('tick', () => {
      fNodeSel.translate(d => [d.x, d.y])
      fLinkSel.at({d: d => ['M', d.source.x, d.source.y, 'L', d.target.x, d.target.y].join(' ')})
    })

  var fLinkSel = f.svg.append('g').appendMany('path.link', links)
    .at({stroke: dBlue,})
    .on('mouseover', updateActivePair)

  var fNodeSel = f.svg.appendMany('g', pixels)
    .call(makeDrag(simulation))
    .call(attachPixelHandlers)
    .on('mouseleave', d => updateActivePixel(null))
  fNodeSel.append('circle')
    .at({stroke: '#000', r: 15})
  var fTextSel = fNodeSel.append('text')
    .text(d => d.str)
    .at({fontSize: 10, fill: '#999', textAnchor: 'middle', dy: '.33em'})


  function attachPixelHandlers(selection){
    selection
      .on('mouseover', updateActivePixel)
      .on('click', d => {
        d.isOn = !d.isOn
        updateOn()
      })
      .st({cursor: 'pointer'})
  }

  updateOn()
  updateActivePair(pairs[202])

  function updateOn(){
    iRectSel.st({fill: d => d.isOn ? pixColors[0] : pixColors[1]})
    fNodeSel.st({fill: d => d.isOn ? pixColors[0] : pixColors[1]})
  }

  function updateActivePixel(pixel){
    iPathSel.st({opacity: e => e[0] == pixel ? 1 : 0})
    fLinkSel.classed('active', e => e[0] == pixel || e[1] == pixel)
    gRectSel
      .filter(d => d.dist == 1)
      .st({fill: !pixel ? dBlue : e => e[0] == pixel || e[1] == pixel ? lBlue : dBlue})
  }

  function updateActivePair(activePair){
    gTextSel
      .at({fill: '#999'})
      .classed('active', 0)
      .filter((d, i) => d == activePair[i > pixels.length - 1 ? 1 : 0])
      .classed('active', 1)
      .at({fill: '#000'})
      .raise()

    iTextSel
      .at({fill: d => fontColor(d)})
      .classed('active', 0)
      .filter((d, i) => activePair.includes(d))
      .classed('active', 1)
      .at({fill: '#000'})
      .raise()

    fTextSel
      .at({fill: d => fontColor(d)})
      .classed('active', 0)
      .filter((d, i) => activePair.includes(d))
      .classed('active', 1)
      .at({fill: '#000'})
      .raise()

    iPathSel.st({opacity: d => d == activePair ? 1 : 0})

    pairs.forEach(d => {
      d.isActive = d == activePair || d[0] == activePair[1] && d[1] == activePair[0]
    })

    fLinkSel.classed('active', d => d.isActive)

    gRectSel
      .filter(d => d.dist == 1)
      .st({fill: d => d.isActive ? lBlue : dBlue})
  }
}

if (module.hot) {
  imageAsGraph()
  module.hot.accept()
}





