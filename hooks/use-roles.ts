"use client";

import { useAuth } from "@/contexts/auth-context";
import { Role } from "@/models/auth";

interface UseRolesReturn {
  userRoles: Role[];
  hasRole: (roleName: string) => boolean;
  isAdmin: boolean;
  isUser: boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
  hasAllRoles: (roleNames: string[]) => boolean;
}

/**
 * Hook to easily check user roles and permissions
 */
export function useRoles(): UseRolesReturn {
  const { user, hasRole } = useAuth();

  const userRoles = user?.rolesSecured || [];

  // Common role checks
  const isAdmin = hasRole("ADMIN");
  const isUser = hasRole("USER");

  // Check if user has any of the specified roles
  const hasAnyRole = (roleNames: string[]) => {
    return roleNames.some((role) => hasRole(role));
  };

  // Check if user has all of the specified roles
  const hasAllRoles = (roleNames: string[]) => {
    return roleNames.every((role) => hasRole(role));
  };

  return {
    userRoles,
    hasRole,
    isAdmin,
    isUser,
    hasAnyRole,
    hasAllRoles,
  };
}
