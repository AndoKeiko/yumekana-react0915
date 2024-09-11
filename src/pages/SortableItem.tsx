import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"
import type { SortableItemProps } from "@/Types/index";

const SortableItem: React.FC<SortableItemProps> = ({
  id,
  task,
  editingId,
  editedTask,
  handleEdit,
  handleSave,
  handleChange,
  handleDeleteTask,
  index
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isEditing = task.id != null && editingId === task.id.toString();
  console.log(task);
  console.log(editedTask);
  return (
    <tr ref={setNodeRef} style={style} {...attributes} {...listeners}>
<td className="border px-4 py-2">
  {task.order != null && task.order !== 0
    ? task.order.toString()
    : task.taskOrder != null
    ? task.taskOrder.toString()
    : (index + 1).toString()}
</td>
      <td className="border px-4 py-2">
      {isEditing ? (
          <Input
            value={editedTask?.taskName || editedTask?.name}
            onChange={(e) => handleChange(e, editedTask?.taskName ? "taskName" : "name")}
          />
        ) : (
          task.taskName || task.name
        )}
      </td>
      <td className="border px-4 py-2">
      {isEditing ? (
    <Input
      value={editedTask?.taskTime?.toString() || editedTask?.estimated_time?.toString() || ""}
      onChange={(e) => handleChange(e, editedTask?.taskTime ? "taskTime" : "estimated_time")}
      type="number"
    />
  ) : (
    task.taskTime != null ? task.taskTime : task.estimated_time
  )}
      </td>
      <td className="border px-4 py-2">
        {isEditing ? (
          <select
            value={String(editedTask?.taskPriority ?? task?.taskPriority ?? 1)}
            onChange={(e) => handleChange(e, "priority")}
            className="w-full border rounded px-2 py-1"
          >
            <option value="1">低</option>
            <option value="2">中</option>
            <option value="3">高</option>
          </select>
        ) : task.taskPriority === 1 ? (
          "低"
        ) : task.taskPriority === 2 ? (
          "中"
        ) : task.taskPriority === 3 ? (
          "高"
        ) : task.priority === 1 ? (
          "低"
        ) : task.priority === 2 ? (
          "中"
        ) : (
          "高"
        )}
      </td>
      <td className="border px-4 py-2">
        {isEditing ? (
          <Button onClick={() => handleSave(task.id)}>保存</Button>
        ) : (
          <div className="flex space-x-2">
            <button onClick={() => handleEdit(task)}>編集</button>
            <Button className="ml-2" onClick={() => handleDeleteTask(task.id)}>
              削除
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
};

export default SortableItem;