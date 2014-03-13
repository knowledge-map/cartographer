"use strict";

var dagreD3 = require('dagre-d3');
var d3 = require('d3');

var knowledgeGraph = {
  dagreD3: dagreD3,
  d3: d3
};

global.knowledgeGraph = knowledgeGraph; 
module.exports = knowledgeGraph;
