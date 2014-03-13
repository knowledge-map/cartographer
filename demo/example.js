"use strict";

// Rename the knowledge graph library for convenience
var kg = knowledgeGraph;

// Create a new directed graph
var g = new kg.dagreD3.Digraph();

// Add nodes to the graph. The first argument is the node id. The second is
// metadata about the node. In this case we're going to add labels to each of
// our nodes.
g.addNode("kspacey",    { label: "Kevin Spacey" });
g.addNode("swilliams",  { label: "Saul Williams" });
g.addNode("bpitt",      { label: "Brad Pitt" });
g.addNode("hford",      { label: "Harrison Ford" });
g.addNode("lwilson",    { label: "Luke Wilson" });
g.addNode("kbacon",     { label: "Kevin Bacon" });

// Add edges to the graph. The first argument is the edge id. Here we use null
// to indicate that an arbitrary edge id can be assigned automatically. The
// second argument is the source of the edge. The third argument is the target
// of the edge. The last argument is the edge metadata.
g.addEdge(null, "kspacey",   "swilliams", { label: "K-PAX" });
g.addEdge(null, "swilliams", "kbacon",    { label: "These Vagabond Shoes" });
g.addEdge(null, "bpitt",     "kbacon",    { label: "Sleepers" });
g.addEdge(null, "hford",     "lwilson",   { label: "Anchorman 2" });
g.addEdge(null, "lwilson",   "kbacon",    { label: "Telling Lies in America" });

kg.create({graph: g});
/*
var graph = { ... };

knowledgGraph.create({graph: graph});
*/
