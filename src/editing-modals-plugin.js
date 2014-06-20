var d3 = require('d3');
var modal = require('../node_modules/PicoModal/src/picoModal.js');
var markdown = require('markdown').markdown;

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
        .property('value', title)
        .style('margin-bottom', '10px');

      var contentArea = modalElem.append('div').attr('class', 'content-area');

      // A function to create a new content item from a given JS object
      var article = function(type, content, index) {
        var tabGroup = contentArea.append('div')
          .attr('contentid', index);
        tabGroup.append('button')
          .text('Edit')
          .on('click', function() {
            d3.select('#preview'+index).style('display', 'none');
            d3.select('#edit'+index).style('display', 'block');
          });
        tabGroup.append('button')
          .text('Preview')
          .on('click', function() {
            d3.select('#edit'+index).style('display', 'none');
            updatePreview(index);
            d3.select('#preview'+index).style('display', 'block');
          });
        var articleElem = contentArea.append('article')
          .attr('class', type)
          .attr('contentid', index)
          .attr('id', 'edit'+index);
        var previewElem = contentArea.append('article')
          .attr('class', type)
          .attr('contentid', index)
          .attr('id', 'preview'+index)
          .style('display', 'none');
        d3.selectAll('.'+type).style({
          'border-color': '#cccccc',
          'border-style': 'dashed',
          'border-width': 'thin',
          'padding-left': '13px',
          'padding-right': '7px',
          'margin-top': '-3px',
          'margin-bottom': '13px',
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
            var contentId = parseInt(this.parentNode.contentid);
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
        articleElem.append('input')
          .attr('class', 'title')
          .attr('type', 'text')
          .property('value', content.title);
        if(type == 'linkContent') {
          articleElem.append('input')
            .attr('class', 'link')
            .attr('type', 'url')
            .property('value', content.link);
        }
        var textarea = articleElem.append('p').append('textarea').attr('class', 'text');
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

      var updatePreview = function(contentId) {
        var previewElem = d3.select('#preview'+contentId);
        while(previewElem.node().firstChild) {
          previewElem.node().removeChild(previewElem.node().firstChild);
        }
        var title = d3.select('#edit'+contentId+' .title').property('value');
        previewElem.append('h2')
          .attr('type', 'text')
          .text(title);
        var text = d3.select('#edit'+contentId+' .text').property('value');
        if(previewElem.attr('class') == 'textContent') {
          previewElem.append('p')
            .html(markdown.toHTML(text));
        } else if(previewElem.attr('class') == 'linkContent') {
          var link = d3.select('#edit'+contentId+' .link').property('value');
          previewElem.append('a')
            .attr('href', link)
            .attr('type', 'url')
            .text(title);
          previewElem.append('p')
            .html(markdown.toHTML(text));
        }
      }

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
