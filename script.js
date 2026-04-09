class Graph {
    constructor(numVertices) {
        this.numVertices = numVertices;
        this.adj = Array.from({ length: numVertices }, () => []);
    }

    addEdge(u, v) {
        if (!this.adj[u].includes(v)) {
            this.adj[u].push(v);
            this.adj[v].push(u);
        }
    }

    removeEdge(u, v) {
        this.adj[u] = this.adj[u].filter(x => x !== v);
        this.adj[v] = this.adj[v].filter(x => x !== u);
    }

    hasEdge(u, v) {
        return this.adj[u].includes(v);
    }

    getDegreeSequence() {
        return this.adj.map(neighbors => neighbors.length).sort((a, b) => a - b);
    }

    // Creates a permutation of this graph based on a mapping array
    permute(mapping) {
        const newGraph = new Graph(this.numVertices);
        for (let u = 0; u < this.numVertices; u++) {
            for (const v of this.adj[u]) {
                const newU = mapping[u];
                const newV = mapping[v];
                if (newU < newV) {
                    newGraph.addEdge(newU, newV);
                }
            }
        }
        return newGraph;
    }
}

// Check if graph G1 is isomorphic to G2 using brute-force backtracking (feasible for N <= 8)
function areIsomorphic(g1, g2) {
    if (g1.numVertices !== g2.numVertices) return false;

    // Quick check: Degree sequence
    const deg1 = g1.getDegreeSequence();
    const deg2 = g2.getDegreeSequence();
    for (let i = 0; i < deg1.length; i++) {
        if (deg1[i] !== deg2[i]) return false;
    }

    const n = g1.numVertices;
    const used = new Array(n).fill(false);
    const mapping = new Array(n).fill(-1);

    function backtrack(u) {
        if (u === n) return true; // Found a valid mapping

        for (let v = 0; v < n; v++) {
            if (!used[v]) {
                // Pruning: Check consistency with already mapped vertices
                // Check if mapping u -> v is valid w.r.t previous mappings 0..u-1
                // For all x < u, isEdge(u, x) in G1 == isEdge(v, mapping[x]) in G2?
                let consistent = true;
                for (let x = 0; x < u; x++) {
                    const mappedX = mapping[x];
                    const edge1 = g1.hasEdge(u, x);
                    const edge2 = g2.hasEdge(v, mappedX);
                    if (edge1 !== edge2) {
                        consistent = false;
                        break;
                    }
                }

                if (consistent) {
                    used[v] = true;
                    mapping[u] = v;
                    if (backtrack(u + 1)) return true;
                    used[v] = false;
                    mapping[u] = -1;
                }
            }
        }
        return false;
    }

    return backtrack(0);
}

// Game State
let currentLevel = 1;
let score = 0;
let graphs = []; // Array of {id, graph, isIsomorph} objects, though isIsomorph is relative
let targetGroupId = -1; // We can designate one group as the target, OR
// Better: "Find all graphs that form the largest isomorphic group" or just "Find the pair"
// Spec: "Select isomorphic pairs/triples".
// Let's implement: "There is ONE group of K isomorphic graphs. Select them all."
// And distractors are unique or form smaller groups. 
// To keep it simple: "Find the 2 (or 3) graphs that are isomorphic to each other."

let correctIndices = [];

function initGame() {
    score = 0;
    currentLevel = 1;
    updateStats();
    startLevel();

    document.getElementById('submit-btn').onclick = submitSelection;
    document.getElementById('next-level-btn').onclick = () => {
        currentLevel++;
        updateStats();
        startLevel();
    };
}

function updateStats() {
    document.getElementById('score').innerText = score;
    document.getElementById('level').innerText = currentLevel;
}

function generateRandomGraph(n, p) {
    const g = new Graph(n);
    for (let u = 0; u < n; u++) {
        for (let v = u + 1; v < n; v++) {
            if (Math.random() < p) {
                g.addEdge(u, v);
            }
        }
    }
    return g;
}

