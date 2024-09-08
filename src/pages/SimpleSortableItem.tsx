import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/Types/index';

interface SimpleSortableItemProps {
  id: number;
  task: Task;
  index: number;
}

const SimpleSortableItem: React.FC<SimpleSortableItemProps> = ({ id, task, index }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // task オブジェクト全体をログに出力
  console.log(task);

  return (
    <tr ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <td className="border px-4 py-2">{index + 1}</td>
      <td className="border px-4 py-2">{task.taskName}</td>
      <td className="border px-4 py-2">{task.taskTime}</td>
      <td className="border px-4 py-2">{task.tasktaskPriority}</td>
      <td className="border px-4 py-2">
        {/* 必要に応じてアクションボタンを追加 */}
      </td>
    </tr>
  );
};

export default SimpleSortableItem;