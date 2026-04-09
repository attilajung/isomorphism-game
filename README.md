# 🎮 [Play the Isomorphism Game](https://attilajung.github.io/isomorphism-game/)

A fun browser-based puzzle where you spot the one group of graphs that are structurally identical. Each round contains exactly one matching isomorphism class, and your job is to find every graph in that class.

## What Is Graph Isomorphism?

Two graphs are isomorphic if there exists a one-to-one correspondence between their vertices that preserves adjacency. In other words, you can relabel the vertices of one graph so that two vertices are connected in the first graph exactly when their matched vertices are connected in the second.

## Tech

Built with vanilla HTML, CSS, and JavaScript. Uses D3.js force-directed layouts to render the graphs and a brute-force isomorphism check for small graph sizes.
