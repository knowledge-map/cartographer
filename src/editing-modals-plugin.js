var d3 = require('d3');
var modal = require('../node_modules/PicoModal/src/picoModal.js');

function addNodeModalEvents(kg, graph, nodes) {
  nodes.select('text')
    .on('click', function render(conceptId) {
      var concept = graph.node(conceptId).concept;
      var contents = concept.content;
      if(!contents || !contents.forEach) {
        concept.content = contents = [];
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

      var editModal = modal({
        content: '',
        width: 700,
        closeButton: true,
        modalStyles: {
          'overflow-y': 'scroll',
          'max-height': '500px',
          'background-color': 'white',
          'padding': '20px'
        }
      });

      var modalElem = d3.select(editModal.modalElem);

      modalElem.append('input')
        .attr('type', 'text')
        .attr('id', 'title')
        .property('value', title);

      var contentArea = modalElem.append('div').attr('class', 'content-area');

      var article = function(type, content) {
        var articleElem = contentArea.append('article')
          .attr('class', type);
        if(type == 'textContent') {
          articleElem.append('input')
            .attr('class', 'title')
            .attr('type', 'text')
            .property('value', content.title);
        } else if(type == 'linkContent') {
          articleElem.append('input')
            .attr('type', 'url')
            .property('value', content.link);
          articleElem.append('input')
            .attr('type', 'text')
            .property('value', content.title);
        }
        var textarea = articleElem.append('p').append('textarea');
        if(type == 'textContent') {
          textarea.property('value', content.text);
        } else if(type == 'linkContent') {
          textarea.property('value', content.description);
        }
      };

      if(!texts.length && !links.length) {
        // Oops.
        contentArea.append('p').text('This node has no content!');
      } else {
        // Fuse content into HTML template.
        if(texts.length) {
          texts.forEach(function(content) {
            if(!content.title) {
              content.title = '';
            }
            article('textContent', content);
          });
        }
        if(links.length) {
          links.forEach(function(content) {
            article('linkContent', content);
          });
        }
      }

      modalElem.append('button')
        .attr('id', 'addContentBtn')
        .text('Add Content');

      modalElem.append('button')
        .attr('id', 'saveBtn')
        .text('Save');

      var saveContent = function() {
        // Update the value of whatever was changed in the modal into the graph.
        var newTitle = d3.select('#title').property('value');
        concept.name = newTitle;
        graph.node(conceptId).label = newTitle;

        var texts = d3.selectAll('.textContent')[0];
        concept.content = [];
        texts.forEach(function(textContent) {
          var childNodes = textContent.childNodes;
          var contentTitle = d3.select(childNodes[0]).property('value');
          var childTextNode = childNodes[1].childNodes;
          var contentText = d3.select(childTextNode[0]).property('value');
          concept.content.push({
            title: contentTitle,
            text: contentText
          });
        });

        var links = d3.selectAll('.linkContent')[0];
        links.forEach(function(linkContent) {
          var childNodes = linkContent.childNodes;
          var contentUrl = d3.select(childNodes[0]).property('value');
          var contentTitle = d3.select(childNodes[1]).property('value');
          var childTextNode = childNodes[2].childNodes;
          var contentDesc = d3.select(childTextNode[0]).property('value');
          concept.content.push({
            title: contentTitle,
            link: contentUrl,
            description: contentDesc
          });
        });
      };

      d3.select('#addContentBtn').on('click', function() {
        saveContent();
        article('textContent',
          {
            title: 'New Content Title',
            text: 'New Content Text'
          });
      });

      d3.select('#saveBtn').on('click', function() {
        saveContent();
        kg.render();
        editModal.close();
      });
    });
}

function setupModals(kg) {
  kg.onEvent('renderGraph', function(e) {
    addNodeModalEvents(kg, e.graph, e.nodes);
  });
};

module.exports = {
  name: 'editing-modals',
  run: setupModals,
};
