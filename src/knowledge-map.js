"use strict";

var d3 = require('d3');
var dagre = require('dagre');

function callback(name) {
  this.callbacks[name] = [];
  var capName = name[0].toUpperCase() + name.slice(1);

  this['do' + capName] = function() {
    var args = Array.prototype.slice.call(arguments);
    var self = this;
    this.callbacks[name].forEach(function(cb) { cb.apply(self, args); });
  };

  this['on' + capName] = function(cb) {
    this.callbacks[name].push(cb);
    return this;
  };

  this['off' + capName] = function(cb) {
    var idx = this.callbacks[name].indexOf(cb);
    if(-1 !== idx) {
      this.callbacks[name].splice(idx, 1);
    }
    return this;
  };
}

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

function Renderer() {
  this.callbacks = {};

  callback.call(this, 'new');
  callback.call(this, 'update');

  property.call(this, '_into', 'into');
  property.call(this, 'cls', 'useClass');
  property.call(this, 'rowKey', 'key');
  property.call(this, 'makeRows', 'make');

  this.run = function (data) {
    function error(message) {
      throw message;
    }

    var row = this.cls || 'km-row';

    var rows = this.into().selectAll('.' + row);
    var rowData = rows.data(data, this.rowKey);
    rowData.exit().remove();

    if(this.makeRows) {
      var newRows = this.makeRows(rowData.enter());
    } else if(this.cls) {
      var newRows = rowData.enter().select(this.cls);
    } else {
      error('makeColumn did not return a selection');
    }
    newRows.classed(row, true);

    this.doNew(newRows);
    this.doUpdate(rowData);

    return {data: rowData, enter: newRows};
  };
};

/*
Rectangle intersection from dagre-d3 source.
*/
function intersectRect(rect, point) {
  var x = rect.x;
  var y = rect.y;

  // For now we only support rectangles

  // Rectangle intersection algorithm from:
  // http://math.stackexchange.com/questions/108113/find-edge-between-two-boxes
  var dx = point.x - x;
  var dy = point.y - y;
  var w = rect.width / 2;
  var h = rect.height / 2;

  var sx, sy;
  if (Math.abs(dy) * w > Math.abs(dx) * h) {
    // Intersection is top or bottom of rect.
    if (dy < 0) {
      h = -h;
    }
    sx = dy === 0 ? 0 : h * dx / dy;
    sy = h;
  } else {
    // Intersection is left or right of rect.
    if (dx < 0) {
      w = -w;
    }
    sx = w;
    sy = dx === 0 ? 0 : w * dy / dx;
  }

  return {x: x + sx, y: y + sy};
}

/*
Given a JSON object with the knowledge data, create a graph object which
will be rendered by dagre-d3.

json: TODO describe what the json should look like
*/
function createGraph(json) {
  this.hold();
  if (json && json.concepts) {
    // Add all the concepts as nodes
    var self = this;
    json.concepts.forEach(function(concept) {
      self.addConcept({
        concept: concept
      });
    });
  }
  this.unhold();

  return this;
};

