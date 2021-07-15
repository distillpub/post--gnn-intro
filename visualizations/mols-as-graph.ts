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

const steelblue = d3.color('steelblue')
const blue = steelblue.darker(-.5);
const blueDark =steelblue.darker(2);

export class XsAsGraphs {
  parent = d3.select('#mols-as-graph');
  names = ['caffeine', 'citronellal', 'othello', 'karate']

  constructor() {
    this.names.forEach(name => {
      const holder = d3.select('#mols-as-graph-' + name)
        .html('')
        .append('div.mol-holder')
      new XAsGraph(name, holder);
    })
  }
}

export class XAsGraph {
  graph: { nodes: any, links: any };
  svg;
  link;
  node;
  adjMat;

  constructor(private name, private parent) {
    this.init();
  }

  private async init() {
    this.graph = await d3.json(`x-to-graph/${this.name}.json`);
    this.makeImg()
    this.makeGraph();
    this.makeAdjMat();
  }
  /**
   * Load the image, including click handlers
   */
  private makeImg() {
    const imgHolder = this.parent
      .append('div')
      .classed('img-holder', true);

    const imgName = this.name + '.png';
    imgHolder
      .append('img')
      .attr('src', `x-to-graph/${imgName}`);
  }

  private makeAdjMat() {
    const svg = this.parent.append('svg');

    const pairs = d3.cross(this.graph.nodes, this.graph.nodes);
    // Determine what pairs are actually edges.
    pairs.forEach(pair => {
      this.graph.links.forEach((link, i) => {
        if ((link.source.id === pair[0].id && link.target.id === pair[1].id) ||
          (link.source.id === pair[1].id && link.target.id === pair[0].id)) {
          pair.isEdge = true;
          pair.edge = link;
        }
      })
    });

    const w = 300 / this.graph.nodes.length;
    this.adjMat =  svg
      .selectAll('rect')
      .data(pairs)
      .enter()
      .append('rect')
      .attr('width', w - .1)
      .attr('height', w - .1)
      .translate(d => [d[0].index * w + .2, d[1].index * w + .2])
      .attr('fill', d => d.isEdge ? blue : '#fff')
      .attr('stroke', '#aaa')
      .attr('stroke-width', .1)
      .on('mouseenter', (d) => d.edge? this.mouseenterEdge(d.edge) : null)
      .on('mouseleave', (d) => this.mouseleave());


    svg.appendMany('g', this.graph.nodes)
      .translate(d => [d.index*w + w/2, -10])
      .append('text').at({transform: 'rotate(-90)', textAnchor: 'start'})
    svg.appendMany('text', this.graph.nodes)
      .translate(d => [-10, d.index*w + w/2]).at({textAnchor: 'end',})

    const t = (d) => {
      if (this.name === 'karate') {
        if (d.id === 0) {
          return 'Mr. Hi';
        }
        if (d.id === this.graph.nodes.length - 1) {
          return 'John H.'
        }
        else {
          return `student ${d.id}`
        }
      } 
      return d.club || d.id
    }

    this.aTextSel = svg.selectAll('text')
      .text(d => t(d))
      .at({fontSize: 6, fill: '#999', dy: '.33em'})
      .on('mouseenter', (d) => this.mouseenterNode(d))
      .on('mouseleave', (d) => this.mouseleave());


    if (this.name == 'othello') this.parent.st({marginTop: 60})


    // Move graph to the right
    this.parent.select('svg').raise()

  }

  private addLabel(sel, d) {
    d3.select(sel).append("text")
    .text(d.id)
    .attr('stroke', '#fff')
    .attr('stroke-width', '3')
    .attr('x', 5)
    .attr('y', 3)
  d3.select(sel).append("text")
    .text(d.id)
    .attr('x', 5)
    .attr('y', 3)
  }

  private removeLabel(sel) {
    d3.select(sel).selectAll("text").remove();
  }


