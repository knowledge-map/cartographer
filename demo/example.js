"use strict";

// Create the json representation of the knowledge graph
var knowledge = {
  concepts: [
    {
      id: "knowledge-map",
      name: "What is a knowledge map?",
      content: [{
        text: "Knowledge maps are like a roadmap for pieces of knowledge. They can be used to show others how to navigate from their current set of knowledge to a particular goal. Or they can be used to find people who know something you haven't learnt yet.",
      }]
    },
    {
      id: "viewing",
      name: "Viewing a knowledge map",
      dependencies: ["knowledge-map"],
      content: [{
        text: "You're doing it right now! Each of the labelled points on the page is called a 'concept' and the arrows joining them are called 'dependencies'. Concepts are pieces of information that can be learned if you have learned all of the concepts which point to it. That is, if you want to learn a concept learn all of its dependencies!",
      }]
    },
    {
      id: "creating",
      name: "Create your own knowledge map",
      dependencies: ["knowledge-map", "viewing"],
      content: [{
        description: "If you want to share how to do or learn something then create your own map! This concept links to an interactive demonstration that will allow you to create your own knowledge map.",
        title: "Graph editing demo",
        link: "/demo/edit.html"
      }]
    },
    {
      id: "sharing",
      name: "Sharing your own knowledge map",
      dependencies: ["creating"],
      content: [{
        text: "Once you've created your own knowledge map you can share it in various ways. You can embed the knowledge map in your website or save it as an image.",
      }]
    },
    {
      id: "learning",
      name: "Learning using knowledge maps",
      dependencies: ["viewing"],
      content: [{
        text: "You can learn by using the resources attached to a concept or by contacting people who know the concept. The best knowledge maps will give you lots of different resources to try and learn each concept.",
      }]
    }
  ]
};

// Create graph that visualises the knowledge
knowledgeGraph.create({
  graph: knowledge,
  plugins: ['modals'],
});
