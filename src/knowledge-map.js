"use strict";

var d3 = require('d3');
var dagre = require('dagre');
var graphlib = require('graphlib');

/**
 Call this on an object to define a 'callback' handler with lots of boilerplate
 functionality taken care of. There will be three new methods on this object,
 where Name is the name you give the callback:

   doName - calls all the callback handlers assigned to this callback, passing
            them the arguments passed to it.
   onName - registers a handler for this callback.
   offName - removes a callback handler for this callback.

 For example:

  var myObject = {callbacks: []};
  callback.call(myObject, 'update');
  var updateHandler = function(arg) {
    console.log('Object updated and says: ' + arg);
  };
  myObject.onUpdate(updateHandler);
  myObject.doUpdate('hello!');
  myObject.offUpdate(updateHandler);
  myObject.doUpdate('you won't see this!');

 */
function callback(name) {
  if(!this.callbacks) {
    this.callbacks = {};
  }
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

    var newRows;
    if(this.makeRows) {
      newRows = this.makeRows(rowData.enter());
    } else if(this.cls) {
      newRows = rowData.enter().select(this.cls);
    } else {
      error('makeColumn did not return a selection');
    }
    newRows.classed(row, true);

    this.doNew(newRows);
    this.doUpdate(rowData);

    return {data: rowData, enter: newRows};
  };
}

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
 * Create a graph from a config. At the moment, only a list of resources is used
 * to build the graph.
 */
