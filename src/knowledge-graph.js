"use strict";

var dagreD3 = require('dagre-d3');
var d3 = require('d3');

/*

Given a JSON object with the knowledge data, create a graph object which
will be rendered by dagre-d3.

json: TODO describe what the json should look like

*/
var createGraph = function(json) {
  var graph = new dagreD3.Digraph();
  // Add all the concepts as nodes
  json.concepts.forEach(function(concept) {
    graph.addNode(concept.id, {
     label: concept.name,
     concept: concept,
    });
  });
  // Check each concept for dependencies and add them as edges
  json.concepts.forEach(function(concept) {
    if (Array.isArray(concept.dependencies)) {
      concept.dependencies.forEach(function(dep) {
        // Add an edge from the dependency to the concept with a null edge ID
        graph.addEdge(null, dep, concept.id);
      });
    } else {
      // Dependencies is undefine/not an array and we'll figure out what to do with it later
    }
  });
  return graph;
};

/*

Creates the points for the paths that make up the edges
Offsets the in/out edges to above/below given nodes

Replaces the default dagre-d3 PositionEdgePaths function
*/
function positionEdgePaths(g, svgEdgePaths) {
  var interpolate = this._edgeInterpolate,
      tension = this._edgeTension;

  function calcPoints(e) {
    var value = g.edge(e);
    var source = g.node(g.incidentNodes(e)[0]);
    var target = g.node(g.incidentNodes(e)[1]);
    var points = value.points.slice();

    var p0 = points.length === 0 ? target : points[0];
    var p1 = points.length === 0 ? source : points[points.length - 1];

    points.unshift(nodePosition(source, p0));
    points.push(nodePosition(target, p1));

    return d3.svg.line()
      .x(function(d) { return d.x; })
      .y(function(d) { return d.y; })
      .interpolate(interpolate)
      .tension(tension)
      (points);
  }

  svgEdgePaths.filter('.enter').selectAll('path')
      .attr('d', calcPoints);

  this._transition(svgEdgePaths.selectAll('path'))
      .attr('d', calcPoints)
      .style('opacity', 1);
}

function nodePosition(node, point) {
  var x = node.x;
  var y = node.y;
  var r = 25;
  
  var dx = point.x - x;
  var dy = point.y - y;

  // Length of the line from the circle to the point
  var l = Math.sqrt(dx*dx + dy*dy);
  // Unit values
  var dxu = dx/l;
  var dyu = dy/l;

  // Offset above/below depending whether the line is up or down
  var offset = ((dy > 0) ? 1 : -1) * node.height/4;

  return {x: x + dxu*r, y: y + offset + dyu*r}; 
}

/*

Adds entry and exit points for edges into concept elements

Used in addition to the default node rendering function

*/
function drawEntryExit(graph, nodes) {
  var kg = this;

  // Add enter/above
  var enter = nodes.insert('circle', 'rect')
    .attr('r', 25)
    .attr('cy', function() {
      return -nodes.selectAll('rect').attr('height')/2;
    });

  // Add dependency to this concept if entry point is clicked
  enter.on('click', function(conceptId) {
    // Get concept clicked on
    var concept = graph.node(conceptId).concept;

    // Create a new concept
    var newConcept = {
      id: "node-"+graph.nodes().length,
      name: '',
      dependencies: [],
    };

    // Add it to the graph
    kg.addConcept({
      concept: newConcept,
      dependents: [concept.id],
    });
  });
  
  // Add exit/below
  var exit = nodes.insert('circle', 'rect')
    .attr('r', 25)
    .attr('cy', function() {
      return nodes.selectAll('rect').attr('height')/2;
    });

  // Add concept with a dependency on this concept if exit point is clicked
  exit.on('click', function(conceptId) {
    // Get concept clicked on
    var concept = graph.node(conceptId).concept;

    // Create a new concept
    var newConcept = {
      id: "node-"+graph.nodes().length,
      name: '',
      dependencies: [concept.id],
    };

    // Add it to the graph
    kg.addConcept({
      concept: newConcept,
    });
  });

  return nodes;
}


/*

The knowledgeGraph object is the public API for the knowledge-graph library

*/
var knowledgeGraph = new function() {
/*

Create a knowledge graph display that layouts out the entire graph.

config: an object that contains the data about the graph and various other
options
The available options are:
  graph: a JSON object that contains the graph data

*/
this.create = function(config) {
  // Create the directed graph
  var graph = this.graph = createGraph(config.graph);

  // Create an element on the page for us to render our graph in
  var element = this.element = d3.select('body').append('svg');

  // Use dagre-d3 to render the graph
  var renderer = this.renderer = new dagreD3.Renderer();

  // Update the way edges are positioned
  renderer.layout().rankSep(100);
  renderer.positionEdgePaths(positionEdgePaths);

  // Add transitions for graph updates
  renderer.transition(function(selection) {
    return selection
      .transition()
        .duration(500);
  });

  // Add enter/exit circles
  var kg = this;
  var drawNodes = renderer.drawNodes();
  renderer.drawNodes(function(graph, element) {
    var nodes = drawNodes(graph, element);
    drawEntryExit.call(kg, graph, nodes);

    return nodes;
  });

  // Display the graph
  this.render();
};

/*
Adds a concept to the graph and then updates the graph rendering

config:
  concept: The concept object to add
  dependents: A list of concepts dependent on this one
*/
this.addConcept = function(config) {
  var kg = this;

  // Add node to the graph
  this.graph.addNode(config.concept.id, {
    label: config.concept.name,
    concept: config.concept,
  });

  // Add dependent edges to the graph
  if (config.dependents) {
    config.dependents.forEach(function(dep) {
      if (dep.dependencies) {
        dep.dependencies.push(config.concept.id);
      } else {
        dep.dependencies = [config.concept.id];
      }

      kg.graph.addEdge(null, config.concept.id, dep);
    });
  }

  // Add dependency edges to the graph
  if (config.concept.dependencies) {
    config.concept.dependencies.forEach(function(dep) {
      kg.graph.addEdge(null, dep, config.concept.id);
    });
  }

  // Update the graph display
  this.render();
};


/*

Renders/rerenders the graph elements

*/
this.render = function() {
  // Run the renderer
  this.renderer.run(this.graph, this.element);
  
  // Don't add another element for the zoom
  this.renderer.zoomSetup(function(graph, element) {
    this.element = element;
    return element;
  });
};
  
  return this;
}();

global.knowledgeGraph = knowledgeGraph; 
module.exports = knowledgeGraph;