  private makeGraph() {
    this.svg = this.parent.append('svg')
      .at({fontSize: '12px'})

    const simulation = d3.forceSimulation()
      .force("link", d3.forceLink().distance(50).id((d) => d.id.toString()).strength(.2))
      .force("charge", d3.forceManyBody().strength(this.name == 'othello' ? -500 : -40))
      .force("center", d3.forceCenter(150, 150))

    simulation
      .nodes(this.graph.nodes);

    simulation.force("link")
      .links(this.graph.links);

    //For performance reasons, don't render the first 300 iterations.
    for (let i = 0; i < 500; i++) simulation.tick();

    this.link = this.svg.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(this.graph.links)
      .enter().append("line")
      .attr("stroke-width", 1)
      .attr("stroke", blue)
      .attr("opacity", '.5')
      .on('mouseenter', (d) => this.mouseenterEdge(d))
      .on('mouseleave', (d) => this.mouseleave());


    const that = this;
    this.node = this.svg.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(this.graph.nodes)
      .enter().append("g")
      .call(d3.attachTooltip)
      .on('mouseenter', function(d) {
        that.addLabel(this, d);
      })
      .on('mouseleave', function(d) {
        that.removeLabel(this);
      });

    this.node.append("circle")
      .attr("r", 5)
      .attr("fill", '#fff')
      .attr('stroke', '#000')
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
      .on('mouseenter', (d) => this.mouseenterNode(d))
      .on('mouseleave', (d) => this.mouseleave());
      
    simulation.on("tick", () => ticked());

    const ticked = () => {
      this.link
        .attr("x1", function (d) { return d.source.x; })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; })
        .attr("y2", function (d) { return d.target.y; });

      this.node
        .attr("transform", function (d) {
          return "translate(" + d.x + "," + d.y + ")";
        })
    }

    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.2).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  }


  private mouseenterEdge(datum)  {
    // Update the colors of the graph.
    const isEdge = (d) => (datum.source==d || datum.target==d);
    this.node.selectAll('circle')
      .attr('stroke','#000')
      .attr('stroke-width', d=> isEdge(d)? 3 : 1);
    this.link
      .attr('stroke', d=> d==datum ? blueDark : blue)
      .attr('stroke-width', d=> d==datum ? 3 : 1)
      .attr("opacity", d => d==datum ? 1 : .5);

    this.aTextSel
      .at({fill: d => d == datum ? '#000' : '#999'})

    // Update the colors of the adj mat.
    this.adjMat
      .attr('fill', d => !d.isEdge ? '#fff' : (d.edge == datum) ? blueDark : blue);
  }

  private mouseenterNode(datum)  {
    // Update the colors of the graph.
    const isEdge = (d) => (d.source==datum || d.target==datum);
    this.node.selectAll('circle')
      .attr('stroke', '#000')
      .attr('stroke-width', d=> d==datum? 3 : 1);
    this.link
      .attr('stroke', d=> isEdge(d) ? blueDark : blue)
      .attr('stroke-width', d=> isEdge(d) ? 3 : 1)
      .attr("opacity", d => isEdge(d) ? 1 : .5);

    // Update the colors of the adj mat.
    this.adjMat
      .attr('fill', d => !d.isEdge ? '#fff' : (d[0] === datum || d[1] === datum) ? blueDark : blue);
  }
  
  private mouseleave()  {
    // Reset the colors of the graph.
    this.node.selectAll('circle')
      .attr('stroke', '#000')
      .attr('stroke-width', 1);
    this.link
      .attr('stroke', blue)
      .attr('stroke-width',  1)
      .attr("opacity", .5);

    this.node.selectAll('text').remove();

    // Reset the colors of the adj mat.
    this.adjMat
      .attr('fill', d => !d.isEdge ? '#fff' : blue);
  }
}

if (module.hot) {
  new XsAsGraphs();
  module.hot.accept()
}

