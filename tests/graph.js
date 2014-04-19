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
