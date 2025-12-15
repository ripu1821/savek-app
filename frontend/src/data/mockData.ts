import { Activity, Permission, Role, User, Location, Amavasya, ActivityPermission, AmavasyaUserLocation } from "@/types/models";

export const mockActivities: Activity[] = [
  {
    id: "1",
    name: "User Management",
    status: "Active",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    name: "Report Generation",
    status: "Active",
    createdAt: "2024-01-16T14:20:00Z",
    updatedAt: "2024-01-16T14:20:00Z",
  },
  {
    id: "3",
    name: "Data Export",
    status: "Inactive",
    createdAt: "2024-01-17T09:15:00Z",
    updatedAt: "2024-01-20T11:45:00Z",
  },
  {
    id: "4",
    name: "Dashboard Analytics",
    status: "Active",
    createdAt: "2024-01-18T16:00:00Z",
    updatedAt: "2024-01-18T16:00:00Z",
  },
  {
    id: "5",
    name: "Notification System",
    status: "Active",
    createdAt: "2024-01-19T11:30:00Z",
    updatedAt: "2024-01-19T11:30:00Z",
  },
];

export const mockPermissions: Permission[] = [
  { id: "1", name: "Create User", description: "Ability to create new users", status: "Active", createdAt: "2024-01-10T10:00:00Z", updatedAt: "2024-01-10T10:00:00Z" },
  { id: "2", name: "Edit User", description: "Ability to edit existing users", status: "Active", createdAt: "2024-01-10T10:00:00Z", updatedAt: "2024-01-10T10:00:00Z" },
  { id: "3", name: "Delete User", description: "Ability to delete users", status: "Active", createdAt: "2024-01-10T10:00:00Z", updatedAt: "2024-01-10T10:00:00Z" },
  { id: "4", name: "View Reports", description: "Access to view reports", status: "Active", createdAt: "2024-01-10T10:00:00Z", updatedAt: "2024-01-10T10:00:00Z" },
  { id: "5", name: "Export Data", description: "Ability to export data", status: "Inactive", createdAt: "2024-01-10T10:00:00Z", updatedAt: "2024-01-10T10:00:00Z" },
];

export const mockRoles: Role[] = [
  { id: "1", name: "Super Admin", description: "Full system access", isActive: true, isSystemLogin: true, createdAt: "2024-01-05T10:00:00Z", updatedAt: "2024-01-05T10:00:00Z" },
  { id: "2", name: "Admin", description: "Administrative access", isActive: true, isSystemLogin: true, createdAt: "2024-01-05T10:00:00Z", updatedAt: "2024-01-05T10:00:00Z" },
  { id: "3", name: "Manager", description: "Management level access", isActive: true, isSystemLogin: false, createdAt: "2024-01-05T10:00:00Z", updatedAt: "2024-01-05T10:00:00Z" },
  { id: "4", name: "User", description: "Standard user access", isActive: true, isSystemLogin: false, createdAt: "2024-01-05T10:00:00Z", updatedAt: "2024-01-05T10:00:00Z" },
];

export const mockUsers: User[] = [
  { id: "1", userName: "John Doe", email: "john@example.com", mobileNumber: "+1234567890", roleId: "1", isActive: true, createdAt: "2024-01-01T10:00:00Z", updatedAt: "2024-01-01T10:00:00Z" },
  { id: "2", userName: "Jane Smith", email: "jane@example.com", mobileNumber: "+1234567891", roleId: "2", isActive: true, createdAt: "2024-01-02T10:00:00Z", updatedAt: "2024-01-02T10:00:00Z" },
  { id: "3", userName: "Bob Wilson", email: "bob@example.com", mobileNumber: "+1234567892", roleId: "3", isActive: true, createdAt: "2024-01-03T10:00:00Z", updatedAt: "2024-01-03T10:00:00Z" },
  { id: "4", userName: "Alice Brown", email: "alice@example.com", mobileNumber: "+1234567893", roleId: "4", isActive: false, createdAt: "2024-01-04T10:00:00Z", updatedAt: "2024-01-04T10:00:00Z" },
];

export const mockLocations: Location[] = [
  { id: "1", name: "Main Temple", description: "Primary worship location", isActive: true, createdAt: "2024-01-01T10:00:00Z", updatedAt: "2024-01-01T10:00:00Z" },
  { id: "2", name: "Community Hall", description: "Gatherings and events", isActive: true, createdAt: "2024-01-02T10:00:00Z", updatedAt: "2024-01-02T10:00:00Z" },
  { id: "3", name: "Garden Area", description: "Outdoor ceremonies", isActive: true, createdAt: "2024-01-03T10:00:00Z", updatedAt: "2024-01-03T10:00:00Z" },
];

export const mockAmavasya: Amavasya[] = [
  { id: "1", month: "January", year: 2024, startDate: "2024-01-11", endDate: "2024-01-11", startTime: "06:00", endTime: "18:00", isActive: true, createdAt: "2024-01-01T10:00:00Z", updatedAt: "2024-01-01T10:00:00Z" },
  { id: "2", month: "February", year: 2024, startDate: "2024-02-09", endDate: "2024-02-09", startTime: "06:00", endTime: "18:00", isActive: true, createdAt: "2024-01-01T10:00:00Z", updatedAt: "2024-01-01T10:00:00Z" },
  { id: "3", month: "March", year: 2024, startDate: "2024-03-10", endDate: "2024-03-10", startTime: "06:00", endTime: "18:00", isActive: false, createdAt: "2024-01-01T10:00:00Z", updatedAt: "2024-01-01T10:00:00Z" },
];

export const mockActivityPermissions: ActivityPermission[] = [
  { id: "1", activityId: "1", permissionIds: ["1", "2", "3"], roleId: "1", createdAt: "2024-01-15T10:00:00Z", updatedAt: "2024-01-15T10:00:00Z" },
  { id: "2", activityId: "2", permissionIds: ["4"], roleId: "2", createdAt: "2024-01-16T10:00:00Z", updatedAt: "2024-01-16T10:00:00Z" },
];

export const mockAmavasyaUserLocations: AmavasyaUserLocation[] = [
  { id: "1", amavasyaId: "1", userId: "1", locationId: "1", note: "Morning duty", isActive: true, createdAt: "2024-01-15T10:00:00Z", updatedAt: "2024-01-15T10:00:00Z" },
  { id: "2", amavasyaId: "1", userId: "2", locationId: "2", note: "Evening duty", isActive: true, createdAt: "2024-01-15T10:00:00Z", updatedAt: "2024-01-15T10:00:00Z" },
];
