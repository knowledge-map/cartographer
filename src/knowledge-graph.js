"use strict";

var dagreD3 = require('dagre-d3');
var d3 = require('d3');

/* Create a knowledge graph display that layouts out the entire graph.

config: an object that contains the data about the graph and various other
options
The available options are:
  graph: a JSON object that contains the graph data
 
*/
var create = function(config) {
  // Create an element on the page for us to render our graph in
  var element = d3.select('body').append('svg');
  // Use dagre-d3 to render the graph
  var renderer = new dagreD3.Renderer();
  renderer.run(config.graph, element);
};

var knowledgeGraph = {
  dagreD3: dagreD3,
  d3: d3,
  create: create,
};

global.knowledgeGraph = knowledgeGraph; 
module.exports = knowledgeGraph;
