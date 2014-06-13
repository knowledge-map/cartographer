var d3 = require('d3');
var dagre = require('dagre');
var grid = require('../node_modules/grid-d3/src/grid-d3.js');

window.onload = function() {
  var g = new dagre.Digraph();

  g.addNode("kspacey",    { label: "Kevin Spacey",  width: 50, height: 20, concept: { thing: 'Kevin-ness' }});
  g.addNode("swilliams",  { label: "Saul Williams", width: 50, height: 20, concept: { thing: 'Saul-ness' }});
  g.addNode("bpitt",      { label: "Brad Pitt",     width: 50, height: 20, concept: { thing: 'Brad-ness' }});
  g.addNode("hford",      { label: "Harrison Ford", width: 50, height: 20, concept: { thing: 'Harrisonness' }});
  g.addNode("lwilson",    { label: "Luke Wilson",   width: 50, height: 20, concept: { thing: 'Lukeness' }});
  g.addNode("kbacon",     { label: "Kevin Bacon",   width: 50, height: 20, concept: { thing: 'Inverness' }});

  g.addEdge(null, "kspacey",   "swilliams");
  g.addEdge(null, "swilliams", "kbacon");
  g.addEdge(null, "bpitt",     "kbacon");
  g.addEdge(null, "hford",     "lwilson");
  g.addEdge(null, "lwilson",   "kbacon");

  var body = d3.select('body');
  var svg = body.append('svg');
  var edgeContainer = svg.append('g').classed('edges', true);
  var nodeContainer = svg.append('g').classed('nodes', true);

  var AsNodes = function(config) {
    config = config || {};
    grid.GridBase.call(this);

    this.cellKey = function(d) { return d.id; };

    this.makeRow = config.makeRow || function(e) {
      return e.append('g');
    };

    this.makeColumn = config.makeColumn || function(e) {
      return e.append('g');
    };

    this.onCells(this.defaultOnCells = function(cells) {
      cells.select('circle')
        .transition()
        .attr('cx', function(d) { return d.layout.x; })
        .attr('cy', function(d) { return d.layout.y; });
      cells.select('text')
        .transition()
        .attr('x', function(d) { return d.layout.x; })
        .attr('y', function(d) { return d.layout.y; });
    });

    this.onNewCells(this.defaultOnNewCells = function(cells) {
      cells.append('circle')
        .attr('r', 10);
      cells.append('text')
        .attr('text-anchor', 'middle');
    });
  };

  var AsEdges = function(config) {
    config = config || {};
    grid.GridBase.call(this);

    this.makeRow = config.makeRow || function(e) {
      return e.append('g');
    };

    this.makeColumn = config.makeColumn || function(e) {
      return e.append('g');
    };

    this.onNewCells(this.defaultOnNewCells = function(edges) {
      //
    });
  };

  function removeNode(d) {
    g.delNode(d.id);
    layout(g);
    d3.event.stopPropagation();
  };

  var asNodes = new AsNodes()
    .into(nodeContainer)
    .onCells(function(cells) {
      cells.select('text')
        .text(function(d) { return d.value.label.split(' ').shift(); })
        .attr('fill', 'red')
        .on('click', removeNode);
      cells.select('circle')
        .on('click', removeNode);
    })
    .onNewCells(function(cells) {
      //cells.style('opacity', 0).transition().style('opacity', 1);
    });

  var asEdges = new AsEdges()
    .into(edgeContainer)
    .onCells(function(cells) {
      cells.select('line')
        .attr('x1', function(d) { return d.u.x; })
        .attr('y1', function(d) { return d.u.y; })
        .attr('x2', function(d) { return d.v.x; })
        .attr('y2', function(d) { return d.v.y; });
    })
    .onNewCells(function(cells) {
      cells.append('line')
        .attr('stroke-width', 2)
        .attr('stroke', 'black');
    });

  function layout(graph) {
    var layout = dagre.layout().run(graph);

    var nodes = [layout.nodes().map(function(id) {
      return {
        id: id,
        value: graph.node(id),
        layout: layout.node(id)
      };
    })];
    grid.render2D(nodes, asNodes);

    var edges = [layout.edges().map(function(id) {
      return {
        id: id,
        u: layout.node(layout._edges[id].u),
        v: layout.node(layout._edges[id].v),
        value: graph.edge(id),
        layout: layout.edge(id)
      };
    })];
    grid.render2D(edges, asEdges);
  };

  window.onclick = function() {
    var stamp = new Date().toISOString();
    g.addNode(stamp, { label: stamp,  width: 50, height: 20, concept: { thing: stamp }});
    layout(g);
  };

  layout(g);
};
