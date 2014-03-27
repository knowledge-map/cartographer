var sampleConcept = {
	id: 'sample-concept',
	name: 'sample-concept',
}

describe('Knowledge graph', function() {
  it('should exist and have a create function', function() {
    expect(knowledgeGraph).toBeDefined();
    expect(knowledgeGraph.create).toBeDefined();
	
		describe('Creating a knowledge graph', function() {
			it('should create a knowledge graph object', function() {
				var kg = knowledgeGraph.create();
				expect(kg).toBeDefined();
			});
		});
  });

  it('should have a method to create a concept', function() {
    expect(knowledgeGraph.addConcept).toBeDefined();

		describe('Adding a concept to a knowledge graph', function() {
			var kg;

			beforeEach(function() {
				kg = knowledgeGraph.create();
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
  });
});
