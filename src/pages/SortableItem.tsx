import React, { useState } from "react";
// import { useSortable } from "@dnd-kit/sortable";
// import { CSS } from "@dnd-kit/utilities";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SortableItemProps, Task } from "@/Types/index";

interface Task {
  id: string | number;
  taskName: string;
  taskTime: number;
  taskPriority: number;
}
interface SortableItemProps {
  task: Task;
  index: number;
  handleEditClick: () => void;
  handleDeleteTask: (id: string | number) => void;
  handleSave: (id: string | number, updatedTask: Task) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, field: keyof Task, id: string | number) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({
  task,
  index,
  handleEditClick,
  handleDeleteTask,
  handleSave,
  handleChange,
}) => {
  // const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  const { id } = task; 
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Task>({
    id: task.id,
    taskName: task.taskName,
    taskTime: task.taskTime,
    taskPriority: task.taskPriority,
  });

  // const style = {
  //   transform: CSS.Transform.toString(transform),
  //   transition,
  // };

  const onEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log(`SortableItem: Editing task with id: ${task.id}`);
    setIsEditing(true);
    handleEditClick();
  };

  const onSave = () => {
    handleSave(task.id, editedTask);
    setIsEditing(false);
  };

  // const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, field: keyof Task) => {
  //   const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
  //   setEditedTask(prev => ({
  //     ...prev,
  //     [field]: value
  //   }));
  // };

  const onChangeField = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, field: keyof Task) => {
    setEditedTask(prev => ({
      ...prev,
      [field]: field === "taskTime" || field === "taskPriority" ? Number(e.target.value) : e.target.value
    }));
    handleChange(e, field, task.id);
  };

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleDeleteTask(task.id);
  };

  return (
    // <tr ref={setNodeRef} style={style} {...attributes} {...listeners}>
    <tr>
      <td className="border px-4 py-2">
        {task.order != null ? task.order.toString() : (index + 1).toString()}
      </td>
      <td className="border px-4 py-2">
        {isEditing ? (
          <Input
            value={editedTask.taskName || ''}
            onChange={(e) => onChangeField(e, "taskName")}
          />
        ) : (
          task.taskName || task.name
        )}
      </td>
      <td className="border px-4 py-2">
        {isEditing ? (
          <Input
            value={editedTask.taskTime?.toString() || ""}
            onChange={(e) => onChangeField(e, "taskTime")}
            type="number"
          />
        ) : (
          task.taskTime != null ? task.taskTime : task.estimated_time
        )}
      </td>
      <td className="border px-4 py-2">
        {isEditing ? (
          <select
            value={String(editedTask.taskPriority ?? 1)}
            onChange={(e) => onChangeField(e, "taskPriority")}
            className="w-full border rounded px-2 py-1"
          >
            <option value="1">低</option>
            <option value="2">中</option>
            <option value="3">高</option>
          </select>
        ) : task.taskPriority === 1 || task.priority === 1 ? (
          "低"
        ) : task.taskPriority === 2 || task.priority === 2 ? (
          "中"
        ) : (
          "高"
        )}
      </td>
      <td className="border px-4 py-2">
        {isEditing ? (
          <Button onClick={onSave}>保存</Button>
        ) : (
          <div className="flex space-x-2">
            <Button
              onClick={onEditClick}
              draggable="false"
              data-no-dnd="true"
            >編集
            </Button>
            <Button onClick={onDelete}>削除</Button>
          </div>
        )}
      </td>
    </tr>
  );
}
export default SortableItem;