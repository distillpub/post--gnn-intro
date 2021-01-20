// The MIT License (MIT)

// Copyright (c) 2016 Adam Pearce

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.


// Modified from http://1wheel.github.io/swoopy-drag/
// d3 event doesn't import correctly when used from node_modules


import * as d3 from "d3";

export function swoopyDrag(){
  var x = function(d){ return d }
  var y = function(d){ return d }

  var annotations = []
  var annotationSel

  var draggable = false

  var dispatch = d3.dispatch('drag')

  var textDrag = d3.drag()
      .on('drag', function(d){
        var x = d3.event.x
        var y = d3.event.y
        d.textOffset = [x, y].map(Math.round)

        d3.select(this).call(translate, d.textOffset)

        dispatch.call('drag')
      })
      .subject(function(d){ return {x: d.textOffset[0], y: d.textOffset[1]} })

  var circleDrag = d3.drag()
      .on('drag', function(d){
        var x = d3.event.x
        var y = d3.event.y
        d.pos = [x, y].map(Math.round)

        var parentSel = d3.select(this.parentNode)

        var path = ''
        var points = parentSel.selectAll('circle').data()
        if (points[0].type == 'A'){
          path = calcCirclePath(points)
        } else{
          points.forEach(function(d){ path = path + d.type  + d.pos })
        }

        parentSel.select('path').attr('d', path).datum().path = path
        d3.select(this).call(translate, d.pos)

        dispatch.call('drag')
      })
      .subject(function(d){ return {x: d.pos[0], y: d.pos[1]} })


  var rv = function(sel){
    annotationSel = sel.html('').selectAll('g')
        .data(annotations).enter()
      .append('g')
        .call(translate, function(d){ return [x(d), y(d)] })

    var textSel = annotationSel
        .filter(ƒ('text'))
        .append('text')
        .call(translate, ƒ('textOffset'))
        .text(ƒ('text'))

    annotationSel.append('path')
        .attr('d', ƒ('path'))

    if (!draggable) return

    annotationSel.style('cursor', 'pointer')
    textSel.call(textDrag)

    annotationSel.selectAll('circle').data(function(d){
      var points = []

      if (~d.path.indexOf('A')){
        //handle arc paths seperatly -- only one circle supported
        var pathNode = d3.select(this).select('path').node()
        var l = pathNode.getTotalLength()

        points = [0, .5, 1].map(function(d){
          var p = pathNode.getPointAtLength(d*l)
          return {pos: [p.x, p.y], type: 'A'}
        })
      } else{
        var i = 1
        var type = 'M'
        var commas = 0

        for (var j = 1; j < d.path.length; j++){
          var curChar = d.path[j]
          if (curChar == ',') commas++
          if (curChar == 'L' || curChar == 'C' || commas == 2){
            points.push({pos: d.path.slice(i, j).split(','), type: type})
            type = curChar
            i = j + 1
            commas = 0
          }
        }

        points.push({pos: d.path.slice(i, j).split(','), type: type})
      }

      return points
    }).enter().append('circle')
        .attr('r', 8)
        .attr('fill', 'rgba(0,0,0,0)')
        .attr('stroke', '#333')
        .attr('stroke-dasharray', '2 2')
        .call(translate, ƒ('pos'))
        .call(circleDrag)

    dispatch.call('drag')
  }


  rv.annotations = function(_x){
    if (typeof(_x) == 'undefined') return annotations
    annotations = _x
    return rv
  }
  rv.x = function(_x){
    if (typeof(_x) == 'undefined') return x
    x = _x
    return rv
  }
  rv.y = function(_x){
    if (typeof(_x) == 'undefined') return y
    y = _x
    return rv
  }
  rv.draggable = function(_x){
    if (typeof(_x) == 'undefined') return draggable
    draggable = _x
    return rv
  }
  rv.on = function() {
    var value = dispatch.on.apply(dispatch, arguments);
    return value === dispatch ? rv : value;
  }

  return rv

  //convert 3 points to an Arc Path 
  function calcCirclePath(points){
    var a = points[0].pos
    var b = points[2].pos
    var c = points[1].pos

    var A = dist(b, c)
    var B = dist(c, a)
    var C = dist(a, b)

    var angle = Math.acos((A*A + B*B - C*C)/(2*A*B))
    
    //calc radius of circle
    var K = .5*A*B*Math.sin(angle)
    var r = A*B*C/4/K
    r = Math.round(r*1000)/1000

    //large arc flag
    var laf = +(Math.PI/2 > angle)

    //sweep flag
    var saf = +((b[0] - a[0])*(c[1] - a[1]) - (b[1] - a[1])*(c[0] - a[0]) < 0) 

    return ['M', a, 'A', r, r, 0, laf, saf, b].join(' ')
  }

  function dist(a, b){
    return Math.sqrt(
      Math.pow(a[0] - b[0], 2) +
      Math.pow(a[1] - b[1], 2))
  }


  //no jetpack dependency 
  function translate(sel, pos){
    sel.attr('transform', function(d){
      var posStr = typeof(pos) == 'function' ? pos(d) : pos
      return 'translate(' + posStr + ')' 
    }) 
  }

  function ƒ(str){ return function(d){ return d[str] } } 
}
