import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { MultiSelect } from "@/components/ui/multi-select";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { mockActivityPermissions, mockActivities, mockRoles, mockPermissions } from "@/data/mockData";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";

interface FormData {
  activityId: string;
  roleId: string;
  permissionIds: string[];
}

export default function ActivityPermissionForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<FormData>({
    activityId: "",
    roleId: "",
    permissionIds: [],
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activityOptions = mockActivities.map((a) => ({
    value: a.id,
    label: a.name,
  }));

  const roleOptions = mockRoles.map((r) => ({
    value: r.id,
    label: r.name,
  }));

  const permissionOptions = mockPermissions.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  useEffect(() => {
    if (isEdit && id) {
      const permission = mockActivityPermissions.find((p) => p.id === id);
      if (permission) {
        setFormData({
          activityId: permission.activityId,
          roleId: permission.roleId,
          permissionIds: permission.permissionIds,
        });
      }
    }
  }, [id, isEdit]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.activityId) {
      newErrors.activityId = "Activity is required";
    }

    if (!formData.roleId) {
      newErrors.roleId = "Role is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    toast.success(
      isEdit ? "Activity permission updated successfully" : "Activity permission created successfully"
    );
    navigate("/activity-permissions");
  };

  return (
    <div className="page-enter">
      <PageHeader
        title={isEdit ? "Edit Activity Permission" : "Create Activity Permission"}
        description={isEdit ? "Update activity permission mapping" : "Create a new activity permission mapping"}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Activity Permissions", href: "/activity-permissions" },
          { label: isEdit ? "Edit" : "Create" },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate("/activity-permissions")}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <GlassCard variant="elevated" className="max-w-2xl">
        <GlassCardHeader>
          <GlassCardTitle>Permission Mapping</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <SearchableSelect
              label="Activity"
              options={activityOptions}
              value={formData.activityId}
              onChange={(value) => setFormData({ ...formData, activityId: value })}
              error={errors.activityId}
            />

            <SearchableSelect
              label="Role"
              options={roleOptions}
              value={formData.roleId}
              onChange={(value) => setFormData({ ...formData, roleId: value })}
              error={errors.roleId}
            />

            <MultiSelect
              label="Permissions"
              options={permissionOptions}
              value={formData.permissionIds}
              onChange={(value) => setFormData({ ...formData, permissionIds: value })}
              placeholder="Select permissions..."
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate("/activity-permissions")}>
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                <Save className="h-4 w-4" />
                {isEdit ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
