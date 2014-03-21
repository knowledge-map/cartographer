describe("Knowledge graph", function() {
  it("should exist and have a create function", function() {
    expect(knowledgeGraph).toBeDefined();
    expect(knowledgeGraph.create).toBeDefined();
  });
});
