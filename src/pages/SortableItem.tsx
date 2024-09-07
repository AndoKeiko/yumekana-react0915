import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SortableItemProps } from "@/Types/index";

const SortableItem: React.FC<SortableItemProps> = ({
  task,
  editingId,
  editedTask,
  handleEdit,
  handleSave,
  handleChange,
  handleDeleteTask,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isEditing = editingId === task.id.toString();

  return (
    <tr ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <td className="border px-4 py-2">{task.order}</td>
      <td className="border px-4 py-2">
        {isEditing ? (
          <Input
            value={editedTask?.name || ""}
            onChange={(e) => handleChange(e, "name")}
          />
        ) : (
          task.name
        )}
      </td>
      <td className="border px-4 py-2">
        {isEditing ? (
          <Input
            value={editedTask?.estimatedTime.toString() || ""}
            onChange={(e) => handleChange(e, "estimatedTime")}
            type="number"
          />
        ) : (
          task.estimatedTime
        )}
      </td>
      <td className="border px-4 py-2">
        {isEditing ? (
          <select
            value={String(editedTask?.priority || 1)}
            onChange={(e) => handleChange(e, "priority")}
            className="w-full border rounded px-2 py-1"
          >
            <option value="1">低</option>
            <option value="2">中</option>
            <option value="3">高</option>
          </select>
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
            <Button onClick={() => handleEdit(task)}>編集</Button>
            <Button className="ml-2" onClick={() => handleDeleteTask(task.id)}>削除</Button>
          </div>
        )}
      </td>
    </tr>
  );
};

export default SortableItem;