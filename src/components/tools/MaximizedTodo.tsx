import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import TodoList from './TodoList';
import LockedToolContent from './LockedToolContent';

interface MaximizedTodoProps {
  user: ReturnType<typeof useAuth>['user'];
  initialEditingTaskId?: string | null;
}

const MaximizedTodo: React.FC<MaximizedTodoProps> = ({ user, initialEditingTaskId }) => {
  if (!user) {
    return <LockedToolContent />;
  }

  return <TodoList userId={user.id} initialEditingTaskId={initialEditingTaskId} />;
};

export default MaximizedTodo;
