describe('Knowledge map plugin API', function() {
  var noGraph = {concepts: [], dependencies: []};

  it('is accessible in the plugins property', function() {
    var graph = knowledgeMap.create({graph: noGraph, plugins: []});
    expect(graph.plugins).toBeDefined();
    expect(graph.plugins.length).toBe(0);
  });

  it('is read-only', function() {
    var graph = knowledgeMap.create({graph: noGraph, plugins: []});
    var old = graph.plugins;
    graph.plugins = {};
    expect(graph.plugins).toBe(old);
    graph.plugins = [];
    expect(graph.plugins).toBe(old);
  });

  it('calls plugins\' run method', function() {
    var runMethod = jasmine.createSpy();
    var graph = knowledgeMap.create({graph: noGraph, plugins: [
      {
        name: 'plugin',
        run: runMethod
      }
    ]});

    expect(runMethod).toHaveBeenCalledWith(graph);
  });

  it('finds plugins defined by name', function() {
    var plugin = {
      name: 'barry',
      run: jasmine.createSpy()
    };
    knowledgeMap.registerPlugin(plugin);
    var graph = knowledgeMap.create({
      graph: noGraph,
      plugins: [plugin.name]
    });

    expect(plugin.run).toHaveBeenCalled();
  });
});
