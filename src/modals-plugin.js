var d3 = require('d3');
var modal = require('../node_modules/PicoModal/src/picoModal.js');

function addNodeModalEvents(graph, nodes) {
  nodes.select('text')
    .on('click', function(conceptId) {
      var concept = graph.node(conceptId).concept;
      var contents = concept.content;
      if(!contents || !contents.forEach) {
        return;
      }
      var title = concept.name;
      var texts = [];
      var links = [];

      // Collect different content types.
      contents.forEach(function(content) {
        if(content.link) {
          links.push(content);
        } else if(content.text) {
          content.toString = function() { return this.text; };
          texts.push(content);
        }
      });

      var html = '<h1>' + title + '</h1>';
      if(!texts.length && !links.length) {
        // Oops.
        html += '<p>This node has no content!</p>';
      } else {
	    // Function to generate an article with a header and content
        function article(header, content) {
          return '<article><header>' + header + '</header><p>' + content + '</p></article>';
        };

        // Fuse content into HTML template.
        if(texts.length) {
          html += texts.map(function(content) {
            if(!content.title) {
              content.title = "";
            }
              return article('<h2>' + content.title + '</h2>', content.text);
          }).join('');
        }
        if(links.length) {
          html += links.map(function(content) {
            return article('<a href="' + content.link + '"><h2>' + content.title + '</h2></a>', content.description);
          }).join('');
        }
      }

      modal({
        content: html,
        closeButton: true,
        width: 700,
      });
    });
}

function setupModals(kg) {
  kg.onEvent('renderGraph', function(e) {
    addNodeModalEvents.call(kg, e.graph, e.nodes);
  });
};

module.exports = {
  name: 'modals',
  run: setupModals,
};
