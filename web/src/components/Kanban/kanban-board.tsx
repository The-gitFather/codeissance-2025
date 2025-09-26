'use client';

import { useState } from 'react';
import { useKanbanStore } from '@/lib/store';
import { TaskCard } from '@/components/Kanban/task-card';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  useDroppable,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  AnimateLayoutChanges,
  defaultAnimateLayoutChanges,
} from '@dnd-kit/sortable';
import { Column, Status, Task } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TaskForm } from '@/components/Kanban/task-form';
import { cn } from '@/lib/utils';

const columns: Column[] = [
  { id: 'todo', title: 'To Do', tasks: [] },
  { id: 'in-progress', title: 'In Progress', tasks: [] },
  { id: 'completed', title: 'Completed', tasks: [] },
];

const animateLayoutChanges: AnimateLayoutChanges = (args) => {
  const { isSorting, wasSorting } = args as any;

  if (isSorting || wasSorting) {
    return defaultAnimateLayoutChanges(args);
  }

  return true;
};

const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

export function KanbanBoard() {
  const [search, setSearch] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  const { moveTask, reorderTasks } = useKanbanStore();
  const tasks = useKanbanStore(state => state.tasks);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100, // Reduced delay for snappier touch response
        tolerance: 5,
      },
    })
  );

  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.category.toLowerCase().includes(search.toLowerCase()) ||
      task.priority.toLowerCase().includes(search.toLowerCase())
  );

  const getColumnTasks = (columnId: Status) =>
    filteredTasks.filter((task) => task.status === columnId);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
      document.body.style.cursor = 'grabbing';
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeTask = tasks.find((t) => t.id === activeId);
    const overTask = tasks.find((t) => t.id === overId);

    if (!activeTask) return;

    // Update active column for visual feedback
    const overColumn = columns.find((col) => col.id === overId);
    if (overColumn) {
      setActiveColumn(overColumn.id);
    }

    // If dropping over a task
    if (overTask) {
      const activeIndex = tasks.findIndex((t) => t.id === activeId);
      const overIndex = tasks.findIndex((t) => t.id === overId);

      if (activeTask.status !== overTask.status) {
        // Move to new column at specific position
        moveTask(activeId, overTask.status, overIndex);
      } else {
        // Reorder within same column
        reorderTasks(arrayMove(tasks, activeIndex, overIndex));
      }
    } else {
      // If dropping over a column
      const newStatus = overId as Status;
      if (activeTask.status !== newStatus) {
        moveTask(activeId, newStatus);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    setActiveColumn(null);
    document.body.style.cursor = '';

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Handle drop over column
    if (columns.find((col) => col.id === overId)) {
      const newStatus = overId as Status;
      if (activeTask.status !== newStatus) {
        moveTask(activeId, newStatus);
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto ">
      <div className="flex justify-between items-center mb-8">
  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
    Student Task Board
  </h1>
  <div className="flex items-center rounded-full overflow-hidden bg-white shadow-md w-auto max-w-md">
    {/* Search Input */}
    <div className="relative flex-grow flex items-center pl-3">
      <Search className="text-gray-400 w-5 h-5 min-w-5" />
      <input
        type="text"
        placeholder="Search tasks..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-3 focus:outline-none text-gray-600 bg-transparent placeholder-gray-400"
      />
    </div>
    {/* Add Task Button (Plus sign only) */}
    <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
      <DialogTrigger asChild>
        <button className="bg-blue-600 hover:bg-blue-700 text-white p-3 h-full min-w-[70px] rounded-[25px] flex items-center justify-center">
          <Plus className="w-6 h-6" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[600px] w-full">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        <TaskForm onClose={() => setIsAddingTask(false)} />
      </DialogContent>
    </Dialog>
  </div>
</div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((column) => (
            <DroppableColumn
              key={column.id}
              column={column}
              isActive={activeColumn === column.id}
               
            >
              {getColumnTasks(column.id).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={() => { }}
                  onDelete={() => { }}
                  isOverlay={activeTask?.id === task.id}
                />
              ))}
            </DroppableColumn>
          ))}
        </div>
      </DndContext>
    </div>
  );
}

interface DroppableColumnProps {
  column: Column;
  children: React.ReactNode;
  isActive?: boolean;
}

function DroppableColumn({ column, children, isActive }: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "bg-blue-50 rounded-xl p-4 min-h-[200px] transition-all duration-200 ease-in-out shadow-md hover:shadow-md",
        isActive && "ring-2 ring-blue-400 ring-opacity-50 bg-blue-100 scale-[1.02]"
      )}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-blue-700">
          {column.title}
        </h2>
        <span className="bg-blue-200 px-3 py-1 rounded-full text-sm text-blue-700 transition-all duration-200">
          {Array.isArray(children) ? children.length : 0}
        </span>
      </div>
      <SortableContext
        items={Array.isArray(children) ? children.map((child: any) => child.props.task.id) : []}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3 transition-all duration-200">
          {children}
        </div>
      </SortableContext>
    </div>
  );
}