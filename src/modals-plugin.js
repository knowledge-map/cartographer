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

	    // Format a header and content into an <article> element.
      var article = function(cls, header, content) {
        return '<article class="' + cls + '">' +
                  (header
                    ? '<header>' + header + '</header>'
                    : '') +
                  '<p>' + content + '</p>' +
               '</article>';
      };

      var getHost = function(url) {
        var a = document.createElement('a');
        a.href = url;
        return a.hostname;
      }

      var html = '<h1>' + concept.name + '</h1>';
      if(!contents.length) {
        // Naww :(
        html += '<p>This node has no content!</p>';
      } else {
        // Render each content item.
        contents.forEach(function(content) {
          if(content.link) {
            var hostname = getHost(content.link);
            var title = '<a href="' + content.link + '">' + content.title + '</a>' +
                        '<span>(' + hostname + ')</span>';
            html += article('link', title, content.description);
          } else if(content.text) {
            var title = content.title ? '<h2>' + content.title + '</h2>' : null;
            html += article('text', title, content.text);
          }
        });
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
