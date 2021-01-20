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
import { GraphData, Edge, Node, copy, Config } from './util';
import * as d3 from 'd3';

export enum Mode {
  Add,
  Remove
}

export class Graph {
  private nodes: any;
  private nodesHolder: any;
  private edges: any;
  private edgesHolder: any;
  private simulation: any;
  private mode = Mode.Add;
  private hoverNode;
  nodeColors;
  private origData: GraphData;

  constructor(public data: GraphData, private config: Config, private molEditedCallback: (d) => void) {
    this.origData = copy(this.data);
    const idsToName = ['Carbon', 'Nitrogen', 'Oxygen', 'Sulphur'];
    this.nodeColors = ["#60c4a0", "#355ca1", "#e34242", "#e3d642"];
    this.init();
  }


  private async init() {
    const svg = d3.select("#playground svg");

    // Creat holders for nodes and edges (to deal with layers) 
    this.edgesHolder = svg.append('g');
    this.nodesHolder = svg.append('g');

    // Create the force simulation
    const bb = svg.node().getBoundingClientRect();
    this.simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id((d) => d.id).distance(50).strength(1))
      .force("charge", d3.forceManyBody().strength(-10))
      .force('center', d3.forceCenter(bb.width / 2, bb.height / 2))
      .on("tick", () => this.render());
      
