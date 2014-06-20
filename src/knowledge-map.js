"use strict";

var d3 = require('d3');
var dagre = require('dagre');

var Renderer = function() {
  this.callbacks = {};

  function callback(name) {
    this.callbacks[name] = [];
    this['on' + name[0].toUpperCase() + name.slice(1)] = function(cb) {
      this.callbacks[name].push(cb);
      return this;
    };
    this[name] = function(data) {
      this.callbacks[name].forEach(function(cb) { cb(data); });
    };
  }

  callback.call(this, 'rows');
  callback.call(this, 'newRows');

  function property(store, access) {
    this[store] = undefined;
    this[access] = function(val) {
      if(undefined === val) {
        return this[store];
      } else {
        this[store] = val;
        return this;
      }
    };
  }

  property.call(this, '_into', 'into');
  property.call(this, 'rowKey', 'key');
  property.call(this, 'makeRows', 'make');

  this.run = function (data) {
    function error(message) {
      throw message;
    }

    var row = '.km-row';

    var rows = this.into().selectAll(row);
    var rowData = rows.data(data, this.rowKey);
    rowData.exit().remove();

    var newRows = this.makeRows(rowData.enter())
               || error('makeColumn did not return a selection');
    newRows.classed(row.substr(1), true);

    this.newRows(newRows);
    this.rows(rowData);

    return this;
  };
};

/*
Given a JSON object with the knowledge data, create a graph object which
will be rendered by dagre-d3.

json: TODO describe what the json should look like
*/
var createGraph = function(json) {
  var self = this;
  this.hold();

  if (json && json.concepts) {
    // Add all the concepts as nodes
    json.concepts.forEach(function(concept) {
      self.addConcept({
        concept: concept
      });
    });
  }

  return this.unhold();
};

