/**
 * Knowledge Graph — Obsidian-style force-directed visualization
 * Uses Canvas API for rendering, simple physics for layout
 */
const Graph = {
    canvas: null,
    ctx: null,
    nodes: [],
    edges: [],
    animId: null,
    isDragging: false,
    dragNode: null,
    hoveredNode: null,
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    panX: 0,
    panY: 0,
    lastMouse: { x: 0, y: 0 },
    isPanning: false,

    COLORS: {
        note: '#7c3aed',
        daily: '#3b82f6',
        idea: '#f59e0b',
        reference: '#10b981',
        project: '#ec4899',
        default: '#6366f1',
        edge: 'rgba(124, 58, 237, 0.15)',
        edgeHover: 'rgba(124, 58, 237, 0.5)',
        text: '#e8e8ed',
        textMuted: '#71717a',
        bg: '#0c0c11'
    },

    render: function() {
        var container = document.getElementById('view-graph');
        if (!container) return;

        container.innerHTML =
            '<div class="graph-header">' +
                '<div>' +
                    '<h2 class="section-title">Knowledge Graph</h2>' +
                    '<p class="muted" id="graph-stats">Loading…</p>' +
                '</div>' +
                '<div class="graph-controls">' +
                    '<button type="button" class="btn btn-sm" id="graph-zoom-in" title="Zoom in">+</button>' +
                    '<button type="button" class="btn btn-sm" id="graph-zoom-out" title="Zoom out">\u2212</button>' +
                    '<button type="button" class="btn btn-sm" id="graph-reset" title="Reset view">Reset</button>' +
                '</div>' +
            '</div>' +
            '<div class="graph-container" id="graph-canvas-wrap">' +
                '<canvas id="graph-canvas"></canvas>' +
            '</div>' +
            '<div class="graph-legend">' +
                '<span class="graph-legend-item"><span class="graph-dot" style="background:#7c3aed"></span>Note</span>' +
                '<span class="graph-legend-item"><span class="graph-dot" style="background:#3b82f6"></span>Daily</span>' +
                '<span class="graph-legend-item"><span class="graph-dot" style="background:#f59e0b"></span>Idea</span>' +
                '<span class="graph-legend-item"><span class="graph-dot" style="background:#10b981"></span>Reference</span>' +
                '<span class="graph-legend-item"><span class="graph-dot" style="background:#ec4899"></span>Project</span>' +
            '</div>';

        Graph.initCanvas();
        Graph.loadData().then(function() {
            Graph.startSimulation();
        });

        Graph.bindControls();
    },

    initCanvas: function() {
        var wrap = document.getElementById('graph-canvas-wrap');
        Graph.canvas = document.getElementById('graph-canvas');
        Graph.ctx = Graph.canvas.getContext('2d');

        var resize = function() {
            var rect = wrap.getBoundingClientRect();
            var dpr = window.devicePixelRatio || 1;
            Graph.canvas.width = rect.width * dpr;
            Graph.canvas.height = rect.height * dpr;
            Graph.canvas.style.width = rect.width + 'px';
            Graph.canvas.style.height = rect.height + 'px';
            Graph.ctx.scale(dpr, dpr);
        };
        resize();
        window.addEventListener('resize', resize);

        // Mouse events
        Graph.canvas.addEventListener('mousedown', Graph.onMouseDown);
        Graph.canvas.addEventListener('mousemove', Graph.onMouseMove);
        Graph.canvas.addEventListener('mouseup', Graph.onMouseUp);
        Graph.canvas.addEventListener('wheel', Graph.onWheel, { passive: false });
        Graph.canvas.addEventListener('dblclick', Graph.onDblClick);

        // Touch events
        Graph.canvas.addEventListener('touchstart', Graph.onTouchStart, { passive: false });
        Graph.canvas.addEventListener('touchmove', Graph.onTouchMove, { passive: false });
        Graph.canvas.addEventListener('touchend', Graph.onTouchEnd);
    },

    loadData: function() {
        return Promise.all([
            RetraqDB.getAllNotes(),
            RetraqDB.getAllProjects()
        ]).then(function(results) {
            var notes = results[0].filter(function(n) { return n.status !== 'archived'; });
            var projects = results[1];
            var nodeMap = {};
            Graph.nodes = [];
            Graph.edges = [];

            var cx = (Graph.canvas.width / (window.devicePixelRatio || 1)) / 2;
            var cy = (Graph.canvas.height / (window.devicePixelRatio || 1)) / 2;
            var spread = Math.min(cx, cy) * 0.7;

            // Create note nodes
            notes.forEach(function(note, i) {
                var angle = (i / notes.length) * Math.PI * 2;
                var r = spread * (0.3 + Math.random() * 0.7);
                var node = {
                    id: 'note-' + note.id,
                    noteId: note.id,
                    label: note.title || 'Untitled',
                    type: note.type || 'note',
                    x: cx + Math.cos(angle) * r,
                    y: cy + Math.sin(angle) * r,
                    vx: 0, vy: 0,
                    connections: 0,
                    data: note
                };
                Graph.nodes.push(node);
                nodeMap[note.id] = node;
            });

            // Create project nodes
            projects.forEach(function(proj, i) {
                var angle = (i / projects.length) * Math.PI * 2 + 0.5;
                var r = spread * 0.5;
                var node = {
                    id: 'proj-' + proj.id,
                    projectId: proj.id,
                    label: proj.icon + ' ' + proj.title,
                    type: 'project',
                    x: cx + Math.cos(angle) * r,
                    y: cy + Math.sin(angle) * r,
                    vx: 0, vy: 0,
                    connections: 0,
                    data: proj
                };
                Graph.nodes.push(node);
                nodeMap['proj-' + proj.id] = node;
            });

            // Parse [[wikilinks]] from note content to create edges
            var wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
            notes.forEach(function(note) {
                if (!note.content) return;
                var match;
                while ((match = wikiLinkRegex.exec(note.content)) !== null) {
                    var targetTitle = match[1].trim().toLowerCase();
                    // Find matching note
                    var targetNode = Graph.nodes.find(function(n) {
                        return n.noteId && n.label.toLowerCase() === targetTitle;
                    });
                    if (targetNode && nodeMap[note.id]) {
                        Graph.edges.push({
                            source: nodeMap[note.id],
                            target: targetNode
                        });
                        nodeMap[note.id].connections++;
                        targetNode.connections++;
                    }
                }
            });

            // Link notes to their projects
            return Promise.all(notes.map(function(note) {
                return RetraqDB.getProjectsForNote(note.id).then(function(linkedProjects) {
                    linkedProjects.forEach(function(lp) {
                        var projNode = nodeMap['proj-' + lp.id];
                        var noteNode = nodeMap[note.id];
                        if (projNode && noteNode) {
                            Graph.edges.push({
                                source: noteNode,
                                target: projNode
                            });
                            noteNode.connections++;
                            projNode.connections++;
                        }
                    });
                });
            }));
        }).then(function() {
            var stats = document.getElementById('graph-stats');
            if (stats) {
                stats.textContent = Graph.nodes.length + ' nodes \u00b7 ' + Graph.edges.length + ' connections';
            }
        });
    },

    startSimulation: function() {
        var iterations = 0;
        var maxIterations = 300;

        function tick() {
            iterations++;
            Graph.simulate();
            Graph.draw();

            if (iterations < maxIterations || Graph.isDragging) {
                Graph.animId = requestAnimationFrame(tick);
            }
        }
        tick();
    },

    simulate: function() {
        var nodes = Graph.nodes;
        var edges = Graph.edges;
        var damping = 0.85;
        var repulsion = 2500;
        var attraction = 0.008;
        var centerGravity = 0.01;
        var cx = (Graph.canvas.width / (window.devicePixelRatio || 1)) / 2;
        var cy = (Graph.canvas.height / (window.devicePixelRatio || 1)) / 2;

        // Repulsion between all nodes
        for (var i = 0; i < nodes.length; i++) {
            for (var j = i + 1; j < nodes.length; j++) {
                var dx = nodes[j].x - nodes[i].x;
                var dy = nodes[j].y - nodes[i].y;
                var dist = Math.sqrt(dx * dx + dy * dy) || 1;
                var force = repulsion / (dist * dist);
                var fx = (dx / dist) * force;
                var fy = (dy / dist) * force;
                nodes[i].vx -= fx;
                nodes[i].vy -= fy;
                nodes[j].vx += fx;
                nodes[j].vy += fy;
            }
        }

        // Attraction along edges
        edges.forEach(function(edge) {
            var dx = edge.target.x - edge.source.x;
            var dy = edge.target.y - edge.source.y;
            var dist = Math.sqrt(dx * dx + dy * dy) || 1;
            var force = dist * attraction;
            var fx = (dx / dist) * force;
            var fy = (dy / dist) * force;
            edge.source.vx += fx;
            edge.source.vy += fy;
            edge.target.vx -= fx;
            edge.target.vy -= fy;
        });

        // Center gravity
        nodes.forEach(function(node) {
            node.vx += (cx - node.x) * centerGravity;
            node.vy += (cy - node.y) * centerGravity;
        });

        // Apply velocity
        nodes.forEach(function(node) {
            if (node === Graph.dragNode) return;
            node.vx *= damping;
            node.vy *= damping;
            node.x += node.vx;
            node.y += node.vy;
        });
    },

    draw: function() {
        var ctx = Graph.ctx;
        var w = Graph.canvas.width / (window.devicePixelRatio || 1);
        var h = Graph.canvas.height / (window.devicePixelRatio || 1);

        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.translate(Graph.panX, Graph.panY);
        ctx.scale(Graph.scale, Graph.scale);

        // Draw edges
        Graph.edges.forEach(function(edge) {
            var isHovered = Graph.hoveredNode &&
                (edge.source === Graph.hoveredNode || edge.target === Graph.hoveredNode);

            ctx.beginPath();
            ctx.moveTo(edge.source.x, edge.source.y);
            ctx.lineTo(edge.target.x, edge.target.y);
            ctx.strokeStyle = isHovered ? Graph.COLORS.edgeHover : Graph.COLORS.edge;
            ctx.lineWidth = isHovered ? 1.5 : 0.8;
            ctx.stroke();
        });

        // Draw nodes
        Graph.nodes.forEach(function(node) {
            var baseRadius = 4 + Math.min(node.connections * 2, 12);
            var isHovered = node === Graph.hoveredNode;
            var radius = isHovered ? baseRadius + 3 : baseRadius;
            var color = Graph.COLORS[node.type] || Graph.COLORS.default;

            // Glow
            if (isHovered || node.connections > 2) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius + 6, 0, Math.PI * 2);
                ctx.fillStyle = color.replace(')', ', 0.15)').replace('rgb', 'rgba');
                ctx.fill();
            }

            // Node circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();

            // Label
            if (isHovered || node.connections > 0 || Graph.scale > 0.8) {
                ctx.font = (isHovered ? 'bold ' : '') + '11px Inter, sans-serif';
                ctx.fillStyle = isHovered ? Graph.COLORS.text : Graph.COLORS.textMuted;
                ctx.textAlign = 'center';
                var label = node.label.length > 24 ? node.label.slice(0, 22) + '\u2026' : node.label;
                ctx.fillText(label, node.x, node.y + radius + 14);
            }
        });

        ctx.restore();
    },

    getNodeAt: function(mx, my) {
        var x = (mx - Graph.panX) / Graph.scale;
        var y = (my - Graph.panY) / Graph.scale;
        for (var i = Graph.nodes.length - 1; i >= 0; i--) {
            var node = Graph.nodes[i];
            var r = 4 + Math.min(node.connections * 2, 12) + 4;
            var dx = node.x - x;
            var dy = node.y - y;
            if (dx * dx + dy * dy < r * r) return node;
        }
        return null;
    },

    getMousePos: function(e) {
        var rect = Graph.canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    },

    onMouseDown: function(e) {
        var pos = Graph.getMousePos(e);
        var node = Graph.getNodeAt(pos.x, pos.y);
        if (node) {
            Graph.isDragging = true;
            Graph.dragNode = node;
            Graph.offsetX = (pos.x - Graph.panX) / Graph.scale - node.x;
            Graph.offsetY = (pos.y - Graph.panY) / Graph.scale - node.y;
            Graph.canvas.style.cursor = 'grabbing';
        } else {
            Graph.isPanning = true;
            Graph.lastMouse = pos;
            Graph.canvas.style.cursor = 'grabbing';
        }
    },

    onMouseMove: function(e) {
        var pos = Graph.getMousePos(e);
        if (Graph.isDragging && Graph.dragNode) {
            Graph.dragNode.x = (pos.x - Graph.panX) / Graph.scale - Graph.offsetX;
            Graph.dragNode.y = (pos.y - Graph.panY) / Graph.scale - Graph.offsetY;
            Graph.dragNode.vx = 0;
            Graph.dragNode.vy = 0;
            Graph.draw();
        } else if (Graph.isPanning) {
            Graph.panX += pos.x - Graph.lastMouse.x;
            Graph.panY += pos.y - Graph.lastMouse.y;
            Graph.lastMouse = pos;
            Graph.draw();
        } else {
            var node = Graph.getNodeAt(pos.x, pos.y);
            if (node !== Graph.hoveredNode) {
                Graph.hoveredNode = node;
                Graph.canvas.style.cursor = node ? 'pointer' : 'default';
                Graph.draw();
            }
        }
    },

    onMouseUp: function() {
        if (Graph.isDragging) {
            Graph.isDragging = false;
            Graph.dragNode = null;
            Graph.startSimulation();
        }
        Graph.isPanning = false;
        Graph.canvas.style.cursor = 'default';
    },

    onWheel: function(e) {
        e.preventDefault();
        var delta = e.deltaY > 0 ? 0.9 : 1.1;
        Graph.scale = Math.max(0.2, Math.min(3, Graph.scale * delta));
        Graph.draw();
    },

    onDblClick: function(e) {
        var pos = Graph.getMousePos(e);
        var node = Graph.getNodeAt(pos.x, pos.y);
        if (!node) return;

        if (node.noteId) {
            Notes.showEditor({
                note: node.data,
                onSave: function() { Graph.render(); }
            });
        } else if (node.projectId) {
            window.location.hash = '#/project/' + node.projectId;
        }
    },

    onTouchStart: function(e) {
        if (e.touches.length === 1) {
            var touch = e.touches[0];
            var rect = Graph.canvas.getBoundingClientRect();
            var pos = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
            var node = Graph.getNodeAt(pos.x, pos.y);
            if (node) {
                e.preventDefault();
                Graph.isDragging = true;
                Graph.dragNode = node;
                Graph.offsetX = (pos.x - Graph.panX) / Graph.scale - node.x;
                Graph.offsetY = (pos.y - Graph.panY) / Graph.scale - node.y;
            } else {
                Graph.isPanning = true;
                Graph.lastMouse = pos;
            }
        }
    },

    onTouchMove: function(e) {
        if (e.touches.length === 1) {
            e.preventDefault();
            var touch = e.touches[0];
            var rect = Graph.canvas.getBoundingClientRect();
            var pos = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
            if (Graph.isDragging && Graph.dragNode) {
                Graph.dragNode.x = (pos.x - Graph.panX) / Graph.scale - Graph.offsetX;
                Graph.dragNode.y = (pos.y - Graph.panY) / Graph.scale - Graph.offsetY;
                Graph.dragNode.vx = 0;
                Graph.dragNode.vy = 0;
                Graph.draw();
            } else if (Graph.isPanning) {
                Graph.panX += pos.x - Graph.lastMouse.x;
                Graph.panY += pos.y - Graph.lastMouse.y;
                Graph.lastMouse = pos;
                Graph.draw();
            }
        }
    },

    onTouchEnd: function() {
        if (Graph.isDragging) {
            Graph.isDragging = false;
            Graph.dragNode = null;
            Graph.startSimulation();
        }
        Graph.isPanning = false;
    },

    bindControls: function() {
        document.getElementById('graph-zoom-in').addEventListener('click', function() {
            Graph.scale = Math.min(3, Graph.scale * 1.2);
            Graph.draw();
        });
        document.getElementById('graph-zoom-out').addEventListener('click', function() {
            Graph.scale = Math.max(0.2, Graph.scale * 0.8);
            Graph.draw();
        });
        document.getElementById('graph-reset').addEventListener('click', function() {
            Graph.scale = 1;
            Graph.panX = 0;
            Graph.panY = 0;
            Graph.draw();
        });
    },

    destroy: function() {
        if (Graph.animId) {
            cancelAnimationFrame(Graph.animId);
            Graph.animId = null;
        }
    }
};

window.Graph = Graph;
