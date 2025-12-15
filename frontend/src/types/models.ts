// Activity Model
export interface Activity {
  id: string;
  name: string;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

// Activity Permission Model
export interface ActivityPermission {
  id: string;
  activityId: string;
  permissionIds: string[];
  roleId: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Amavasya Model
export type Month = 
  | "January" | "February" | "March" | "April" 
  | "May" | "June" | "July" | "August" 
  | "September" | "October" | "November" | "December";

export interface Amavasya {
  id: string;
  month: Month;
  year: number;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Amavasya User Location Model
export interface AmavasyaUserLocation {
  id: string;
  amavasyaId: string;
  userId: string;
  locationId: string;
  note?: string;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Location Model
export interface Location {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Permission Model
export interface Permission {
  id: string;
  name: string;
  description?: string;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

// Role Model
export interface Role {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  isSystemLogin: boolean;
  createdAt: string;
  updatedAt: string;
}

// User Model
export interface User {
  id: string;
  userName: string;
  email: string;
  password?: string;
  mobileNumber?: string;
  roleId: string;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Form Types
export interface ActivityFormData {
  name: string;
  status: "Active" | "Inactive";
}

export interface LocationFormData {
  name: string;
  description?: string;
  isActive: boolean;
}

export interface PermissionFormData {
  name: string;
  description?: string;
  status: "Active" | "Inactive";
}

export interface RoleFormData {
  name: string;
  description?: string;
  isActive: boolean;
  isSystemLogin: boolean;
}

export interface UserFormData {
  userName: string;
  email: string;
  password?: string;
  mobileNumber?: string;
  roleId: string;
  isActive: boolean;
}
