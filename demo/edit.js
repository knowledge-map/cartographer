"use strict";

var knowledge = {
  concepts: [
    {
      id: "edit",
      name: "Click here to edit!"
    },
    {
      id: "dependency",
      name: "Click the top of the concept to add a dependency concept",
      dependencies: ["edit"]
    },
    {
      id: "dependent",
      name: "Click the bottom of the concept to add a dependent concept",
      dependencies: ["edit"]
    },
    {
      id: "joining",
      name: "Drag from one node to another to add dependencies",
      dependencies: ["edit"]
    }
  ]
};

// Create graph that visualises the knowledge
knowledgeGraph.create({
  graph: knowledge,
  plugins: [knowledgeGraph.plugins.editing],
});
