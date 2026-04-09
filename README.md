# 🎮 [Play the Isomorphism Game](https://attilajung.github.io/isomorphism-game/)

A fun browser-based puzzle where you spot the one group of graphs that are structurally identical. Each round contains exactly one matching isomorphism class, and your job is to find every graph in that class.

## What Is Graph Isomorphism?

Two graphs are isomorphic if there exists a one-to-one correspondence between their vertices that preserves adjacency. In other words, you can relabel the vertices of one graph so that two vertices are connected in the first graph exactly when their matched vertices are connected in the second.

## What's Included

- **Click to select**: Pick the graphs you believe belong to the same isomorphism class
- **Clear round goal**: Each level has exactly one matching group to find
- **Immediate feedback**: Correct and incorrect selections are highlighted after you submit
- **Progressive difficulty**: Later rounds increase the number of graphs and matching targets
- **Randomized layouts**: Graph drawings and card positions vary from round to round
- No setup required, just open it in your browser

## Tech

Built with vanilla HTML, CSS, and JavaScript. Uses D3.js to render the graphs as SVG and a brute-force isomorphism check for small graph sizes.
