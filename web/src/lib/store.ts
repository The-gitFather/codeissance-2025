'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, Status, Priority, Category } from '@/types';

interface KanbanStore {
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, newStatus: Status, index?: number) => void;
  reorderTasks: (newTasks: Task[]) => void;
}

const initialTasks: Task[] = [
  { id: '1', title: 'Math Homework', description: 'Complete algebra problems from chapter 5.', dueDate: '2024-03-01', priority: 'high', category: 'Homework', timeEstimate: '2h', status: 'todo' },
  { id: '2', title: 'Study for Science Test', description: 'Review notes and practice quizzes.', dueDate: '2024-03-05', priority: 'medium', category: 'Study', timeEstimate: '3h', status: 'in-progress' },
  { id: '3', title: 'Project Proposal', description: 'Draft an outline for the upcoming project.', dueDate: '2024-03-03', priority: 'high', category: 'Projects', timeEstimate: '4h', status: 'todo' },
  { id: '4', title: 'Read Novel', description: 'Finish reading the assigned chapters.', dueDate: '2024-03-07', priority: 'low', category: 'Personal', timeEstimate: '2h', status: 'in-progress' },
  { id: '5', title: 'Coding Assignment', description: 'Implement a sorting algorithm.', dueDate: '2024-03-10', priority: 'high', category: 'Projects', timeEstimate: '5h', status: 'completed' },
  { id: '6', title: 'Revise Notes', description: 'Summarize key points from last lecture.', dueDate: '2024-03-06', priority: 'medium', category: 'Study', timeEstimate: '3h', status: 'todo' },
  { id: '7', title: 'Exercise Routine', description: 'Complete a 30-minute workout session.', dueDate: '2024-03-04', priority: 'low', category: 'Personal', timeEstimate: '1h', status: 'todo' },
  { id: '8', title: 'Group Project Discussion', description: 'Meet with teammates to finalize ideas.', dueDate: '2024-03-08', priority: 'high', category: 'Projects', timeEstimate: '2h', status: 'in-progress' },
];

export const useKanbanStore = create<KanbanStore>()(
  persist(
    (set) => ({
      tasks: initialTasks,
      addTask: (task) =>
        set((state) => ({ tasks: [...state.tasks, task] })),
      updateTask: (taskId, updates) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId ? { ...task, ...updates } : task
          ),
        })),
      deleteTask: (taskId) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== taskId),
        })),
      moveTask: (taskId, newStatus, index) =>
        set((state) => {
          const task = state.tasks.find((t) => t.id === taskId);
          if (!task) return state;

          const otherTasks = state.tasks.filter((t) => t.id !== taskId);
          const updatedTask = { ...task, status: newStatus };

          if (typeof index === 'number') {
            const newTasks = [...otherTasks];
            newTasks.splice(index, 0, updatedTask);
            return { tasks: newTasks };
          }

          return { tasks: [...otherTasks, updatedTask] };
        }),
      reorderTasks: (newTasks) =>
        set(() => ({ tasks: newTasks })),
    }),
    {
      name: 'kanban-store',
    }
  )
);
