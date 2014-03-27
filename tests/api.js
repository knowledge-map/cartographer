describe('Knowledge graph API', function() {
  it('should exist and have a create function', function() {
    expect(knowledgeGraph).toBeDefined();
    expect(knowledgeGraph.create).toBeDefined();
  });
});

describe('Creating a knowledge graph', function() {
  it('should create a knowledge graph object', function() {
    var kg = knowledgeGraph.create();
    expect(kg).toBeDefined();
  });
});
