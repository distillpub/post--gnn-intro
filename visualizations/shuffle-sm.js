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

export function shuffleSm(){

  var url = new URL(window.location)
  var searchParams = new URLSearchParams(url.search) 
  var isDebug = searchParams.get('debug')

  var margin = {left: 20, top: 20, right: 20, bottom: 20}

  var strokeColors = ["rgb(63, 70, 71)", "rgb(84, 30, 30)"]

  var linkColors = ['rgba(0,0,0,0)', 'steelblue']

  var sel = d3.select('#shuffle-sm').html('')

  window.nodes = window.nodes || [0, 1, 1, 0].map((v, i) => ({v, i, isNode: true, str: 'ABCD'[i]}))
  var n = nodes.length

  window.links = window.links || d3.cross(nodes, nodes).map(([a, b]) => {
    var [i, j] = [a.i, b.i].sort()
    var linkId = i + ' ' + j
    var v = (i + j) % 2

    return {a, b, linkId, v}
  })


  var renderFns = []
  function render(){
    renderFns.forEach(d => d())
  }

  var topGraph = drawGraph()

  var shuffled1000 = d3.range(1000)
    .map(d => d3.shuffle([0, 1, 2, 3]).join(''))
    .sort().reverse()
  ;[...new Set(shuffled1000)]
    .map(d => d.split('').map(e => +e))
    .forEach(drawPermutation)

  topGraph.setPermutation([0, 1, 2, 3])


  function drawPermutation(permuteArray){
    var s = 21
    var c = d3.conventions({
      sel: sel.append('div.permute-sm'), 
      width: s*4,
      height: s*4,
      margin: {top: 3, left: 3, right: 3, bottom: 3},
    })

    c.sel
      .datum(permuteArray)
      .on('mouseenter', () => topGraph.setPermutation(permuteArray))

    var linkSel = c.svg.appendMany('rect.link', links)
      .at({
        width: s - 1, 
        height: s - 1,
        x: d => (3 - permuteArray[d.a.i])*s,
        y: d => (3 - permuteArray[d.b.i])*s,
      })

    var nodeSel = c.svg.appendMany('text', permuteArray)
      .text((d, i) => nodes[i].str)
      .translate(d => [(3 - d)*s, (4 - d)*s])
      .at({fontSize: 10, textAnchor: 'middle', dy: '.33em', y: -s/2, x: s/2})


    renderFns.push(() => {
      linkSel.at({
        fill: d => linkColors[d.v], 
        stroke: d => d.hover ? '#aaa' : '',
        strokeWidth: d => d.hover ? 3 : 0,
      })
    })
  }

  function drawGraph(){
    var height = 200
    var c = d3.conventions({
      sel: sel.append('div').st({marginBottom: 20}), 
      height, margin,
    })

    c.svg.append('rect').at({width: c.width, height: c.height, fillOpacity: 0})

    c.x.domain([0, 3])

    var g = c.svg.append('g').translate(d => [0, height*.7])

    nodes.forEach(d => {
      d.pos = [c.x(d.i), 0]

      d.pathSel = g.append('path').st({stroke: isDebug ? 'red' : '', fill: 'none'})
    })

    var rScale = d3.scaleLinear()
      .domain([c.x(1), c.x(1.001), c.x(1.1), c.x(2)])
      .range([600000, 6000, 2000, 550])
      .clamp(1)

    links.forEach(d => {
      var r = rScale(Math.abs(d.a.pos[0] - d.b.pos[0]))
      d.pathStr = `M ${d.a.pos} A ${[r, r]} 0 0 0 ${d.b.pos}`
    })

    var linkBgSel = g.appendMany('path.link', links.filter(d => d.a.i > d.b.i))
      .at({
        d: d => d.pathStr,
        strokeWidth: 15,
        fill: 'none',
      })

    var linkSel = g.appendMany('path.link', links.filter(d => d.a.i > d.b.i))
      .at({
        d: d => d.pathStr,
        strokeWidth: 2,
        fill: 'none',
      })

    var nodeSel = g.appendMany('g.node', nodes)
      .translate(d => d.pos)

    nodeSel.append('circle').at({r: 10})
    nodeSel.append('text').text(d => d.str)
      .at({textAnchor: 'middle', dy: '.33em', fill: '#000'})
      .st({stroke: 'none'})

    renderFns.push(() => {
      nodeSel.at({
        fill: d => '#fff', 
        stroke: d => d.hover ? '#000' : strokeColors[d.v],
        strokeWidth: d => d.hover ? '3px' : '1px',
      })

      linkSel.at({
        stroke: d => linkColors[d.v], 
        strokeWidth: d => d.v ? 2 : 0
      })

      linkBgSel.at({
        stroke: d => d.hover ? '#ddd' : 'rgba(0,0,0,0)',
      })
    })

    function setPermutation(permuteArray){

      sel.selectAll('.permute-sm').classed('active', d => d == permuteArray)

      nodes.forEach(d => {
        d.posNext = [c.x(permuteArray[d.i]), 0]
        var xDist = d.posNext[0] - d.pos[0]
        var isLeft = xDist < 0
        var r = 1300
        if (Math.abs(xDist) < 300) r = r - 800

        var pathStr = `
          M ${d.pos} 
          A ${[r, r]} 
          0 0 ${isLeft ? 0 : 0} 
          ${d.posNext}`

        d.pathSel.at({d: pathStr})

        var pathLength = d.pathSel.node().getTotalLength()
        d.posI = i => {
          var {x, y} =  d.pathSel.node().getPointAtLength(i*pathLength)
          return [x, y]
        }
      })

      window.drawT = t => {
        var i = d3.clamp(0, t/700, 1)
        if (i == 1) window.permuteTimer.stop()

        nodes.forEach(d => {
          d.pos = d.posI(i)
        })

        links.forEach(d => {
          var [aPos, bPos] = [d.a.pos, d.b.pos].sort((a, b) => a[0] < b[0])
          var r = rScale(aPos[0] - bPos[0])

          d.pathStr = `
            M ${aPos} 
            A ${[r, r]} 
            0 0 0 
            ${bPos}`
        })

        linkBgSel.at({d: d => d.pathStr})
        linkSel.at({d: d => d.pathStr})
        nodeSel.translate(d => d.pos)
      }

      if (isDebug){
        c.svg.on('mousemove', function(){
          drawT(d3.mouse(this)[0]/c.width*1000)
        })
      }

      if (window.permuteTimer) window.permuteTimer.stop()
      window.permuteTimer = d3.timer(drawT)
    }


    return {setPermutation}
  }

  function incClick(d){
    d.v = (d.v + 1) % (d.a ? 2 : 2)
    if (!d.isNode){
      if (d.a == d.b) d.v = 0
      links.forEach(e => e.v = e.linkId == d.linkId ? d.v : e.v)
    }

    render()
  }

  function setHover(d){
    nodes.forEach(d => d.hover = false)
    d.hover = true

    if (!d.isNode){
      links.forEach(e => e.hover = e.linkId == d.linkId)
      if (d.a == d.b){
        nodes.forEach(e => e.hover = e == d.a)
      }
    } else{
      links.forEach(e => e.hover = e.a == d && e.b == d)
    }

    render()
  }



  sel.selectAll('.link')
    .on('click', incClick)
    .on('mouseover', setHover)

  sel.selectAll('.node')
    .on('mouseover', setHover)

  render()


  sel.st({maxWidth: 800})
  sel.parent().select('figcaption').st({maxWidth: 800, margin: '0px auto'})
}



if (module.hot) {
  shuffleSm()
  module.hot.accept()
}
