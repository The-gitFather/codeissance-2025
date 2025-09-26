'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Clock, Calendar, MoreVertical } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  isOverlay?: boolean;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

const categoryColors = {
  Homework: 'bg-blue-100 text-blue-800',
  Study: 'bg-purple-100 text-purple-800',
  Projects: 'bg-indigo-100 text-indigo-800',
  Personal: 'bg-pink-100 text-pink-800',
};

export function TaskCard({ task, onEdit, onDelete, isOverlay }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    animateLayoutChanges: () => true,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'bg-white rounded-xl p-4 shadow-sm border border-gray-100',
        'hover:shadow-md hover:scale-[1.02] cursor-grab active:cursor-grabbing',
        'transform transition-all duration-200 ease-in-out',
        isDragging && 'rotate-2 scale-105 shadow-lg',
        isOverlay && 'opacity-50',
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-900">{task.title}</h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {task.description && (
        <p className="text-sm text-gray-600 mb-3">{task.description}</p>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        <span className={cn('px-2 py-1 rounded-full text-xs font-medium', priorityColors[task.priority])}>
          {task.priority}
        </span>
        <span className={cn('px-2 py-1 rounded-full text-xs font-medium', categoryColors[task.category])}>
          {task.category}
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>{format(new Date(task.dueDate), 'MMM d')}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{task.timeEstimate}</span>
        </div>
      </div>
    </div>
  );
}