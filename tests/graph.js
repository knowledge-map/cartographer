describe('Knowledge map', function() {
  var kg;
  beforeEach(function() {
    kg = knowledgeMap.create();
  });

  it('should have a method to create a concept', function() {
    expect(kg.addConcept).toBeDefined();
  });
});

describe('Adding a concept to a knowledge map', function() {
  var kg;
  var sampleConcept = {
    id: 'sample-concept',
    name: 'sample-concept',
  };

  beforeEach(function() {
    kg = knowledgeMap.create();
    kg.addConcept({concept: sampleConcept});
  });

  it('should add a new node', function() {
    expect(kg.graph.node(sampleConcept.id)).toBeDefined();
  });

  it('should display the new node', function() {
    var node = kg.element.select('.node#'+sampleConcept.id).node();
    expect(node).not.toBe(null);
  });
});

describe('Removing a concept from a knowledge map', function() {
  var kg;
  var sampleConcept1 = {
    id: 'sample-concept1',
    name: 'sample-concept1',
  };
  var sampleConcept2 = {
    id: 'sample-concept2',
    name: 'sample-concept2',
  };

  beforeEach(function() {
    kg = knowledgeMap.create();
    kg.addConcept({concept: sampleConcept1});
    kg.addConcept({concept: sampleConcept2});
    waits(500); // Removing this makes the second test fail (DOM element not deleted properly)
    kg.removeConcept(sampleConcept1.id);
  });

  it('remove the correct node from the knowledge map', function() {
    expect(kg.graph.hasNode(sampleConcept1.id)).toBe(false);
    expect(kg.graph.hasNode(sampleConcept2.id)).toBe(true);
  });

  it('remove the correct node from the display', function() {
    var node1 = kg.element.select('.node#'+sampleConcept1.id).node();
    expect(node1).toBe(null);
    var node2 = kg.element.select('.node#'+sampleConcept2.id).node();
    expect(node2).not.toBe(null);
  });
});

describe('Adding a dependency to a knowledge map', function() {
  var kg;
  var sampleConcept = {
    id: 'sample-concept',
    name: 'sample-concept',
  };
  var dependencyConcept = {
    id: 'dependency-concept',
    name: 'dependency-concept',
  };
  var dependency = {
    concept: sampleConcept.id,
    dependency: dependencyConcept.id,
  };

  beforeEach(function() {
    sampleConcept.dependencies = undefined;
    kg = knowledgeMap.create();
    kg.addConcept({concept: sampleConcept});
    kg.addConcept({concept: dependencyConcept});
    kg.addDependency({concept: sampleConcept, dependency: dependencyConcept.id});
  });

  it('should add a dependency to the graph', function() {
    var hasEdge = kg.graph.hasEdge(dependencyConcept.id+'-'+sampleConcept.id);
    expect(hasEdge).toBe(true);
  });

  it('should add the edge to the display', function() {
    var edge = kg.element.select('.edgePath#'+dependencyConcept.id+'-'+sampleConcept.id).node();
    expect(edge).not.toBe(null);
  });
});

describe('Removing a dependency from a knowledge map', function() {
  var kg;
  var sampleConcept = {
    id: 'sample-concept',
    name: 'sample-concept',
  };
  var dependencyConcept = {
    id: 'dependency-concept',
    name: 'dependency-concept',
  };
  var dependency = {
    concept: sampleConcept.id,
	dependency: dependencyConcept.id,
  };

  beforeEach(function() {
    kg = knowledgeMap.create({
	  transitionDuration: null,
	});
    kg.addConcept({concept: sampleConcept});
    kg.addConcept({concept: dependencyConcept});
    kg.addDependency({concept: sampleConcept, dependency: dependencyConcept.id});
    kg.removeDependency(dependency);
  });

  it('should remove the dependency from the graph', function() {
    var hasEdge = kg.graph.hasEdge(dependencyConcept.id+'-'+sampleConcept.id);
    expect(hasEdge).toBe(false);
  });

  it('should remove the edge from the display', function() {
    var edge = kg.element.select('.edgePath#'+dependencyConcept.id+'-'+sampleConcept.id).node();
    expect(edge).toBe(null);
  });

});
