describe('Knowledge map API', function() {
  it('should exist', function() {
    expect(knowledgeMap).toBeDefined();
  });

  it('should have a create function', function() {
    expect(knowledgeMap.create).toBeDefined();
  });

  it('should have a plugin API', function() {
    expect(knowledgeMap.plugins).toBeDefined();
    expect(knowledgeMap.registerPlugin).toBeDefined();
  });
});

describe('Creating a knowledge map', function() {
  it('should create a knowledge map object', function() {
    var kg = knowledgeMap.create();
    expect(kg).toBeDefined();
  });
});
