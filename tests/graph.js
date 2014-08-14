describe('Knowledge map', function() {
  var km;
  beforeEach(function() {
    km = knowledgeMap.create();
  });

  it('should have a method to add a resource', function() {
    expect(km.addResource).toBeDefined();
  });
  it('should have a method to remove a resource', function() {
    expect(km.removeResource).toBeDefined();
  });
  it('should have a method to define a concept', function() {
    expect(km.defineConcept).toBeDefined();
  });
});

describe('Creating a knowledge map', function() {
  it('should accept a list of resources', function() {
    var km = knowledgeMap.create({
      resources: [{
        id: 'res1',
        label: 'Res1'
      }, {
        id: 'res2',
        label: 'Res2'
      }]
    });
    expect(km.graph.hasNode('res1')).toBe(true);
    expect(km.graph.hasNode('res2')).toBe(true);
  });
});

describe('Adding a resource to a knowledge map', function() {
  var km;
  var sampleResource;
  beforeEach(function() {
    km = knowledgeMap.create();
    sampleResource = {
      id: 'sample-resource',
      label: 'Sample resource'
    };
  });

  it('should add a new graph node', function() {
    var id = km.addResource(sampleResource);
    expect(id).toEqual(sampleResource.id);
    expect(km.graph.hasNode(id)).toBe(true);
    expect(km.graph.node(id).label).toEqual(sampleResource.label);
    expect(km.graph.node(id).type).toEqual('resource');
  });

  it('should add a new element to the document', function() {
    var id = km.addResource(sampleResource);
    var node = km.element.select('.node.resource#'+id).node();
    expect(node).not.toBe(null);
  });

  it('should accept a string and construct a default resource', function() {
    var label = 'Hello you';
    var id = km.addResource(label);
    expect(id).toEqual('hello-you');
    expect(km.graph.hasNode(id)).toBe(true);
    expect(km.graph.node(id).label).toEqual(label);
    expect(km.graph.node(id).type).toEqual('resource');
  });

  it('should add any concepts it teaches', function() {
    var concept1 = 'thing';
    var concept2 = {id: 'thang', label: 'Thang'};
    var id = km.addResource({
      id: 'hello',
      label: 'Hello',
      teaches: [concept1, concept2]
    });
    expect(km.graph.hasNode(concept1)).toBe(true);
    expect(km.graph.hasNode(concept2.id)).toBe(true);
  });

  it('should add any concepts it requires', function() {
    var concept1 = 'thing';
    var concept2 = {id: 'thang', label: 'Thang'};
    var id = km.addResource({
      id: 'hello',
      label: 'Hello',
      requires: [concept1, concept2]
    });
    expect(km.graph.hasNode(concept1)).toBe(true);
    expect(km.graph.hasNode(concept2.id)).toBe(true);
  });
});

describe('Adding a concept to the knowledge map', function() {
  var km;
  var sampleConcept;
  beforeEach(function() {
    km = knowledgeMap.create();
    sampleConcept = {
      id: 'sample-concept',
      label: 'Sample concept'
    };
  });

  it('should create a new graph node', function() {
    var id = km.defineConcept(sampleConcept);
    expect(id).toEqual(sampleConcept.id);
    expect(km.graph.hasNode(id)).toBe(true);
    expect(km.graph.node(id).label).toEqual(sampleConcept.label);
    expect(km.graph.node(id).type).toEqual('concept');
  });

  it('should add a new element to the document', function() {
    var id = km.defineConcept(sampleConcept);
    var node = km.element.select('.node.concept#'+id).node();
    expect(node).not.toBe(null);
  });

  it('should accept a string and construct a default resource', function() {
    var label = 'Hello you';
    var id = km.defineConcept(label);
    expect(id).toEqual('hello-you');
    expect(km.graph.hasNode(id)).toBe(true);
    expect(km.graph.hasNode(label)).toBe(false);
    expect(km.graph.node(id).label).toEqual(label);
    expect(km.graph.node(id).type).toEqual('concept');
  });

  it('should overwrite concepts with the same id', function() {
    var id = km.defineConcept(sampleConcept.id);
    expect(km.graph.node(id).label).toEqual(sampleConcept.id);
    km.defineConcept(sampleConcept);
    expect(km.graph.node(id).label).toEqual(sampleConcept.label);
  });
});

