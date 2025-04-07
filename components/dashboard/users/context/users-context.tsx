'use client';

import React, { useState, useCallback } from 'react';
import useDialogState from '@/hooks/use-dialog-state';
import { User } from '../data/schema';
import { createContext, useContext } from 'react';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/api-client';

type UsersDialogType = 'invite' | 'add' | 'edit' | 'delete';

interface UsersContextType {
  users: User[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  createUser: (data: any) => Promise<void>;
  updateUser: (id: string, data: any) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  open: UsersDialogType | null;
  setOpen: (type: UsersDialogType | null) => void;
  currentRow: User | null;
  setCurrentRow: (user: User | null) => void;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

interface Props {
  children: React.ReactNode;
}

const UsersProvider = ({ children }: Props) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useDialogState<UsersDialogType>(null);
  const [currentRow, setCurrentRow] = useState<User | null>(null);

  // Fetch users với React Query
  const {
    data: users = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const response = await usersApi.getUsers();
        return response.data.data.content;
      } catch (error) {
        throw new Error('Không thể tải danh sách người dùng');
      }
    },
    staleTime: 5 * 60 * 1000, // Cache trong 5 phút
    gcTime: 30 * 60 * 1000, // Giữ cache 30 phút
  });

  // Mutation cho việc tạo user mới
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await usersApi.createUser(userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Thành công',
        description: 'Tạo người dùng thành công',
      });
      setOpen(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation cho việc cập nhật user
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await usersApi.updateUser(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Thành công',
        description: 'Cập nhật thông tin người dùng thành công',
      });
      setOpen(null);
      setCurrentRow(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation cho việc xóa user
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await usersApi.deleteUser(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Thành công',
        description: 'Xóa người dùng thành công',
      });
      setOpen(null);
      setCurrentRow(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const createUser = useCallback(
    async (data: any) => {
      await createUserMutation.mutateAsync(data);
    },
    [createUserMutation]
  );

  const updateUser = useCallback(
    async (id: string, data: any) => {
      await updateUserMutation.mutateAsync({ id, data });
    },
    [updateUserMutation]
  );

  const deleteUser = useCallback(
    async (id: string) => {
      await deleteUserMutation.mutateAsync(id);
    },
    [deleteUserMutation]
  );

  return (
    <UsersContext.Provider
      value={{
        users,
        isLoading,
        error: error as string | null,
        refetch,
        createUser,
        updateUser,
        deleteUser,
        open,
        setOpen,
        currentRow,
        setCurrentRow,
      }}
    >
      {children}
    </UsersContext.Provider>
  );
};

export { UsersProvider };

export function useUsers() {
  const context = useContext(UsersContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UsersProvider');
  }
  return context;
}
