"use client";

import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    ReactFlowProvider,
    Node,
    Panel,
    Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { TaskNode } from './TaskNode';
import { LayoutDashboard } from 'lucide-react';

const nodeTypes = {
    task: TaskNode,
};

// Initial Mock Data
const initialNodes: Node[] = [
    { id: '1', type: 'task', position: { x: 0, y: 0 }, data: { title: 'System Architecture', energyCost: 8, status: 'done', blocked: false } },
    { id: '2', type: 'task', position: { x: 0, y: 0 }, data: { title: 'Database Schema', energyCost: 5, status: 'in-progress', blocked: false } },
    { id: '3', type: 'task', position: { x: 0, y: 0 }, data: { title: 'API Endpoints', energyCost: 5, status: 'todo', blocked: true } },
    { id: '4', type: 'task', position: { x: 0, y: 0 }, data: { title: 'Frontend Dashboard', energyCost: 12, status: 'todo', blocked: true } },
    { id: '5', type: 'task', position: { x: 0, y: 0 }, data: { title: 'User Auth', energyCost: 3, status: 'done', blocked: false } },
];

const initialEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e1-5', source: '1', target: '5', animated: true },
    { id: 'e2-3', source: '2', target: '3', animated: true }, // Schema -> API
    { id: 'e3-4', source: '3', target: '4', animated: true }, // API -> Frontend
    { id: 'e5-4', source: '5', target: '4', animated: true }, // Auth -> Frontend
];

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 250;
const nodeHeight = 80;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = direction === 'LR' ? Position.Left : Position.Top;
        node.sourcePosition = direction === 'LR' ? Position.Right : Position.Bottom;
        // For this generic example, we are sticking to Top-Bottom so handles match TaskNode.

        // shift slightly so handle is centered
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };

        return node;
    });

    return { nodes: layoutedNodes, edges };
};

export function ProjectMap() {
    // Layout initial nodes
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        initialNodes,
        initialEdges
    );

    const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
        [setEdges]
    );

    const onLayout = useCallback(() => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            nodes,
            edges,
            'TB' // Top to Bottom
        );
        setNodes([...layoutedNodes]);
        setEdges([...layoutedEdges]);
    }, [nodes, edges, setNodes, setEdges]);

    return (
        <div className="h-full w-full bg-slate-50">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
            >
                <Controls />
                <MiniMap zoomable pannable className='!bg-slate-100 !border-slate-200' />
                <Background gap={12} size={1} />

                <Panel position="top-right">
                    <button
                        onClick={onLayout}
                        className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow border border-slate-200 text-sm font-medium text-slate-700 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Auto Layout
                    </button>
                </Panel>
            </ReactFlow>
        </div>
    );
}

export function ProjectMapWrapper() {
    return (
        <ReactFlowProvider>
            <ProjectMap />
        </ReactFlowProvider>
    )
}