function createGraph(config) {
  this.hold();
  if (config && config.resources) {
    var self = this;
    config.resources.forEach(function(r) {
      self.addResource(r);
    });
  }
  this.unhold();
  return this;
}

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
  var self = this;

  callback.call(this, 'zoom');
  callback.call(this, 'zoomSetup');
  this.zoom = d3.behavior.zoom();
  root.call(this.zoom.on("zoom", function () {
    self.doZoom(this.zoom);
  }));

  this.defaultZoomSetup = function(zoom) {
    zoom.scaleExtent([0.3, 1]);
  };
  this.onZoomSetup(this.defaultZoomSetup);
  this.defaultOnZoom = function() {
    el.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  };
  this.onZoom(this.defaultOnZoom);

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
  Hold API
  */
  var held    = !!config.held;
  this.hold   = function() { held = true; return this; }
  this.unhold = function() { held = false; return this; }
  this.held   = function() { return held; }

  /*
   * Resource API
   */
  this.addResource = function(resource) {
    // Just for uniformity of API, allow a single string to create a named
    // resource. This will never be useful.
    if('string' === typeof(resource)) {
      resource = {
        id: resource.toLowerCase().replace(/ /g, '-'),
        label: resource,
        type: 'resource',
        content: {},
        teaches: [],
        requires: [],
        needs: []
      };
    } else {
      resource = {
        id: resource.id || resource.label.toLowerCase().replace(/ /g, '-'),
        label: resource.label,
        type: 'resource',
        content: resource.content || {},
        teaches: resource.teaches || [],
        requires: resource.requires || [],
        needs: resource.needs || []
      };
    }

    // Add the resource to the graph as a node.
    this.graph.addNode(resource.id, resource);

    // Deal with all the dependencies. Add new concepts and assets where
    // necessary, and add edges in the appropriate direction.
    var self = this;
    var id = resource.id;

    // X-teaches-Y is an arrow from resource X to concept Y.
    if(resource.teaches) {
      resource.teaches.forEach(function(c) {
        var cid = self.defineConcept(c);
        self.graph.addEdge(id+'-teaches-'+cid, id, cid);
      });
    }

    // Y-requires-X is an arrow from concept Y to resource X.
    if(resource.requires) {
      resource.requires.forEach(function(c) {
        var cid = self.defineConcept(c);
        self.graph.addEdge(id+'-requires-'+cid, cid, id);
      });
    }

    if(resource.needs) {
      resource.needs.forEach(function(a) {
        //var aid = self.defineAsset(a);
      });
    }

    this.render();
    return id;
  };

  this.removeResource = function(resourceId) {
    if('string' !== typeof(resourceId)) {
      resourceId = resourceId.id;
    }

    if(this.graph.hasNode(resourceId)) {
      // Remove resource node and all edges.
      var resource = this.graph.node(resourceId);
      this.graph.delNode(resourceId);

      // Remove concept nodes with no more incident edges.
      var self = this;
      var removeConcept = function(id) {
        id = self.defineConcept(id);
        if(self.graph.hasNode(id)) {
          if(!self.graph.incidentEdges(id).length) {
            self.graph.delNode(id);
          }
        }
      };

      if(resource.teaches) { resource.teaches.forEach(removeConcept); }
      if(resource.requires) { resource.requires.forEach(removeConcept); }
    }

    this.render();
  };

  /**
   Define a concept object that will be included in the graph. If a string is
   passed, a new concept object will be created. The string is treated as the
   label of the concept, and converted into a correct ID. If an object is passed,
   the object will replace the contents of any existing concept with the same ID.
  */
  this.defineConcept = function(concept) {
    var replace = true;
    if('string' === typeof(concept)) {
      replace = false;
      concept = {
        id: concept.toLowerCase().replace(/ /g, '-'),
        label: concept,
        type: 'concept',
        content: {}
      };
    } else {
      concept = {
        id: concept.id || concept.label.toLowerCase().replace(/ /g, '-'),
        label: concept.label,
        type: 'concept',
        content: concept.content || {}
      };
    }

    if(!this.graph.hasNode(concept.id)) {
      this.graph.addNode(concept.id, concept);
      this.render();
    } else if(replace) {
      this.graph.node(concept.id, concept);
      this.render();
    }
    return concept.id;
  };

  /*
  Creates node text labels.
  */
  this.defaultNewNodes = function(nodes) {
    nodes
      .classed('concept', function(d) { return 'concept' === d.type })
      .classed('resource', function(d) { return 'resource' === d.type })
      .attr('id', function(n) { return n.id; })
      .append('text')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'middle');
  };

  /*
  Calculate the dimensions of each node after the elements have been rendered
  into the page.
  */
  this.calculateNodeSizes = function(nodes) {
    nodes.each(function(d) {
      d.width = this.getBBox().width;
      d.height = this.getBBox().height;
    });
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
    edges
      .attr('id', function(e) { return e.id; })
      .append('path')
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
    .key(function(n) { return n.id; })
    .make(function(e) { return e.append('g'); })
    .useClass('node')
    .onNew(this.defaultNewNodes)
    .onUpdate(this.defaultUpdateNodes)
    .onUpdate(this.calculateNodeSizes);

  this.positionNodes = new Renderer()
    .into(this.nodeContainer)
    .key(function(n) { return n.id; })
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
  callback.call(this, 'preLayout');
  callback.call(this, 'postLayout');
  this.render = function() {
    if(this.held()) {
      return;
    }
    var self = this;

    // Give plugins a chance to play with the config and preprocess the graph.
    var config = dagre.layout();
    var graph = this.graph.copy();
    this.doPreLayout(config, graph);

    // Instead of a list of IDs, our data should be a list of objects.
    var nodes = graph.nodes().map(function(id) {
      return graph.node(id);
    });

    // Perform graph layout.
    var result = this.renderNodes.run(nodes);
    var layout = config.run(graph);
    this.doPostLayout(layout);

    // Augment existing node data with layout information.
    nodes.forEach(function(node) {
      node.layout = layout.node(node.id);
    });
    this.positionNodes.run(nodes);

    var g = graph;
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

  // Create the directed graph
  this.graph = new dagre.Digraph();
  createGraph.call(this, config);

  // Initialise plugins.
  if(config.plugins) {
    for(var i = 0; i < config.plugins.length; i++) {
      var plugin = config.plugins[i];
      if('string' === typeof(plugin)) {
        // If we're just given a name, check the registry for an existing plugin.
        plugin = api.plugins[plugin];
        if(undefined === plugin) {
          console.error('Plugin \'' + config.plugins[i] + '\' not found!');
        }
      }
      if(typeof plugin === 'function') {
        // If we're provided with a raw function, just run it.
        plugin(this);
      }
      else if(plugin && plugin.run) {
        // If we have an object with a run member, treat it as a new plugin to
        // be defined. Add it to the registry if necessary, and run it.
        if(plugin.name) {
          api.plugins[plugin.name] = plugin;
        }
        plugin.run(this);
      }
    }

    this.__defineGetter__('plugins', function() {
      return config.plugins;
    });
    this.__defineSetter__('plugins', function() {});
  }

  // Callbacks for plugins to respond to.
  this.doZoomSetup(this.zoom);

  // Display the graph
  this.render();

  return this;
};

/*
Public API for the knowledge-map library
*/
var api = {
  d3: d3,
  dagre: dagre,
  graphlib: graphlib,

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
