import { useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  getOutgoers,
  type Connection,
  type Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { BaseNode } from './nodes/BaseNode';
import { ContextMenu } from './ContextMenu';
import { useFlowStore } from '../stores/flowStore';
import type { NodeData } from '../types/flow';

const nodeTypes = {
  base: BaseNode,
};

export function FlowCanvas() {
  const { nodes, edges, setNodes, setEdges, executeNode } = useFlowStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);

  const onNodesChange = useCallback(
    (changes: any) => {
      const updatedNodes = changes.reduce((acc: Node<NodeData>[], change: any) => {
        if (change.type === 'remove') {
          return acc.filter((n) => n.id !== change.id);
        }
        if (change.type === 'position' && change.position) {
          return acc.map((n) =>
            n.id === change.id ? { ...n, position: change.position } : n
          );
        }
        return acc;
      }, nodes);
      setNodes(updatedNodes);
    },
    [nodes, setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: any) => {
      const updatedEdges = changes.reduce((acc: any[], change: any) => {
        if (change.type === 'remove') {
          return acc.filter((e) => e.id !== change.id);
        }
        return acc;
      }, edges);
      setEdges(updatedEdges);
    },
    [edges, setEdges]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;

      // 循环检测
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);
      if (!sourceNode || !targetNode) return;

      // 检查是否会形成循环
      const wouldCreateCycle = (start: Node<NodeData>, end: Node<NodeData>): boolean => {
        const visited = new Set<string>();
        const queue = [start];

        while (queue.length > 0) {
          const current = queue.shift()!;
          if (current.id === end.id) return true;
          if (visited.has(current.id)) continue;
          visited.add(current.id);

          const outgoers = getOutgoers(current, nodes, edges);
          queue.push(...outgoers);
        }
        return false;
      };

      if (wouldCreateCycle(targetNode, sourceNode)) {
        alert('不能创建循环连接');
        return;
      }

      // 类型校验：dataSource不能接收输入
      const targetType = targetNode.data.config?.nodeType as string;
      if (targetType === 'dataSource') {
        alert('数据源节点不能接收输入');
        return;
      }

      setEdges(addEdge(params, edges));
    },
    [edges, nodes, setEdges]
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('nodeType');
      const label = event.dataTransfer.getData('nodeLabel');

      if (!type) return;

      const position = {
        x: event.clientX - 100,
        y: event.clientY - 50,
      };

      const newNode: Node<NodeData> = {
        id: `node-${Date.now()}`,
        type: 'base',
        position,
        data: { label, config: { nodeType: type } },
      };

      setNodes([...nodes, newNode]);
    },
    [nodes, setNodes]
  );

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id });
  }, []);

  const handleDeleteNode = useCallback(() => {
    if (!contextMenu) return;
    setNodes(nodes.filter((n) => n.id !== contextMenu.nodeId));
    setEdges(edges.filter((e) => e.source !== contextMenu.nodeId && e.target !== contextMenu.nodeId));
    setContextMenu(null);
  }, [contextMenu, nodes, edges, setNodes, setEdges]);

  const handleDuplicateNode = useCallback(() => {
    if (!contextMenu) return;
    const node = nodes.find((n) => n.id === contextMenu.nodeId);
    if (!node) return;
    const newNode: Node<NodeData> = {
      ...node,
      id: `node-${Date.now()}`,
      position: { x: node.position.x + 50, y: node.position.y + 50 },
      data: { ...node.data, output: undefined, status: 'idle' },
    };
    setNodes([...nodes, newNode]);
    setContextMenu(null);
  }, [contextMenu, nodes, setNodes]);

  const handleExecuteNode = useCallback(() => {
    if (!contextMenu) return;
    executeNode(contextMenu.nodeId);
    setContextMenu(null);
  }, [contextMenu, executeNode]);

  return (
    <div className="flex-1 bg-gray-100">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onNodeContextMenu={onNodeContextMenu}
        nodeTypes={nodeTypes}
        deleteKeyCode={['Backspace', 'Delete']}
        fitView
      >
        <Background color="#aaa" gap={16} />
        <Controls />
        <MiniMap nodeColor="#e5e7eb" />
      </ReactFlow>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          onExecute={handleExecuteNode}
          onDelete={handleDeleteNode}
          onDuplicate={handleDuplicateNode}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
