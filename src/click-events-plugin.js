function setupClickEvents(kg) {
  kg.onEvent('renderGraph', function(e) {
    e.nodes.select('text')
      .on('click', function (conceptId) {
        kg.postEvent({
          type: 'clickConcept',
          concept: kg.graph.node(conceptId).concept
        });
      });
  });
};

module.exports = {
  name: 'click-events',
  run: setupClickEvents
};
