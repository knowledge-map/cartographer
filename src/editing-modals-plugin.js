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
      // The IDs of the to-be-deleted content items before we actually delete them in saveContent()
      var deleted = [];

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

      modalElem.append('input')
        .attr('type', 'text')
        .attr('id', 'title')
        .property('value', title);

      var contentArea = modalElem.append('div').attr('class', 'content-area');

      // A function to create a new content item from a given JS object
      var article = function(type, content, index) {
        var articleElem = contentArea.append('article')
          .attr('class', type)
          .attr('id', index)
          .style({
            'border-color': '#cccccc',
            'border-style': 'dashed',
            'border-width': 'thin',
            'padding-left': '13px',
            'padding-right': '7px',
            'margin-top': '10px',
            'margin-bottom': '10px',
          });
        articleElem.append('div')
          .text('×')
          .attr('class', 'content-delete')
          .style({
            'cursor': 'pointer',
            'position': 'relative',
            'height': '20px',
            'width': '20px',
            'left': '98%',
            'font-size': '25px',
            'color': 'salmon',
          })
          .on('click', function() {
            // If the content's x is clicked, temporarily hide the HTML and don't delete until saveContent()
            var contentId = parseInt(this.parentNode.id);
            // If we're removing a newly added element that hasn't been saved, just delete the node
            // without worrying about the contents
            if(!contentId && contentId != 0) {
              this.parentNode.remove();
            } else {
              deleted.push(contentId);
              this.parentNode.hidden = true;
            }
            if(countVisibleContent() == 0) {
              d3.select('#no-content-msg').style('display', 'block');
            }
          });
        if(type == 'textContent') {
          articleElem.append('input')
            .attr('class', 'title')
            .attr('type', 'text')
            .property('value', content.title);
        } else if(type == 'linkContent') {
          articleElem.append('input')
            .attr('class', 'title')
            .attr('type', 'text')
            .property('value', content.title);
          articleElem.append('input')
            .attr('type', 'url')
            .property('value', content.link);
        }
        var textarea = articleElem.append('p').append('textarea');
        if(type == 'textContent') {
          textarea.property('value', content.text);
        } else if(type == 'linkContent') {
          textarea.property('value', content.description);
        }
      };

      var countVisibleContent = function() {
        var count = 0;
        for(var i=0; i<contentArea[0][0].children.length; i++) {
          if(!contentArea[0][0].children[i].hidden) {
            count++;
          }
        }
        return count;
      }

      modalElem.append('p')
        .text("This concept has no content! Click 'Add Content' to add one.")
        .attr('id', 'no-content-msg');

      contents.forEach(function(content, index) {
        if(content.link) {
          article('linkContent', content, index);
        } else if(content.text) {
          if(!content.title) {
            content.title = '';
          }
          article('textContent', content, index);
        }
      });

      if(countVisibleContent() != 0) {
        d3.select('#no-content-msg').style('display', 'none');
      }

      modalElem.append('button')
        .attr('id', 'addContentBtn')
        .text('Add Content');

      modalElem.append('button')
        .attr('id', 'saveBtn')
        .text('Save');

      modalElem.append('button')
        .attr('id', 'deleteConceptBtn')
        .text('Delete Concept');

      var saveContent = function() {
        // Update the value of whatever was changed in the modal into the graph.
        var newTitle = d3.select('#title').property('value');
        concept.name = newTitle;
        graph.node(conceptId).label = newTitle;

        d3.selectAll('article')[0].forEach(function(articleNode, index) {
          if(deleted.indexOf(index) < 0) { // if this current index is not marked for deletion
            if(articleNode.className == 'textContent') {
              var childNodes = articleNode.childNodes;
              var contentTitle = d3.select(childNodes[1]).property('value');
              var childTextNode = childNodes[2].childNodes;
              var contentText = d3.select(childTextNode[0]).property('value');
              kg.updateContent(conceptId,
                index,
                {
                  title: contentTitle,
                  text: contentText
                });
            } else if(articleNode.className == 'linkContent') {
              var childNodes = articleNode.childNodes;
              var contentUrl = d3.select(childNodes[1]).property('value');
              var contentTitle = d3.select(childNodes[2]).property('value');
              var childTextNode = childNodes[3].childNodes;
              var contentDesc = d3.select(childTextNode[0]).property('value');
              kg.updateContent(conceptId,
                index,
                {
                  title: contentTitle,
                  link: contentUrl,
                  description: contentDesc
                });
            }
          } else { // it is marked for deletion, so remove it from the graph
            kg.removeContent(conceptId, index);
          }
        });
      };

      d3.select('#addContentBtn').on('click', function() {
        d3.select('#no-content-msg').style('display', 'none');
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
      
      d3.select('#deleteConceptBtn').on('click', function() {
        kg.removeConcept(conceptId);
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
