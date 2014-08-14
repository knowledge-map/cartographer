function setupClickEvents(km) {
  km.renderNodes.onUpdate(function(nodes) {
    nodes.select('text')
      .on('click', function (conceptId) {
      });
  });
};

module.exports = {
  name: 'click-events',
  run: setupClickEvents
};
