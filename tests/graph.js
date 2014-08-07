describe('Knowledge map', function() {
  var km;
  beforeEach(function() {
    km = knowledgeMap.create();
  });

  it('should have a method to create a resource', function() {
    expect(km.addResource).toBeDefined();
  });
  it('should have a method to define a concept', function() {
    expect(km.defineConcept).toBeDefined();
  });
});

describe('Adding a resource to a knowledge map', function() {
  var km;
  var sampleResource = {
    id: 'sample-resource',
    label: 'Sample resource',
  };

  beforeEach(function() {
    km = knowledgeMap.create();
  });

  it('should add a new graph node', function() {
    var id = km.addResource(sampleResource);
    expect(id)
      .toEqual(sampleResource.id);
    expect(km.graph.node(id))
      .toBeDefined();
    expect(km.graph.node(id).label)
      .toEqual(sampleResource.label);
  });

  it('should add a new element to the document', function() {
    var id = km.addResource(sampleResource);
    var node = km.element.select('.node.resource#'+id).node();
    expect(node)
      .not.toBe(null);
  });

  it('should accept a string and construct a default resource', function() {
    var label = 'Hello you';
    var id = km.addResource(label);
    expect(id)
      .toEqual('hello-you');
    expect(km.graph.node(id))
      .toBeDefined();
    expect(km.graph.node(id).label)
      .toEqual(label);
    expect(km.graph.node(id).type)
      .toEqual('resource');
  });
});

describe('Adding a concept to the knowledge map', function() {
  var km;
  beforeEach(function() {
    km = knowledgeMap.create();
  });

  var sampleConcept = {
    id: 'sample-concept',
    label: 'Sample concept'
  };

  it('should create a new graph node', function() {
    var id = km.defineConcept(sampleConcept);
    expect(id)
      .toEqual(sampleConcept.id);
    expect(km.graph.node(id))
      .toBeDefined();
    expect(km.graph.node(id).label)
      .toEqual(sampleConcept.label);
    expect(km.graph.node(id).type)
      .toEqual('concept');
  });

  it('should add a new element to the document', function() {
    var id = km.defineConcept(sampleConcept);
    var node = km.element.select('.node.concept#'+id).node();
    expect(node)
      .not.toBe(null);
  });

  it('should accept a string and construct a default resource', function() {
    var label = 'Hello you';
    var id = km.defineConcept(label);
    expect(id)
      .toEqual('hello-you');
    expect(km.graph.node(id))
      .toBeDefined();
    expect(km.graph.node(id).label)
      .toEqual(label);
  });

  it('should overwrite concepts with the same id', function() {
    var id = km.defineConcept(sampleConcept.id);
    expect(km.graph.node(id).label)
      .toEqual(sampleConcept.id);
    km.defineConcept(sampleConcept);
    expect(km.graph.node(id).label)
      .toEqual(sampleConcept.label);
  });
});
