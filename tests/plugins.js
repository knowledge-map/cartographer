describe('Knowledge graph plugin API', function() {
  var noGraph = {concepts: [], dependencies: []};

  it('is accessible in the plugins property', function() {
    var graph = knowledgeGraph.create({graph: noGraph, plugins: []});
    expect(graph.plugins).toBeDefined();
    expect(graph.plugins.length).toBe(0);
  });

  it('is read-only', function() {
    var graph = knowledgeGraph.create({graph: noGraph, plugins: []});
    var old = graph.plugins;
    graph.plugins = {};
    expect(graph.plugins).toBe(old);
    graph.plugins = [];
    expect(graph.plugins).toBe(old);
  });

  it('calls plugins\' run method', function() {
    var runMethod = jasmine.createSpy();
    var graph = knowledgeGraph.create({graph: noGraph, plugins: [
      {
        name: 'plugin',
        run: runMethod
      }
    ]});

    expect(runMethod).toHaveBeenCalledWith(graph);
  });
});
