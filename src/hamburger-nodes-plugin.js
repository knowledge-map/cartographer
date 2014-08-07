var d3 = require('d3');

var setupHamburgerNodes = function(km) {
  km.renderNodes.onNew(function(nodes) {
    // Create a semi-circle path function
    var semicircle = d3.svg.arc()
      .outerRadius(20)
      .startAngle(3*Math.PI/2)
      .endAngle(5*Math.PI/2);

    // Add enter/above
    nodes.filter('.resource').insert('path', 'rect')
      .attr('d', semicircle)
      .classed('enter', true);

    // Flip the semi-circle
    semicircle
      .startAngle(Math.PI/2)
      .endAngle(3*Math.PI/2);

    // Add exit/below
    nodes.filter('.resource').insert('path', 'rect')
      .attr('d', semicircle)
      .classed('exit', true);
  });

  function getTextHeight() {
    return d3.select(this.parentNode).select('text').node().getBBox().height;
  }

  km.positionNodes.onUpdate(function(nodes) {
    nodes.select('path.enter')
      .attr('transform', function(n) {
          var textHeight = getTextHeight.call(this);
          return 'translate(0,' + (-textHeight/2-2) + ')';
        });
    nodes.select('path.exit')
      .attr('transform', function(n) {
          var textHeight = getTextHeight.call(this);
          return 'translate(0,' + (textHeight/2+2) + ')';
        });
  });

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
    var w = rect.width / 2 + 5;
    var h = rect.height / 2 + 5;

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

  km.positionEdges.offUpdate(km.defaultUpdateEdgePositions);
  km.positionEdges.onUpdate(function(edges) {
    edges.select('path')
      .attr('d', function(e) {
        var path = e.layout.points.slice();
        var source = e.source.layout;
        var target = e.target.layout;

        var p0 = path.length === 0 ? target : path[0];
        var p1 = path.length === 0 ? source : path[path.length - 1];

        var f0 = e.source.type === 'concept' ? intersectRect : nodePosition;
        var f1 = e.target.type === 'concept' ? intersectRect : nodePosition;
        path.unshift(f0(source, p0));
        path.push(f1(target, p1));

        return d3.svg.line()
          .x(function(d) { return d.x; })
          .y(function(d) { return d.y; })
          .interpolate('basis')
          (path);
      });
  });
}

module.exports = {
  name: 'hamburger-nodes',
  run: setupHamburgerNodes
};
