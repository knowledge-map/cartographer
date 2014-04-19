"use strict";

var knowledge = {
  concepts: [
    {
      id: "edit",
      name: "Click here!",
      content: [{
        text: "Click on a concept and edit its name and contents or remove it completely."
      }]
    },
    {
      id: "dependency",
      name: "Click the top",
      dependencies: ["edit"],
      content: [{
        text: "Click the top semi-circle of this concept to add a new concept that this concept depends on. Click on the new concept to edit its title and contents."
      }]
    },
    {
      id: "dependent",
      name: "Click the bottom",
      dependencies: ["edit"],
      content: [{
        text: "Click the bottom semi-circle of this concept to add a new concept that follows this concept. The new concept depends on this concept. Click on the new concept to edit its title and contents."
      }]
    },
    {
      id: "joining",
      name: "Drag between disconnected concepts",
      dependencies: ["edit"],
      content: [{
        text: "Drag from the top semi-circle of this concept to another concept to add the other concept as a dependency to this concept. Drag from the bottom semi-circle of this concept to another concept to add this concept as a dependency of the other concept."
      }]
    },
    {
      id: "removing",
      name: "Drag between connected concepts",
      dependencies: ["joining"],
      content: [{
        text: "Drag between two connected concepts to remove the connection."
      }]
    }
  ]
};

// Create graph that visualises the knowledge
knowledgeMap.create({
  graph: knowledge,
  plugins: ['editing', 'editing-modals'],
});