function setupSVG(config) {
  // Create elements on the page for us to render our graph in
  var parentName = config.inside || 'body';
  var svg = d3.select(parentName).append('svg');
  var root = svg.append('g');

  // Define the #arrowhead shape for use with edge paths.
  svg.append('svg:defs')
    .append('svg:marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 8)
      .attr('refY', 5)
      .attr('markerUnits', 'strokeWidth')
      .attr('markerWidth', 8)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .attr('style', 'fill: #333')
      .append('svg:path')
        .attr('d', 'M 0 0 L 10 5 L 0 10 z');

  // Add a 'backstop' so we can catch pointer events on the entire SVG.
  root.append('rect')
      .attr('class', 'overlay')
      .attr('width', '100%')
      .attr('height', '100%')
      .style('fill', 'none')
      .style('pointer-events', 'all');

  // Make zoomable.
  var el = this.element = root.append('g');
  root.call(d3.behavior.zoom().scaleExtent([0.3, 1]).on("zoom", function () {
      el.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }));

  // Groups for node and edge SVG elements.
  this.edgeContainer = this.element.append('g').classed('edges', true);
  this.nodeContainer = this.element.append('g').classed('nodes', true);
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
  Creates node text labels.
  */
  this.defaultNewNodes = function(nodes) {
    nodes.append('text')
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle');
  };

  /*
  Sets node labels.
  */
  this.defaultUpdateNodes = function(nodes) {
    nodes.select('text')
      .text(function(d) { return d.label; });
  };

  /*
  Sets node group positions.
  */
  this.defaultUpdateNodePositions = function(nodes) {
    nodes.attr('transform', function(n) {
        var x = n.layout.x;
        var y = n.layout.y;
        return 'translate('+ x + ',' + y + ')';
      });
  };

  /*
  Creates edge paths.
  */
  this.defaultNewEdges = function(edges) {
    edges.append('path')
      .attr('marker-end', 'url(#arrowhead)');
  };

  /*
  Positions edge paths.
  */
  this.defaultUpdateEdgePositions = function(edges) {
    edges.select('path')
      .attr('d', function(e) {
        var path = e.layout.points.slice();
        var p0 = path.length === 0 ? e.source.layout : path[0];
        var p1 = path.length === 0 ? e.target.layout : path[path.length - 1];
        path.unshift(intersectRect(e.source.layout, p0));
        path.push(intersectRect(e.target.layout, p1));

        return d3.svg.line()
          .x(function(d) { return d.x; })
          .y(function(d) { return d.y; })
          .interpolate('basis')
          (path);
      });
  };

  // Create the SVG elements on the page necessary for this graph.
  setupSVG.call(this, config);

  // Create the three Renderers that link data to the DOM via the default
  // methods defined above. Extending the renderer is a matter of adding more
  // callbacks onNew and onUpdate. You can also remove the default behavior by
  // calling offNew or offUpdate with the default functions.

  this.renderNodes = new Renderer()
    .into(this.nodeContainer)
    .key(function(n) { return n.concept.id; })
    .make(function(e) { return e.append('g'); })
    .useClass('node')
    .onNew(this.defaultNewNodes)
    .onUpdate(this.defaultUpdateNodes);

  this.positionNodes = new Renderer()
    .into(this.nodeContainer)
    .key(function(n) { return n.concept.id; })
    .useClass('node')
    .onUpdate(this.defaultUpdateNodePositions);

  this.renderEdges = new Renderer()
    .into(this.edgeContainer)
    .key(function(d) { return d.id; })
    .make(function(e) { return e.append('g'); })
    .useClass('edgePath')
    .onNew(this.defaultNewEdges);

  this.positionEdges = new Renderer()
    .into(this.edgeContainer)
    .key(function(d) { return d.id; })
    .make(function(e) { return e.append('g'); })
    .useClass('edgePath')
    .onUpdate(this.defaultUpdateEdgePositions);

  /*
  Lays out the graph and renders it into the DOM.
  */
  this.render = function() {
    var self = this;

    // Instead of a list of IDs, our data should be a list of objects.
    this.nodes = this.graph.nodes().map(function(id) {
      return self.graph.node(id);
    });
    var result = this.renderNodes.run(this.nodes);

    // Add width and height information from the SVG elements.
    result.data.each(function(d) {
      d.width = this.getBBox().width;
      d.height = this.getBBox().height;
    });

    // Generate a graph layout and render it.
    var layout = dagre.layout().run(this.graph);
    this.postEvent({
      type: 'preLayout',
      layout: layout,
    });
    this.provideLayout(layout);
  };

  /*
  Give the graph a layout and render it.
  */
  this.provideLayout = function(layout) {
    var self = this;
    var g = this.graph;

    // Augment existing node data with layout information.
    this.nodes.forEach(function(node) {
      node.layout = layout.node(node.concept.id);
    });
    this.positionNodes.run(this.nodes);

    var edges = layout.edges().map(function(id) {
      return {
        id: id,
        source: g.node(g.incidentNodes(id)[0]),
        target: g.node(g.incidentNodes(id)[1]),
        value: g.edge(id),
        layout: layout.edge(id)
      };
    });
    this.renderEdges.run(edges);
    this.positionEdges.run(edges);

    this.layout = layout;
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

  // Initialise plugins.
  if(config && config.plugins) {
    for(var i = 0; i < config.plugins.length; i++) {
      var plugin = config.plugins[i];
      if('string' === typeof(plugin)) {
        plugin = api.plugins[plugin];
        if(undefined === plugin) {
          console.error('Plugin \'' + config.plugins[i] + '\' not found!');
        }
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

  plugins: {
    'hamburger-nodes': require('./hamburger-nodes-plugin.js')
  },

  registerPlugin: function(plugin) {
    if(plugin && plugin.name && plugin.run) {
      this.plugins[plugin.name] = plugin;
    }
  }
};

global.knowledgeMap = api; 
module.exports = api;
