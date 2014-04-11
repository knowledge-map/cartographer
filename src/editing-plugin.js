var d3 = require('d3');

/*
Takes node elements and adds functionality for
replacing label with input element when clicked

Used in addition to the default node rendering function

*/
function addChangeableLabels(graph, nodes) {
  var kg = this;

  nodes.select('text')
    .on('click', function(conceptId) {
      var concept = kg.graph.node(conceptId);

      var text = this;
      var textgroup = d3.select(this.parentNode);

      // Create the input element
      var obj = textgroup
        .append('foreignObject')
          .attr('width', text.getBBox().width)
          .attr('height', text.getBBox().height);

      var input = obj
        .append('xhtml:input')
          .attr('width', text.getBBox().width)
          .attr('height', text.getBBox().height)
          .attr('value', concept.label);

      // Focus element to allow user to immeadiately enter text
      input[0][0].focus();

      // Change back to text on focus removal
      input.on('blur', function(conceptId) {
        // Replace node label
        concept.label = this.value;
        concept.concept.name = this.value;

        // Add this back into the graph
        kg.graph.node(concept.concept.id, concept);
        kg.render();

        // Remove
        obj.remove();
      });

      // Blur if enter key is pressed
      input.on('keypress', function() {
        var ENTER_KEY = 13;
        if (d3.event.keyCode === ENTER_KEY) {
          input[0][0].blur();
        }
      });
    });
}

/*

Adds interactivity to hamburger buns. Clicking either bun creates a new node
and a dependency in the correct order. Dragging from a bun to another node
creates a dependency between the two.

*/
function addConnectionEditing(graph, nodes) {
  var kg = this;

  // Add dragging to join concepts
  var draggable = nodes.selectAll('path');

  var dragPath;
  var endConcept;
  var line = d3.svg.line()
    .interpolate('bundle');

  // Create dragging behaviour
  var drag = d3.behavior.drag()
    .on("dragstart", function(d) {
      // Stop zooming and ignore mouse-entering this concept
      d3.event.sourceEvent.stopPropagation();

      // Create a path to drag
      dragPath = d3.select(this.parentNode)
        .append('g')
        .classed('edgePath', true)
        .attr('pointer-events', 'none')
          .append('path');
    })
    .on("drag", function(d) {
      // Draw the Path
      dragPath.attr('d', line([[0,d3.select(this).attr('cy')], [d3.event.x, d3.event.y]]));
    })
    .on("dragend", function(d) {
      // Remove the line
      dragPath.remove();
      
      // Get the concept dragged from
      var startConcept = kg.graph.node(d).concept;

      // Add the dependency to the graph
      if (endConcept) {
        // Get which circle was dragged from
        var isEnter = d3.select(this).classed('enter');
        var isExit = d3.select(this).classed('exit');

        // Add a new concept if we didn't drag to another concept
        if (startConcept.id === endConcept.id) {
          endConcept = {
            id: "node-"+kg.graph.nodes().length,
            name: 'New Concept '+kg.graph.nodes().length,
          };

          kg.addConcept({concept: endConcept});
        }

        // Remove the dependency if we are draggin between two concepts
        // that already have a dependency between them
        var forward = {concept: startConcept.id, dependency: endConcept.id},
            backward = {concept: endConcept.id, dependency: startConcept.id};
        if (kg.hasDependency(forward)) {
          kg.removeDependency(forward);
        } else if (kg.hasDependency(backward)) {
          kg.removeDependency(backward);
        } else {
          // Add the dependency according to whether we started dragging
          // from the enter or exit circle
          if (isEnter) {
            kg.addDependency({concept: startConcept, dependency: endConcept.id});
          } else if (isExit){
            kg.addDependency({concept: endConcept, dependency: startConcept.id});
          }
        }
      }
    });

  draggable.call(drag);

  // Set the moused-over objects as the concept to join to
  nodes
    .attr('pointer-events', 'mouseover')
    .on('mouseover', function(d) {
      endConcept = kg.graph.node(d).concept;
    })
    .on('mouseout', function(d) {
      endConcept = null;
    });

  return nodes;
}

function setupEditing(kg) {
  kg.onEvent('renderGraph', function(e) {
    addConnectionEditing.call(kg, e.graph, e.nodes);
    addChangeableLabels.call(kg, e.graph, e.nodes);
  });
};

module.exports = {
  name: 'editing',
  run: setupEditing
};