/*
Creates the points for the paths that make up the edges
Offsets the in/out edges to above/below given nodes

Replaces the default dagre-d3 PositionEdgePaths function
*/
function positionEdgePaths(g, svgEdgePaths) {
  // Add an ID to each edge
  svgEdgePaths
    .attr('id', function(d) { return d; });

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
function drawHamburgers(graph, nodes) {
  var kg = this;

  // Create a semi-circle path function
  var semicircle = d3.svg.arc()
    .outerRadius(20)
    .startAngle(3*Math.PI/2)
    .endAngle(5*Math.PI/2);

  // Add enter/above
  var enter = nodes.insert('path', 'rect')
    .classed('enter', true)
    .attr('d', semicircle)
    .attr('transform', function() {
      return 'translate(0,' + (-nodes.selectAll('rect').attr('height')/2) + ')';
    });

  // Flip the semi-circle
  semicircle
    .startAngle(Math.PI/2)
    .endAngle(3*Math.PI/2);
  
  // Add exit/below
  var exit = nodes.insert('path', 'rect')
    .classed('exit', true)
    .attr('d', semicircle)
    .attr('transform', function() {
      return 'translate(0,' + (nodes.selectAll('rect').attr('height')/2) + ')';
    });
}

/*
Construct a knowledge map object.

Accepts a single object:
  config: an object that contains the data about the graph and various other
  options
  The available options are:
    graph: a JSON object that contains the graph data
    plugins: a list of plugin names or plugin objects
*/
var KnowledgeMap = function(api, config) {
  config = config || {};

  /*
  Message API
  */
  this.dispatcher = {};

  this.postEvent = function(e) {
    if(this.dispatcher[e.type]) {
      var callbacks = this.dispatcher[e.type];
      callbacks.forEach(function(callback) {
        callback(e);
      });
    }
  };

  this.onEvent = function(type, callback) {
    if(undefined === this.dispatcher[type]) {
      this.dispatcher[type] = [];
    }
    this.dispatcher[type].push(callback);
  };

  /*
  Hold API
  */
  var held    = (!!config.held) ? true : false;
  this.hold   = function() { held = true; return this; }
  this.unhold = function() { held = false; return this; }
  this.held   = function() { return held; }

  /*
  Adds a concept to the graph and then updates the graph rendering

  config:
    concept: The concept object to add
    dependents: A list of concept ids dependent on this one
  */
  this.addConcept = function(config) {
    var kg = this;

    // Add node to the graph
    this.graph.addNode(config.concept.id, {
      label: config.concept.name,
      concept: config.concept,
      width: 50, height: 20,
    });

    // Add dependency edges to the graph
    if (config.concept.dependencies) {
      config.concept.dependencies.forEach(function(dep) {
        kg.addDependency({
          concept: config.concept,
          dependency: dep,
        });
      });
    }

    // Update the graph display
    if(!this.held()) {
      this.render();
    }
  };

  /*
  Adds a dependency to the graph and then updates the graph rendering

  config:
    concept: the concept which depends on another concept
    dependency: the id of the concept which is depended on
  */
  this.addDependency = function(config) {
    // Get ids of the concepts
    var concept = config.concept;
    var dep = config.dependency;

    // Add the dependency to the list of the concept's dependencies
    if (concept.dependencies && concept.dependencies.indexOf(dep) === -1) {
      concept.dependencies.push(dep);
    } else {
      concept.dependencies = [dep];
    }

    // Add the edge to the graph
    this.graph.addEdge(dep+'-'+concept.id, dep, concept.id);

    // Update the graph display
    if(!this.held()) {
      this.render();
    }
  };

  /*
  Removes a dependency from the graph and then updates the graph rendering
  */
  this.removeDependency = function(config) {
    // Get ids of concepts
    var con = config.concept;
    var dep = config.dependency;

    // Remove the dependency from the concept
    var concept = this.graph.node(con).concept;
    if (concept.dependencies) {
      var index = concept.dependencies.indexOf(dep);
      concept.dependencies.splice(index, 1);
    }

    // Remove the edge from the graph
    this.graph.delEdge(dep+'-'+con);

    // Update the graph display
    if(!this.held()) {
      this.render();
    }
  };

  /*
  Returns true if the graph has this dependency and false otherwise
  */
  this.hasDependency = function(config) {
    // Get ids of concepts
    var concept = config.concept;
    var dep = config.dependency;

    // Return true if edge exists
    return this.graph.hasEdge(dep+'-'+concept);
  };

  /*
  Renders/rerenders the graph elements
  */
  this.render = function() {
    this.provideLayout(dagre.layout().run(this.graph));
  };

  /*
  Give the graph a layout to be rendered.
  */
  this.provideLayout = function(layout) {
    this.layout = layout;
    var self = this;

    var nodes = layout.nodes().map(function(id) {
      return {
        id: id,
        value: self.graph.node(id),
        layout: layout.node(id)
      };
    });
    this.renderNodes.run(nodes);

    var edges = layout.edges().map(function(id) {
      return {
        id: id,
        u: layout.node(layout._edges[id].u),
        v: layout.node(layout._edges[id].v),
        value: self.graph.edge(id),
        layout: layout.edge(id)
      };
    });
    this.renderEdges.run(edges);
  };

  /*
  Outputs the graph as a JSON object
  */
  this.toJSON = function() {
    var json = {
      concepts: [],
    };

    // Add all of the concepts
    this.graph.eachNode(function(id, node) {
      json.concepts.push(node.concept);
    });

    return JSON.stringify(json);
  };
  
  /*
  Deletes a concept from the graph
  */
  this.removeConcept = function(conceptId) {
    var kg = this;
    var concept = kg.graph.node(conceptId).concept;

    // Remove all links to concepts that this one depends on
    if(concept.dependencies) {
      concept.dependencies.forEach(function(dependency) {
        kg.removeDependency({
          concept: conceptId,
          dependency: dependency,
        });
      });
    }

    // Remove all links to concepts that depend on this
    var dependants = kg.getDependants(conceptId);
    if(dependants.length) {
      dependants.forEach(function(dependant) {
        kg.removeDependency({
          concept: dependant,
          dependency: conceptId,
        });
      });
    }

    // Remove the node
    kg.graph.delNode(conceptId);

    // Update the display
    if(!this.held()) {
      this.render();
    }
  };

  /*
  Return a list of IDs of concepts that depend on a given concept, i.e.
  have this concept as a dependency
  */
  this.getDependants = function(conceptId) {
    return this.graph.successors(conceptId);
  };

  /*
  Add a piece of content to a concept
  */
  this.addContent = function(conceptId, content) {
    var concept = this.graph.node(conceptId).concept;
    if(concept.content) {
      concept.content.push(content);
    } else {
      concept.content = [content];
    }
  };

  /*
  Update a piece of content in a concept
  */
  this.updateContent = function(conceptId, contentIndex, content) {
    var concept = this.graph.node(conceptId).concept;
    if(contentIndex >= concept.content.length) {
      this.addContent(conceptId, content);
    } else {
      concept.content[contentIndex] = content;
    }
  };

  /*
  Remove a piece of content from a concept
  */
  this.removeContent = function(conceptId, contentIndex) {
    var concept = this.graph.node(conceptId).concept;
    concept.content.splice(contentIndex, 1);
  };

  // Create the directed graph
  this.graph = new dagre.Digraph();
  createGraph.call(this, config.graph);

  // Create an element on the page for us to render our graph in
  var parentName = config.inside || 'body';
  this.element = d3.select(parentName).append('svg').append('g');
  this.edgeContainer = this.element.append('g').classed('edges', true);
  this.nodeContainer = this.element.append('g').classed('nodes', true);

  this.renderNodes = new Renderer()
    .into(this.nodeContainer)
    .key(function(d) { return d.id; })
    .make(function(e) { return e.append('g'); })
    .onNewRows(this.defaultOnNewNodes = function(nodes) {
        nodes.append('circle')
          .attr('r', 10);
        nodes.append('text')
          .attr('text-anchor', 'middle');
      })
    .onRows(this.defaultOnNodes = function(nodes) {
        nodes.select('text')
          .text(function(d) { return d.value.label.split(' ').shift(); })
          .attr('fill', 'red');
        nodes.select('circle')
          .transition()
          .attr('cx', function(d) { return d.layout.x; })
          .attr('cy', function(d) { return d.layout.y; });
        nodes.select('text')
          .transition()
          .attr('x', function(d) { return d.layout.x; })
          .attr('y', function(d) { return d.layout.y; });
      });

  this.renderEdges = new Renderer()
    .into(this.edgeContainer)
    .key(function(d) { return d.id; })
    .make(function(e) { return e.append('g'); })
    .onNewRows(this.defaultOnNewEdges = function(edges) {
      edges.append('line')
        .attr('stroke-width', 2)
        .attr('stroke', 'black');
    })
    .onRows(this.defaultOnEdges = function(edges) {
      edges.select('line')
        .attr('x1', function(d) { return d.u.x; })
        .attr('y1', function(d) { return d.u.y; })
        .attr('x2', function(d) { return d.v.x; })
        .attr('y2', function(d) { return d.v.y; });
    });

  // Initialise plugins for graph.
  if(config && config.plugins) {
    for(var i = 0; i < config.plugins.length; i++) {
      var plugin = config.plugins[i];
      if('string' === typeof(plugin)) {
        plugin = api.plugins[plugin];
      }
      if(plugin && plugin.run) {
        plugin.run(this);
      }
    }
    this.__defineGetter__('plugins', function() {
      return config.plugins;
    });
    this.__defineSetter__('plugins', function() {});
  }

  // Display the graph
  if(!this.held()) {
    this.render();
  }

  return this;
};

/*
Public API for the knowledge-map library
*/
var api = {
  d3: d3,
  dagre: dagre,

  /*
  Create a knowledge map display that layouts out the entire graph.
  */
  create: function(config) {
    return new KnowledgeMap(this, config);
  },

  plugins: {},

  registerPlugin: function(plugin) {
    if(plugin && plugin.name && plugin.run) {
      this.plugins[plugin.name] = plugin;
    }
  }
};

global.knowledgeMap = api; 
module.exports = api;
