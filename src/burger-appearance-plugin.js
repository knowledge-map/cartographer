var d3 = require('d3');

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

function setupBurgers(kg) {
  kg.renderer.positionEdgePaths(positionEdgePaths);
  kg.onEvent('renderGraph', function(e) {
    drawHamburgers.call(kg, e.graph, e.nodes);
  });
};

module.exports = {
  name: 'default-appearance',
  run: setupBurgers,
};
