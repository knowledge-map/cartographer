var sampleConcept = {
	id: 'sample-concept',
	name: 'sample-concept',
};

describe('Knowledge graph', function() {
  var kg;
  beforeEach(function() {
    kg = knowledgeGraph.create();
  });

  it('should have a method to create a concept', function() {
    expect(kg.addConcept).toBeDefined();

		describe('Adding a concept to a knowledge graph', function() {
      kg.addConcept({concept: sampleConcept});

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
