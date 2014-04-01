var d3 = require('d3');

function addNodeLinks(graph, nodes) {
  // Add links for each node
  nodes.each(function(conceptId) {
    // Get the concept object
    var concept = graph.node(conceptId).concept;

    var content = concept.content;

    if (content && content.link) {
      // Create an anchor tag to insert the node labels into
      var anchor = document.createElementNS('http://www.w3.org/2000/svg', 'a');
      this.parentNode.appendChild(anchor);

      // Set the link target
      anchor.setAttributeNS('http://www.w3.org/1999/xlink',
                            'href', content.link);

      // Insert the labels into the anchor tag
      anchor.appendChild(this);
    }
  });

  return nodes;
}

function setupLinks(kg) {
  kg.onEvent('renderGraph', function(e) {
    addNodeLinks.call(kg, e.graph, e.nodes);
  });
};

module.exports = {
  name: 'links',
  run: setupLinks,
};
