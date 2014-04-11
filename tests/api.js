describe('Knowledge graph API', function() {
  it('should exist', function() {
    expect(knowledgeGraph).toBeDefined();
  });

  it('should have a create function', function() {
    expect(knowledgeGraph.create).toBeDefined();
  });

  it('should have a plugin API', function() {
    expect(knowledgeGraph.plugins).toBeDefined();
    expect(knowledgeGraph.registerPlugin).toBeDefined();
  });
});

describe('Creating a knowledge graph', function() {
  it('should create a knowledge graph object', function() {
    var kg = knowledgeGraph.create();
    expect(kg).toBeDefined();
  });
});
