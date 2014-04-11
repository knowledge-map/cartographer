"use strict";

var knowledge = {
  concepts: [
    {
      id: "edit",
      name: "Click here!"
    },
    {
      id: "dependency",
      name: "Click the top",
      dependencies: ["edit"]
    },
    {
      id: "dependent",
      name: "Click the bottom",
      dependencies: ["edit"]
    },
    {
      id: "joining",
      name: "Drag between disconnected concepts",
      dependencies: ["edit"]
    },
    {
      id: "removing",
      name: "Drag between connected concepts",
      dependencies: ["joining"]
    }
  ]
};

// Create graph that visualises the knowledge
knowledgeGraph.create({
  graph: knowledge,
  plugins: [knowledgeGraph.plugins.editing],
});
