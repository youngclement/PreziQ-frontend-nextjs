import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { API_URL, ACCESS_TOKEN } from '@/api/http';
import { Permission } from '../data/schema';

type DialogType = 'add' | 'edit' | 'delete' | null;

interface ModuleResponse {
  code: number;
  message: string;
  data: string[];
}

interface PermissionsContextType {
  open: DialogType;
  setOpen: (type: DialogType) => void;
  currentRow: Permission | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<Permission | null>>;
  permissions: Permission[];
  modules: string[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface PermissionContextState {
  permissions: {
    id: string;
    name: string;
    apiPath: string;
    httpMethod: string;
    module: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
  // ... rest of the interface
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(
  undefined,
);

export function PermissionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState<DialogType>(null);
  const [currentRow, setCurrentRow] = useState<Permission | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch modules
      const modulesResponse = await fetch(`${API_URL}/permissions/modules`, {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      });
      const modulesData: ModuleResponse = await modulesResponse.json();

      // Fetch permissions
      const permissionsResponse = await fetch(
        `${API_URL}/permissions?page=1&size=100`,
        {
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
          },
        },
      );
      const permissionsData = await permissionsResponse.json();

      if (modulesData.data) {
        setModules(modulesData.data);
      }

      if (permissionsData.data?.content) {
        const permissions = permissionsData.data.content.map(
          (permission: any) => ({
            ...permission,
            httpMethod: permission.httpMethod,
            createdAt: new Date(permission.createdAt),
            updatedAt: new Date(permission.updatedAt),
          }),
        );
        setPermissions(permissions);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Có lỗi xảy ra khi tải dữ liệu';
      setError(message);
      toast({
        variant: 'destructive',
        title: 'Có lỗi xảy ra',
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <PermissionsContext.Provider
      value={{
        open,
        setOpen,
        currentRow,
        setCurrentRow,
        permissions,
        modules,
        isLoading,
        error,
        refetch: fetchData,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionsProvider');
  }
  return context;
}