    this.restart();
    this.render();
  }


  private restart() {
    this.simulation.stop();
    this.updateSelectionsToMatchData();
    // Start the simulation.
    this.simulation.nodes(this.data.nodes);
    this.simulation.force("link").links(this.data.edges);
    this.simulation.alpha(1).restart();
  }

  private updateSelectionsToMatchData() {
    if (this.edges && this.nodes) {
      this.edges.remove();
      this.nodes.remove();
    }

    const that = this;
    // Create or add edges based on this.data.edges.
    this.edges = this.edgesHolder.selectAll('g.edges')
      .data(this.data.edges)
      .enter()
      .append("g")
      .classed("edges", true)
      .classed("hidden", d => d.source.id > d.target.id)
      .on("mouseenter", function (d) { that.mouseoverEdge(this, d) })
      .on("mouseleave", function (d) { that.mouseoutEdge(this, d) })
      .on("click", (d) => this.clickEdge(d));
    this.edges.append('line').classed('clickTarget', true)
    this.edges.append('line').classed('dashed', true)
    this.edges.append('line').classed('outline', true)
    this.edges.append('line').classed('white', true)
    this.edges.append('line').classed('middle', true)

    // Create or add nodes based on this.data.edges.
    this.nodes = this.nodesHolder.selectAll('g.nodes')
      .data(this.data.nodes)
      .enter()
      .append('g')
      .attr("class", "nodes")
      .call(d3.drag()
        .on("start", (d) => this.dragstartedNode(d))
        .on("drag", (d) => this.draggedNode(d))
        .on("end", (d) => this.dragendedNode(d)))
      .on("mouseover", function (d) { that.mouseoverNode(this, d) })
      .on("mouseleave", function (d) { that.mouseoutNode(this, d) })
      .on("click", () => d3.event.stopPropagation())

    this.nodes
      .append("circle")
      .attr("fill", (d) => this.nodeColors[this.oneHotIdx(d)])

    this.render();
  }

  // Set the current interaction mode.
  setMode(mode: Mode) {
    this.mode = mode;
  }

  // What happens at every simulation tick. Note that the x and y 
  //updates of this.data.nodes are being updated behind the scenes.
  private render() {
    const tripleW = 10;
    const dblW = 6;
    const lineW = 2;

    const selectLines = (classStr) => 
    this.edges
      .selectAll(`line.${classStr}`)
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y)
      .attr('stroke', d => d.highlighted ? '#000' : '#999');

    selectLines('clickTarget')
      .attr("stroke", 'rgba(0, 0, 0, 0)')
      .attr("stroke-width", 15)

    selectLines('dashed')
      .attr("stroke-width", d => [0, 0, 0, lineW*4][this.oneHotIdx(d)])
      .attr('stroke-dasharray', "2, 2")

    selectLines('outline')
      .attr("stroke-width", d => [0, dblW, tripleW, 0][this.oneHotIdx(d)]);

    selectLines('white')
      .attr('stroke', 'white')
      .attr("stroke-width", d => [0, dblW-lineW*2, tripleW-lineW*2, 0][this.oneHotIdx(d)]);
    
    selectLines('middle')
      .attr("stroke-width", d => {
        return [lineW, 0, lineW, 0][this.oneHotIdx(d)]
      })
      .attr('stroke-dasharray', d => d.dotted ? "2, 2" : undefined)


    this.nodes
      .attr("transform", (d) => "translate(" + d.x + "," + d.y + ")")
      .select('circle')
      .attr("r", 7)
      .attr("opacity", d => d.hidden ? 0 : (d.adding ? .5 : 1))
      .attr('stroke-dasharray', d => d.adding ? "2, 2" : undefined)
      .attr("stroke", '#000')
      .attr("stroke-width", (d) => d.outline ? '2' : '1')
      .attr("pointer-events", (d) => d.pointer_events)
  }


  /** Util method to get the last node. */
  private lastNode() {
    return this.data.nodes[this.data.nodes.length - 1];
  }

  /** Util method to get the last edge. */
  private lastEdge() {
    return this.data.edges[this.data.edges.length - 1];
  }
  private secondToLastEdge() {
    return this.data.edges[this.data.edges.length - 2];
  }

  ////////////////////////////////////////////////////////////////////
  // Manipulation handlers
  ////////////////////////////////////////////////////////////////////

  private dragstartedNode(d) {
    this.simulation.stop();

    // If we are in add mode, create a new node and edge, and start dragging it.
    if (this.mode === Mode.Add) {
      d.outline = true;
      const lastId = this.data.nodes.length;
      const newNode = {
        id: lastId,
        x: d3.event.x,
        y: d3.event.y,
        initX: d3.event.x,
        initY: d3.event.y,
        pointer_events: 'none',
        outline: true,
        adding: true,
        hidden: true,
        properties: copy(this.config.nodeDefaultProps)
      }
      this.data.nodes.push(newNode)
      this.data.edges.push({
        source: newNode,
        target: d,
        properties: copy(this.config.edgeDefaultProps),
        dotted: true,
      })
      this.data.edges.push({
        source: d,
        target: newNode,
        properties: copy(this.config.edgeDefaultProps),
        dotted: true,
      })
      this.updateSelectionsToMatchData();
      this.simulation.stop();
    }
  }

  private draggedNode(d) {
    // If we're adding, move the new node around.
    if (this.mode === Mode.Add) {
      const addedNode = this.lastNode();
      addedNode.x = d3.event.x;
      addedNode.y = d3.event.y;
      this.updateSelectionsToMatchData();
    }
  }

  private dragendedNode(d) {
    // If we are adding a node, check if we should keep the new node or just the new edge.
    if (this.mode === Mode.Add) {
      // If this is really just a click, change the value of the node.
      const wasClick = Math.abs(d.x - d3.event.x) < 20 && Math.abs(d.y - d3.event.y) < 20;
      if (wasClick) {
        this.progressOneHotIdx(d);
        this.data.nodes.pop();

        this.data.edges.pop();
        this.data.edges.pop();
        this.updateSelectionsToMatchData();
      } else {
        // If we ended up hovering over a different node, connect to that one instead.
        if (this.hoverNode && (this.hoverNode !== d)) {
          this.lastEdge().target = this.hoverNode;
          this.secondToLastEdge().source = this.lastEdge().target;
          this.secondToLastEdge().target = this.lastEdge().source;
          this.data.nodes.pop();
        } else {
          this.lastNode().initX = d3.event.x;
          this.lastNode().initY = d3.event.y;
        }
        d.outline = undefined;
        this.lastNode().adding = false;
        this.lastEdge().dotted = false;
        this.secondToLastEdge().dotted = false;

        // Remove the pointer events hack.
        this.lastNode().pointer_events = null;
        this.restart();
      }
    }

    // Remove the 'close' before running the model.
    this.molEditedCallback(this.data);
  }

  private mouseoverNode(sel, d) {
    d.outline = true;
    this.hoverNode = d;
    if (this.lastNode().adding) {
      this.lastNode().hidden = true;
    }
    if (!d.hasClose) {
      this.addX(sel, d);
    }
    this.render();
  }

  private mouseoutNode(sel, d) {
    this.removeX(sel, d);

    d.outline = undefined;
    this.lastNode().hidden = false;
    this.render();
    this.hoverNode = undefined;
  }

  private clickEdge(d) {
    d3.event.stopPropagation();
    this.progressOneHotIdx(d);
  }
  private mouseoverEdge(sel, d) {
    this.addX(sel, d, true);
    d.highlighted = true;
    this.render();
  }
  private mouseoutEdge(sel, d) {
    this.removeX(sel, d);
    d.highlighted = undefined;
    this.render();
  }

  private addX(sel, d, edge = false) {
    d.hasClose = true;
    const removeNode = () => {
      this.simulation.stop();
      this.data.edges = this.data.edges.filter(e => (e.source != d) && (e.target != d))
      this.data.nodes.splice(this.data.nodes.indexOf(d), 1);
      this.updateSelectionsToMatchData();
      this.restart()
      this.molEditedCallback(this.data);
    }
    const removeEdge = () => {
      this.simulation.stop();
      this.data.edges.splice(this.data.edges.indexOf(d), 1);
      const reverseEdge = this.reverseEdge(d);
      this.data.edges.splice(this.data.edges.indexOf(reverseEdge), 1);

      this.updateSelectionsToMatchData();
      this.restart();
      this.molEditedCallback(this.data);
    }
    const close = d3.select(sel)
      .append('g')
      .style('cursor', 'default')

    const x = edge ? (d.source.x + d.target.x) / 2 + Math.abs(d.source.y - d.target.y) / 4 : 7;
    const y = edge ? (d.source.y + d.target.y) / 2 + Math.abs(d.source.x - d.target.x) / 4 : -7;

    // Make the hover target easier.
    close.append('rect')
      .attr('width', 30)
      .attr('height', 30)
      .attr('x', -15)
      .attr('y', -15)
      .attr('fill', 'rgba(0, 0, 0, 0)')
      .attr('transform', edge ? "translate(" + x + "," + y + ")" : null)


    close.append('text')
      .text('x')
      .attr('transform', "translate(" + x + "," + y + ")")
      .attr('fill', '#aaa')
      .on('mousedown', () => d3.event.stopPropagation())
      .on('mouseup', () => {
        d3.event.stopPropagation();
        edge ? removeEdge() : removeNode();
      });
  }

  // Remove the 'x' to close;
  private removeX(sel, d) {
    if (d.hasClose) {
      d3.select(sel).select('g').remove();
      d.hasClose = undefined;
    }
  }

  updateData(data) {
    this.simulation.stop();
    this.data = data;
    this.origData = copy(this.data);
    this.restart();
  }

  private oneHotIdx(elt: Node | Edge) {
    const keys = Object.keys(elt.properties);
    const idx = keys.indexOf(keys.find(k => elt.properties[k] == 1));
    return idx
  }

  private progressOneHotIdx(elt: Node | Edge) {
    const progress = (elt) => {
      const props = elt.properties;
      const keys = Object.keys(props);
      const idx = keys.indexOf(keys.find(k => props[k] == 1));
      const nextIdx = (idx + 1) % keys.length;
      keys.forEach(key => props[key] = 0);
      props[keys[nextIdx]] = 1;
    }
    progress(elt);
    // The graph contains two way edges; progress both.
    if (elt.source) {
      progress(this.reverseEdge(elt));
    }
    this.updateSelectionsToMatchData();
  }

  private reverseEdge(elt) {
    return this.data.edges.find(e => ((e.source == elt.target) && (e.target == elt.source)));
  }
  
  resetData() {
    this.updateData(this.origData);
  }
}
