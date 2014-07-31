"use strict";

// Create the json representation of the knowledge graph
var resources = [
  {
    id: "knowledge-map",
    label: "What is a knowledge map?",
    teaches: ['what-is-a-km'],
    content: [{
      text: "Knowledge maps are like a roadmap for pieces of knowledge. They can be used to show others how to navigate from their current set of knowledge to a particular goal. Or they can be used to find people who know something you haven't learnt yet.",
    }]
  },
  {
    id: "viewing",
    label: "Viewing a knowledge map",
    requires: ['what-is-a-km'],
    teaches: ['how-to-view-a-km'],
    content: [{
      text: "You're doing it right now! Each of the labelled points on the page is called a 'concept' and the arrows joining them are called 'dependencies'. Concepts are pieces of information that can be learned if you have learned all of the concepts which point to it. That is, if you want to learn a concept learn all of its dependencies!",
    }]
  },
  {
    id: "learning",
    label: "Learning using knowledge maps",
    requires: ['how-to-view-a-km'],
    teaches: ['learning-using-kms'],
    content: [{
      text: "You can learn by using the resources attached to a concept or by contacting people who know the concept. The best knowledge maps will give you lots of different resources to try and learn each concept.",
    }]
  },
  {
    id: "creating",
    label: "Create your own knowledge map",
    requires: ['what-is-a-km', 'how-to-view-a-km'],
    teaches: ['creating-kms'],
    content: [{
      text: "If you want to share how to do or learn something then create your own map! This concept links to an interactive demonstration that will allow you to create your own knowledge map.",
    }, {
      description: "If you want to share how to do or learn something then create your own map! This concept links to an interactive demonstration that will allow you to create your own knowledge map.",
      title: "Graph editing demo",
      link: "/demo/edit.html"
    }, {
      description: "If you want to share how to do or learn something then create your own map! This concept links to an interactive demonstration that will allow you to create your own knowledge map.",
      title: "Graph editing demo",
      link: "/demo/edit.html"
    }]
  },
  {
    id: "sharing",
    label: "Sharing your own knowledge map",
    requires: ['creating-kms'],
    teaches: ['sharing-kms'],
    content: [{
      text: "Once you've created your own knowledge map you can share it in various ways. You can embed the knowledge map in your website or save it as an image.",
    }]
  }
];

// Create graph that visualises the knowledge
var km = knowledgeMap.create({
  resources: resources,
  plugins: ['hamburger-nodes'],
});

km.defineConcept({
  id: 'what-is-a-km',
  label: 'Blah!'
});
