describe('Knowledge graph plugin API', function() {
  it('is accessible in the plugins property', function() {
    var graph = knowledgeGraph.create({plugins: []});
    expect(graph.plugins).toBeDefined();
    expect(graph.plugins.length).toBe(0);
  });

  it('is read-only', function() {
    var graph = knowledgeGraph.create({plugins: []});
    var old = graph.plugins;
    graph.plugins = {};
    expect(graph.plugins).toBe(old);
    graph.plugins = [];
    expect(graph.plugins).toBe(old);
  });

  it('calls plugins\' run method', function() {
    var runSpy = jasmine.createSpy();
    var graph = knowledgeGraph.create({plugins: [
      {
        name: 'plugin',
        run: runSpy
      }
    ]});

    expect(runSpy).toHaveBeenCalledWith(graph);
  });
});
