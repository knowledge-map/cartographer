"use strict";

// Create the json representation of the knowledge graph
var knowledge = {
  concepts: [
    {
      id: "1digitadd",
      name: "1-digit addition",
    },
    {
      id: "1digitsub",
      name: "1-digit subtraction",
      dependencies: ["1digitadd"]
    },
    {
      id: "23digitsub",
      name: "2- and 3-digit",
      dependencies: ["1digitsub"]
    },
    {
      id: "addsubword",
      name: "Addition and subtraction word problems",
      dependencies: ["23digitsub", "2digitadd"]
    },
    {
      id: "2digitadd",
      name: "2-digit addition",
      dependencies: ["1digitadd"]
    },
    {
      id: "numline1",
      name: "Number line 1",
      dependencies: ["1digitadd"]
    }
  ]
};

// Create graph that visualises the knowledge
knowledgeGraph.create({graph: knowledge});
