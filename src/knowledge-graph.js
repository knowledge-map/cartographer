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
     label: concept.name
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

Create a knowledge graph display that layouts out the entire graph.

config: an object that contains the data about the graph and various other
options
The available options are:
  graph: a JSON object that contains the graph data
  plugins: a list of plugin names or plugin objects

*/
var create = function(config) {
  var graph = createGraph(config.graph);
  // Initialise plugins for graph.
  if(undefined !== config.plugins) {
    for(var i = 0; i < config.plugins.length; i++) {
      config.plugins[i].run(this);
    }
  }
  this.__defineGetter__('plugins', function() {
    return config.plugins;
  });
  this.__defineSetter__('plugins', function() {});
  // Create an element on the page for us to render our graph in
  var element = d3.select('body').append('svg');
  // Use dagre-d3 to render the graph
  var renderer = new dagreD3.Renderer();
  renderer.run(graph, element);
  return this;
};

var knowledgeGraph = {
  create: create,
};

global.knowledgeGraph = knowledgeGraph; 
module.exports = knowledgeGraph;