function startLevel() {
    document.getElementById('message').innerText = "";
    document.getElementById('next-level-btn').style.display = "none";
    document.getElementById('submit-btn').disabled = false;

    const layoutContainer = document.getElementById('options-grid');
    layoutContainer.innerHTML = '';

    // Difficulty params
    const numVertices = Math.min(5 + Math.floor(currentLevel / 3), 8); // Cap at 8 for performance of isomorphism check
    const edgeProb = 0.4;

    // We want to generate a set of K isomorphic graphs and M distractors.
    // Level 1-2: Find 2 isomorphic, 2 distractors (Total 4)
    // Level 3-5: Find 3 isomorphic, 3 distractors (Total 6)
    // Level 6+: Find 3 isomorphic, 5 distractors (Total 8)

    let groupSize = 2;
    let totalGraphs = 4;

    if (currentLevel >= 3) { groupSize = 3; totalGraphs = 6; }
    if (currentLevel >= 6) { groupSize = 3; totalGraphs = 8; }

    // 1. Generate Base Graph for the Target Group
    let baseGraph = generateRandomGraph(numVertices, edgeProb);
    // Ensure it's not empty or full for interest
    while (baseGraph.adj.every(ad => ad.length === 0) || baseGraph.getDegreeSequence()[0] === numVertices - 1) {
        baseGraph = generateRandomGraph(numVertices, edgeProb);
    }

    const gameGraphs = [];

    // Add Base Graph + (GroupSize-1) Permutations
    gameGraphs.push({ graph: baseGraph, type: 'target' });

    for (let i = 1; i < groupSize; i++) {
        const indices = Array.from({ length: numVertices }, (_, k) => k);
        // Shuffle
        for (let k = numVertices - 1; k > 0; k--) {
            const j = Math.floor(Math.random() * (k + 1));
            [indices[k], indices[j]] = [indices[j], indices[k]];
        }
        gameGraphs.push({ graph: baseGraph.permute(indices), type: 'target' });
    }

    // Add Distractors
    // Distractors must NOT be isomorphic to the Base Graph AND preferably not to each other (unique)
    let distractorsAdded = 0;
    let safeguard = 0;
    while (gameGraphs.length < totalGraphs && safeguard < 100) {
        safeguard++;
        const dist = generateRandomGraph(numVertices, edgeProb);

        // Check collision with Target
        if (areIsomorphic(dist, baseGraph)) continue;

        // Check collision with existing distractors (to make them unique)
        let collision = false;
        for (const g of gameGraphs) {
            if (g.type === 'distractor' && areIsomorphic(dist, g.graph)) {
                collision = true;
                break;
            }
        }
        if (collision) continue;

        gameGraphs.push({ graph: dist, type: 'distractor' });
    }

    // Shuffle board positions
    for (let i = gameGraphs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gameGraphs[i], gameGraphs[j]] = [gameGraphs[j], gameGraphs[i]];
    }

    correctIndices = [];
    graphs = gameGraphs;

    // Render
    gameGraphs.forEach((item, index) => {
        if (item.type === 'target') correctIndices.push(index);

        const wrapper = document.createElement('div');
        wrapper.className = 'option-wrapper';
        wrapper.id = `option-${index}`;
        wrapper.onclick = () => toggleSelection(index);

        const canvasDiv = document.createElement('div');
        canvasDiv.className = 'graph-canvas';
        const uniqueId = `canvas-${index}`;
        canvasDiv.id = uniqueId;

        wrapper.appendChild(canvasDiv);
        layoutContainer.appendChild(wrapper);

        renderGraph(item.graph, `#${uniqueId}`, 250, 250);
    });
}

const selectedIndices = new Set();

function toggleSelection(index) {
    if (document.getElementById('next-level-btn').style.display === "block") return;

    const wrapper = document.getElementById(`option-${index}`);
    if (selectedIndices.has(index)) {
        selectedIndices.delete(index);
        wrapper.classList.remove('selected');
    } else {
        selectedIndices.add(index);
        wrapper.classList.add('selected');
    }
}

function submitSelection() {
    if (selectedIndices.size === 0) return;

    document.getElementById('submit-btn').disabled = true;

    // Check correctness
    // Correct if Selected Set == Correct Set
    const selectedArray = Array.from(selectedIndices).sort();
    const correctArray = correctIndices.sort();

    const isCorrect = JSON.stringify(selectedArray) === JSON.stringify(correctArray);

    if (isCorrect) {
        score += 15;
        document.getElementById('message').innerText = "Correct! You found the isomorphic group.";
        document.getElementById('message').style.color = "var(--accent-color)";
        // Highlight all correct
        selectedArray.forEach(idx => {
            document.getElementById(`option-${idx}`).querySelector('.graph-canvas').classList.add('correct');
        });
    } else {
        score = Math.max(0, score - 5);
        document.getElementById('message').innerText = "Incorrect. See the solution below.";
        document.getElementById('message').style.color = "#f44336";

        // Show missed and wrong
        selectedArray.forEach(idx => {
            const el = document.getElementById(`option-${idx}`).querySelector('.graph-canvas');
            if (correctIndices.includes(idx)) {
                el.classList.add('correct');
            } else {
                el.classList.add('wrong');
            }
        });

        // Show missed correct ones
        correctIndices.forEach(idx => {
            if (!selectedIndices.has(idx)) {
                const el = document.getElementById(`option-${idx}`).querySelector('.graph-canvas');
                el.classList.add('missed');
            }
        });
    }

    updateStats();
    document.getElementById('next-level-btn').style.display = "block";
    selectedIndices.clear();
}

function renderGraph(graph, selector, width, height) {
    const svg = d3.select(selector)
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const nodes = Array.from({ length: graph.numVertices }, (_, i) => ({ id: i }));
    const links = [];
    for (let u = 0; u < graph.numVertices; u++) {
        for (const v of graph.adj[u]) {
            if (u < v) {
                links.push({ source: u, target: v });
            }
        }
    }

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(40))
        .force("charge", d3.forceManyBody().strength(-150))
        .force("center", d3.forceCenter(width / 2, height / 2))
        // Add collision to prevent overlap
        .force("collide", d3.forceCollide().radius(10));

    const link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke-width", 2);

    const node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", 6)
        .attr("fill", "#64b5f6")
        .call(drag(simulation));

    // Optional: Add drag behavior? Keep it for fun

    const margin = 10;

    simulation.on("tick", () => {
        // Constrain nodes to be within the box
        nodes.forEach(d => {
            d.x = Math.max(margin, Math.min(width - margin, d.x));
            d.y = Math.max(margin, Math.min(height - margin, d.y));
        });

        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    });
}

function drag(simulation) {
    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}

// Start game
initGame();