describe('Removing a resource from the knowledge map', function() {
  var km;
  var sampleResource;
  var concept1, concept2;
  beforeEach(function() {
    km = knowledgeMap.create();
    concept1 = 'This is';
    concept2 = {id: 'that-is', label: 'That is'};
    sampleResource = {
      id: 'sample-resource',
      label: 'Sample resource',
      teaches: [concept1],
      requires: [concept2],
    };
  });

  it('should remove the resource from the graph', function() {
    var id = km.addResource(sampleResource);
    expect(km.graph.hasNode(id)).toBe(true);
    // Test remove by object.
    km.removeResource(sampleResource);
    expect(km.graph.hasNode(id)).toBe(false);

    id = km.addResource(sampleResource);
    expect(km.graph.hasNode(id)).toBe(true);
    // Test remove by id.
    km.removeResource(sampleResource.id);
    expect(km.graph.hasNode(id)).toBe(false);
  });

  it('should remove all unlinked concepts from the graph', function() {
    var sampleResource2 = {
      id: 'sample-resource-2',
      label: 'Sample resource 2',
      teaches: [concept2],
      requires: [concept1],
    };
    var id1 = km.addResource(sampleResource);
    var id2 = km.addResource(sampleResource2);
    expect(km.graph.hasNode('this-is')).toBe(true);
    expect(km.graph.hasNode(concept2.id)).toBe(true);
    km.removeResource(sampleResource);
    expect(km.graph.hasNode('this-is')).toBe(true);
    expect(km.graph.hasNode(concept2.id)).toBe(true);
    km.removeResource(sampleResource2);
    expect(km.graph.hasNode('this-is')).toBe(false);
    expect(km.graph.hasNode(concept2.id)).toBe(false);
  });
});

describe('Rendering a knowledge map', function() {
  var km;
  beforeEach(function() {
    km = knowledgeMap.create();
  });

  it('should send layout callbacks', function() {
    var preLayoutSpy = jasmine.createSpy('preLayout spy');
    var postLayoutSpy = jasmine.createSpy('postLayout spy');
    km.onPreLayout(preLayoutSpy);
    km.onPostLayout(postLayoutSpy);
    km.render();
    expect(preLayoutSpy).toHaveBeenCalled();
    expect(postLayoutSpy).toHaveBeenCalled();
  });

  it('should not render when held', function() {
    var preLayoutSpy = jasmine.createSpy('preLayout spy');
    var postLayoutSpy = jasmine.createSpy('postLayout spy');
    km.onPreLayout(preLayoutSpy);
    km.onPostLayout(postLayoutSpy);
    km.hold().render();
    expect(preLayoutSpy).not.toHaveBeenCalled();
    expect(postLayoutSpy).not.toHaveBeenCalled();
    km.unhold().render();
    expect(preLayoutSpy).toHaveBeenCalled();
    expect(postLayoutSpy).toHaveBeenCalled();
  });

  it('should render nodes', function() {
    var newNodeSpy = jasmine.createSpy('newNode spy');
    var updateNodeSpy = jasmine.createSpy('updateNode spy');
    km.renderNodes.onNew(newNodeSpy);
    km.renderNodes.onUpdate(updateNodeSpy);
    km.render();
    expect(newNodeSpy).toHaveBeenCalled();
    expect(updateNodeSpy).toHaveBeenCalled();
  });

  it('should position nodes', function() {
    var positionNodeSpy = jasmine.createSpy('positionNode spy');
    km.positionNodes.onUpdate(positionNodeSpy);
    km.render();
    expect(positionNodeSpy).toHaveBeenCalled();
  });

  it('should render edges', function() {
    var newEdgeSpy = jasmine.createSpy('newEdge spy');
    km.renderEdges.onNew(newEdgeSpy);
    km.render();
    expect(newEdgeSpy).toHaveBeenCalled();
  });

  it('should position edges', function() {
    var positionEdgeSpy = jasmine.createSpy('positionEdge spy');
    km.positionEdges.onUpdate(positionEdgeSpy);
    km.render();
    expect(positionEdgeSpy).toHaveBeenCalled();
  });
});
