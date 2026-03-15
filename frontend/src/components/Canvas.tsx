import { useRef } from 'react';
import { useAppStore } from '../stores/appStore';
import { WorkspaceItem } from './WorkspaceItem';

export function Canvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { components, addComponent, setSelectedComponentId } = useAppStore();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('componentType') as any;
    const label = e.dataTransfer.getData('componentLabel');

    if (!type || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / 150);
    const y = Math.floor((e.clientY - rect.top) / 150);

    addComponent({
      type,
      x: x * 150,
      y: y * 150,
      w: 400,
      h: 300,
      config: { label },
    });
  };

  return (
    <div
      ref={canvasRef}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="flex-1 bg-gray-100 p-4 overflow-auto relative"
      onClick={() => setSelectedComponentId(null)}
    >
      {components.map((component) => (
        <WorkspaceItem key={component.id} component={component} />
      ))}
    </div>
  );
}
