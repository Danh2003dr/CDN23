import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission: string;
  fallback?: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  children, 
  permission, 
  fallback = null 
}) => {
  const { user } = useAuth();

  if (!user || !user.permissions) {
    return <>{fallback}</>;
  }

  const hasPermission = user.permissions[permission] === true;

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGuard; 