import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Edit, Trash2, Key, Shield } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { mockActivityPermissions, mockActivities, mockRoles, mockPermissions } from "@/data/mockData";
import { ActivityPermission } from "@/types/models";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function ActivityPermissionsList() {
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState(mockActivityPermissions);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = () => {
    if (deleteId) {
      setPermissions((prev) => prev.filter((p) => p.id !== deleteId));
      toast.success("Activity permission deleted successfully");
      setDeleteId(null);
    }
  };

  const getActivityName = (activityId: string) => {
    return mockActivities.find((a) => a.id === activityId)?.name || "Unknown";
  };

  const getRoleName = (roleId: string) => {
    return mockRoles.find((r) => r.id === roleId)?.name || "Unknown";
  };

  const columns: Column<ActivityPermission>[] = [
    {
      key: "activityId",
      header: "Activity",
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-primary-foreground">
            <Key className="h-5 w-5" />
          </div>
          <span className="font-medium">{getActivityName(item.activityId)}</span>
        </div>
      ),
    },
    {
      key: "roleId",
      header: "Role",
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span>{getRoleName(item.roleId)}</span>
        </div>
      ),
    },
    {
      key: "permissionIds",
      header: "Permissions",
      render: (item) => (
        <StatusBadge variant="primary" showDot={false}>
          {item.permissionIds.length} permission{item.permissionIds.length !== 1 ? "s" : ""}
        </StatusBadge>
      ),
    },
    {
      key: "createdAt",
      header: "Created At",
      sortable: true,
      render: (item) => (
        <span className="text-muted-foreground">
          {new Date(item.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "w-32",
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/activity-permissions/${item.id}`);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/activity-permissions/${item.id}/edit`);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteId(item.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-enter">
      <PageHeader
        title="Activity Permissions"
        description="Manage activity-role-permission mappings"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Activity Permissions" },
        ]}
        actions={
          <Button onClick={() => navigate("/activity-permissions/create")}>
            <Plus className="h-4 w-4" />
            Add Permission
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={permissions}
        searchPlaceholder="Search activity permissions..."
        onRowClick={(item) => navigate(`/activity-permissions/${item.id}`)}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Activity Permission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this activity permission? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
