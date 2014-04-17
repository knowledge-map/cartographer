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

      var html = '<input type="text" id="title" value="' + title + '" />';
      if(!texts.length && !links.length) {
        // Oops.
        html += '<p>This node has no content!</p>';
      } else {
        // Fuse content into HTML template.
        if(texts.length) {
          html += texts.map(function(content) {
            if(!content.title) {
              content.title = "";
            }
            return article('textContent', '<input type="text" value="' + content.title + '" />', '<textarea>' + content.text + '</textarea>');
          }).join('');
        }
        if(links.length) {
          html += links.map(function(content) {
            return article('linkContent', '<input type="url" value="' + content.link + '" /><input type="text" value="' + content.title + '" />', '<textarea>' + content.description + '</textarea>');
          }).join('');
        }

        function article(type, header, content) {
          return '<fieldset class="' + type + '">' + header + '<p>' + content + '</p></fieldset>';
        };
      }
      html += '<button id="addContentBtn">Add Content</button>';
      html += '<input type="submit" id="saveBtn" value="Save" />';

      var editModal = modal({
        content: html,
        closeButton: true
      });

      d3.select('#addContentBtn').on('click', function() {
        concept.content.push({
          title: 'New Content',
          text: 'New content text.',
        });
        editModal.close();
        render(conceptId);
      });

      d3.select('#saveBtn').on('click', function() {
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
