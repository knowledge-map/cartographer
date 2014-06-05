var d3 = require('d3');
var modal = require('../node_modules/PicoModal/src/picoModal.js');

function addNodeModalEvents(graph, nodes) {
  nodes
    .on('click', function(conceptId) {
      var concept = graph.node(conceptId).concept;
      var contents = concept.content;
      if(!contents || !contents.forEach) {
        return;
      }

      var getHost = function(url) {
        var a = document.createElement('a');
        a.href = url;
        return a.hostname;
      }

      var editModal = modal({
        content: '',
        width: 700,
        closeButton: true,
      });

      var modalElem = d3.select(editModal.modalElem)
        .style('overflow-y', 'scroll')
        .style('max-height', '500px')
        .style('background-color', 'white')
        .style('padding', '20px');

      modalElem.append('h1').text(concept.name);

      if(!contents.length) {
        // Naww :(
        modalElem.append('p').text('This node has no content!');
      } else {
        // Render each content item.
        contents.forEach(function(content) {
          if(content.link) {
            var hostname = getHost(content.link);
            var article = modalElem.append('article').attr('class', 'link');
            var header = article.append('header');
            header.append('a').attr('href', content.link).text(content.title);
            header.append('span').text(hostname);
            article.append('p').html(content.description);
          } else if(content.text) {
            var article = modalElem.append('article').attr('class', 'text');
            if(content.title) {
              article.append('h2').text(content.title);
            }
            article.append('p').html(content.text);
          }
        });
      }
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
