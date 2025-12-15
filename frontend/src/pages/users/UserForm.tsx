// src/pages/UserForm.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { toast } from "sonner";
import { Save, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { UserFormData } from "@/types/models";

type RoleOption = { value: string; label: string };

// defensive helpers
function extractPayload(resp: any) {
  const d = resp?.data?.data ?? resp?.data;
  if (!d) return null;
  if (Array.isArray(d.items)) return d.items.length ? d.items[0] : null;
  if (Array.isArray(d)) return d.length ? d[0] : null;
  return d;
}

function extractArray(resp: any) {
  const d = resp?.data?.data ?? resp?.data;
  if (!d) {
    if (Array.isArray(resp?.data)) return resp.data;
    return [];
  }
  if (Array.isArray(d.items)) return d.items;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d.data)) return d.data;
  return [];
}

function mapServerErrors(serverData: any): Partial<Record<keyof UserFormData, string>> {
  const out: Partial<Record<keyof UserFormData, string>> = {};
  if (!serverData) return out;
  const maybe = serverData.errors ?? serverData;
  if (typeof maybe !== "object") return out;
  for (const k of Object.keys(maybe)) {
    const v = maybe[k];
    if (Array.isArray(v)) out[k as keyof UserFormData] = v.join(" ");
    else if (typeof v === "string") out[k as keyof UserFormData] = v;
    else if (v && typeof v.message === "string") out[k as keyof UserFormData] = v.message;
  }
  return out;
}

