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
      name: "Drag from one concept to another to add dependencies",
      dependencies: ["edit"]
    },
    {
      id: "removing",
      name: "Drag between a concept and its dependency to remove the connection",
      dependencies: ["joining"]
    }
  ]
};

// Create graph that visualises the knowledge
knowledgeGraph.create({
  graph: knowledge,
  plugins: ['editing-modal'],
});
