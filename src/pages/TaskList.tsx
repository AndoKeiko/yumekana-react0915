import React, { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SortableItem from './SortableItem';
import Schedule from './Schedule';
import type { Task } from "@/Types/index";

interface SortConfig {
  key: keyof Task | null;
  direction: 'ascending' | 'descending';
}

interface TaskListProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onSaveTasks: (tasks: Task[]) => Promise<void>;
  existingTasks: Task[];
  chatResponse: Task[];
}

const TaskList: React.FC<TaskListProps> = ({ tasks, setTasks, onSaveTasks, existingTasks, chatResponse }) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'ascending' });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const combinedTasks = useMemo(() => {
    const allTasks = [...existingTasks, ...chatResponse];
    const uniqueTasks = allTasks.reduce((acc, current) => {
      const x = acc.find(item => item.taskName === current.taskName);
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc.map(item => item.taskName === current.taskName ? current : item);
      }
    }, [] as Task[]);
    return uniqueTasks;
  }, [chatResponse, existingTasks]);

  const sortedTasks = useMemo(() => {
    let sortableTasks = [...combinedTasks];
    if (sortConfig.key !== null) {
      sortableTasks.sort((a, b) => {
        if (a[sortConfig.key!] < b[sortConfig.key!]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key!] > b[sortConfig.key!]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableTasks;
  }, [combinedTasks, sortConfig]);

  const requestSort = (key: keyof Task) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex).map((item, index) => ({
          ...item,
          taskOrder: index + 1
        }));
      });
    }
  };
  const handleEdit = (task: Task) => {
    setEditingId(task.taskId);  // 編集中のタスクIDを設定
    setEditedTask({ ...task }); // 編集するタスクをコピーして設定
  };

  const handleSave = (taskId: string) => {
    // 保存のロジックを実装
    setEditingId(null);
    setEditedTask(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement> | { target: { value: string } },
    field: keyof Task
  ) => {
    if (editedTask) {
      setEditedTask({
        ...editedTask,
        [field]: e.target.value
      });
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = chatResponse.filter((task) => task.id !== taskId);
    setChatResponse(updatedTasks);
  };

  const handleSaveAll = async () => {
    try {
      setErrorMessage(null);
      const updatedTasks = tasks.map((task, index) => ({
        ...task,
        taskOrder: index + 1
      }));
      await onSaveTasks(updatedTasks);
      setTasks(updatedTasks);
    } catch (error) {
      console.error("Failed to save tasks:", error);
      if (axios.isAxiosError(error) && error.response) {
        setErrorMessage("タスクの保存中にエラーが発生しました。");
      } else {
        setErrorMessage("予期せぬエラーが発生しました。");
      }
    }
  };
  const handleReflectSchedule = () => {
    const generatedSchedule = handleScheduleReflection(tasks);
    
    const calendarEvents = generatedSchedule.map((item) => {
      const task = tasks.find(t => t.id === item.taskId);
      const startTime = moment(item.date).hour(9).toDate();
      const endTime = moment(startTime).add(item.hours, 'hours').toDate();
      
      return {
        title: task ? task.taskName : `Task ${item.taskId}`,
        start: startTime,
        end: endTime,
      };
    });

    setEvents(calendarEvents);
    console.log("Generated Calendar Events:", calendarEvents);
  };

  // ... (他の関数は変更なし)
  if (isLoading) {
    return <div>読み込み中...</div>;
  }
  return (
    <div>
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={sortedTasks.map(t => t.taskId)}
          strategy={verticalListSortingStrategy}
        >
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="border px-4 py-2">順序</th>
                <th className="border px-4 py-2">タスク名<button onClick={() => requestSort("taskName")}>▲▼</button></th>
                <th className="border px-4 py-2">所要時間<button onClick={() => requestSort("taskTime")}>▲▼</button></th>
                <th className="border px-4 py-2">優先度<button onClick={() => requestSort("taskPriority")}>▲▼</button></th>
                <th className="border px-4 py-2">アクション</th>
              </tr>
            </thead>
            <tbody>
              {sortedTasks.map((task, index) => (
                <SortableItem
                  key={task.taskId}
                  id={task.taskId}
                  task={task as Task}
                  index={index}
                  editingId={editingId}
                  editedTask={editedTask}
                  handleEdit={handleEdit}
                  handleSave={handleSave}
                  handleChange={handleChange}
                  handleDeleteTask={handleDeleteTask}
                />
              ))}
            </tbody>
          </table>
        </SortableContext>
      </DndContext>
      
      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <Button onClick={handleSaveAll} className="mt-6">全ての変更を保存</Button>
      <Button onClick={handleReflectSchedule} className="mt-6 ml-4">スケジュールに反映</Button>
      
      {events.length > 0 && (
        <div className="mt-4">
          <h3>生成されたスケジュール:</h3>
          <Schedule events={events} />
        </div>
      )}
    </div>
  );
};

export default TaskList;