export default function UserForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<UserFormData>({
    userName: "",
    email: "",
    password: "",
    mobileNumber: "",
    roleId: "",
    isActive: true,
  });

  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // password strength helper
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "" };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    const labels = ["", "Weak", "Fair", "Good", "Strong"];
    return { strength, label: labels[strength] };
  };

  const passwordStrength = getPasswordStrength(formData.password || "");

  // load roles for the select
  const loadRoles = useCallback(async () => {
    try {
      // Try '/getrole' first (per request), fallback to '/role'
      let resp;
      try {
        resp = await api.get("/role", { params: { limit: 1000 } });
      } catch (err) {
        resp = await api.get("/role", { params: { limit: 1000 } });
      }

      const items = extractArray(resp);
      // Normalize: value MUST be the role id (id or _id)
      const normalized = items.map((r: any) => {
        const rid = String(r.id ?? r._id ?? r.roleId ?? r._id ?? "");
        const label = r.name ?? r.roleName ?? r.label ?? rid;
        return { value: rid, label };
      }).filter((o: RoleOption) => !!o.value);

      setRoleOptions(normalized);
    } catch (err) {
      console.warn("Failed to load roles", err);
      setRoleOptions([]);
    }
  }, []);

  // load user when editing
  const loadUser = useCallback(async (userId: string) => {
    if (!userId) return;
    setLoading(true);
    setGeneralError(null);
    try {
      const resp = await api.get(`/user/${userId}`);
      const payload = extractPayload(resp) ?? resp?.data ?? null;
      if (!payload) {
        setGeneralError("User not found");
        return;
      }

      // extract role id from different shapes:
      // roleId could be a string, or a populated object ({ id/_id, name })
      let extractedRoleId = "";
      if (payload.roleId) {
        if (typeof payload.roleId === "string") {
          extractedRoleId = payload.roleId;
        } else if (typeof payload.roleId === "object") {
          extractedRoleId = String(payload.roleId.id ?? payload.roleId._id ?? "");
        }
      } else if (payload.role) {
        if (typeof payload.role === "string") {
          extractedRoleId = payload.role;
        } else if (typeof payload.role === "object") {
          extractedRoleId = String(payload.role.id ?? payload.role._id ?? "");
        }
      }

      setFormData({
        userName: payload.userName ?? payload.name ?? "",
        email: payload.email ?? "",
        password: "", // blank by default for edit
        mobileNumber: payload.mobileNumber ?? payload.phone ?? payload.mobile ?? "",
        roleId: extractedRoleId || "",
        isActive: typeof payload.isActive === "boolean" ? payload.isActive : Boolean(payload.active),
      });
    } catch (err: any) {
      console.error("Failed to load user", err);
      setGeneralError(err?.response?.data?.message ?? err?.message ?? "Failed to load user");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
    if (isEdit && id) loadUser(id);
  }, [isEdit, id, loadRoles, loadUser]);

  // client-side validation
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof UserFormData, string>> = {};

    if (!formData.userName.trim()) newErrors.userName = "Username is required";

    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format";

    if (!isEdit && !formData.password) newErrors.password = "Password is required";
    else if (formData.password && formData.password.length > 0 && formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";

    if (!formData.roleId) newErrors.roleId = "Role is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setErrors({});

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: any = {
        userName: formData.userName.trim(),
        email: formData.email.trim(),
        mobileNumber: formData.mobileNumber?.trim() || null,
        roleId: formData.roleId, // <-- will be role id (string)
        isActive: formData.isActive,
      };

      // include password only if provided
      if (formData.password && formData.password.length > 0) {
        payload.password = formData.password;
      }

      if (isEdit && id) {
        await api.put(`/user/${id}`, payload);
        toast.success("User updated successfully");
      } else {
        await api.post("/user", payload);
        toast.success("User created successfully");
      }

      navigate("/users");
    } catch (err: any) {
      console.error("Save error", err);
      const serverData = err?.response?.data ?? null;
      if (serverData) {
        const fieldErrors = mapServerErrors(serverData);
        if (Object.keys(fieldErrors).length) setErrors((p) => ({ ...p, ...fieldErrors }));
        setGeneralError(serverData?.message ?? serverData?.error ?? err?.message ?? "Failed to save user");
      } else {
        setGeneralError(err?.message ?? "Failed to save user");
      }
      toast.error(serverData?.message ?? err?.message ?? "Failed to save user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-enter">
      <PageHeader
        title={isEdit ? "Edit User" : "Create User"}
        description={isEdit ? "Update user details" : "Add a new user to the system"}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Users", href: "/users" },
          { label: isEdit ? "Edit" : "Create" },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate("/users")}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <GlassCard variant="elevated" className="max-w-2xl">
        <GlassCardHeader>
          <GlassCardTitle>User Details</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading user...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {generalError && (
                <div className="rounded-md bg-destructive/10 p-2 text-destructive">{generalError}</div>
              )}

              <FloatingInput
                label="Username"
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                error={errors.userName}
              />

              <FloatingInput
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
              />

              {!isEdit && (
                <div className="space-y-2">
                  <div className="relative">
                    <FloatingInput
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password || ""}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      error={errors.password}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {formData.password && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={cn(
                              "h-1.5 flex-1 rounded-full transition-colors",
                              passwordStrength.strength >= level
                                ? level <= 1
                                  ? "bg-destructive"
                                  : level <= 2
                                  ? "bg-warning"
                                  : "bg-success"
                                : "bg-muted"
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Password strength: {passwordStrength.label}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {isEdit && (
                <div className="space-y-2">
                  <div className="relative">
                    <FloatingInput
                      label="New Password (leave blank to keep current)"
                      type={showPassword ? "text" : "password"}
                      value={formData.password || ""}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      error={errors.password}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {formData.password && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={cn(
                              "h-1.5 flex-1 rounded-full transition-colors",
                              passwordStrength.strength >= level
                                ? level <= 1
                                  ? "bg-destructive"
                                  : level <= 2
                                  ? "bg-warning"
                                  : "bg-success"
                                : "bg-muted"
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Password strength: {passwordStrength.label}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <FloatingInput
                label="Mobile Number"
                value={formData.mobileNumber || ""}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
              />

              <SearchableSelect
                label="Role"
                options={roleOptions}
                value={formData.roleId}
                onChange={(value) => setFormData({ ...formData, roleId: value })}
                error={errors.roleId}
              />

              <div className="flex items-center justify-between rounded-xl bg-muted/30 p-4">
                <div>
                  <Label htmlFor="isActive" className="font-medium">Active Status</Label>
                  <p className="text-sm text-muted-foreground">User can log in when active</p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: Boolean(checked) })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate("/users")} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmitting}>
                  <Save className="h-4 w-4" />
                  {isEdit ? "Update User" : "Create User"}
                </Button>
              </div>
            </form>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
