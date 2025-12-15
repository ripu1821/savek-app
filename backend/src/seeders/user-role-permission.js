// src/seeders/user-role-permission.js
import bcrypt from "bcryptjs";
import Location from "../models/location.model.js";
import Role from "../models/role.model.js";
import Permission from "../models/permission.model.js";
import Activity from "../models/activity.model.js";
import ActivityPermission from "../models/activityPermission.model.js";
import User from "../models/user.model.js";

export async function up() {
  // 1) Locations
  
  const locationNames = [
    { name: "Mandir", description: "Temple duties location" },
    { name: "Dharamshala", description: "Guest house duties" },
    { name: "Bhojnalaya", description: "Food hall duties" },
  ];

  const createdLocations = [];
  for (const l of locationNames) {
    const existing = await Location.findOne({ name: l.name }).lean();
    if (existing) {
      createdLocations.push(existing);
      continue;
    }
    const doc = await Location.create({
      name: l.name,
      description: l.description,
      isActive: true,
    });
    createdLocations.push(doc);
  }

  // 2) Roles
  const roleNames = [
    { name: "Admin", description: "Full system access and management" },
    { name: "Sevak", description: "Limited access - field/operator user" },
  ];

  const createdRoles = [];
  for (const r of roleNames) {
    let doc = await Role.findOne({ name: r.name }).lean();
    if (!doc) {
      doc = await Role.create({
        name: r.name,
        description: r.description,
        isActive: true,
        isSystemLogin: true,
      });
    }
    createdRoles.push(doc);
  }

  // 3) Permissions
  const permissionNames = [
    "VIEW LIST",
    "VIEW DETAILS",
    "CREATE",
    "EDIT",
    "DELETE",
    "PRINT",
    "DOWNLOAD",
  ];

  const createdPermissions = [];
  for (const name of permissionNames) {
    let doc = await Permission.findOne({ name }).lean();
    if (!doc) {
      doc = await Permission.create({
        name,
        description: name,
        status: "Active",
      });
    }
    createdPermissions.push(doc);
  }

  // 4) Activities
  const activityNames = [
    "DASHBOARD",
    "TASKS",
    "USERS",
    "REPORTS",
    "ATTENDANCE",
    "LOCATIONS",
  ];

  const createdActivities = [];
  for (const name of activityNames) {
    let doc = await Activity.findOne({ name }).lean();
    if (!doc) {
      doc = await Activity.create({
        name,
        status: "Active",
      });
    }
    createdActivities.push(doc);
  }

  // convenience lookups
  const rolesByName = {};
  createdRoles.forEach((r) => (rolesByName[r.name] = r));
  const permsByName = {};
  createdPermissions.forEach((p) => (permsByName[p.name] = p));
  const acts = createdActivities;

  // 5) Admin full permissions - create ActivityPermission docs
  for (const activity of acts) {
    const exists = await ActivityPermission.findOne({
      activityId: activity.id,
      roleId: rolesByName["Admin"].id,
    }).lean();

    if (!exists) {
      await ActivityPermission.create({
        activityId: activity.id,
        permissionIds: createdPermissions.map((p) => p.id),
        roleId: rolesByName["Admin"].id,
      });
    }
  }

  // 6) Sevak limited permissions
  const sevakAllowed = [
    permsByName["VIEW LIST"]?.id,
    permsByName["VIEW DETAILS"]?.id,
    permsByName["CREATE"]?.id,
  ].filter(Boolean);

  for (const activity of acts) {
    const exists = await ActivityPermission.findOne({
      activityId: activity.id,
      roleId: rolesByName["Sevak"].id,
    }).lean();

    if (!exists) {
      await ActivityPermission.create({
        activityId: activity.id,
        permissionIds: sevakAllowed,
        roleId: rolesByName["Sevak"].id,
      });
    }
  }

  // 7) Default users
  const adminPassword = await bcrypt.hash("Admin@1234", 10);
  const sevakPassword = await bcrypt.hash("Sevak@1234", 10);

  // find mandir location id
  const mandir = createdLocations.find((x) => x.name === "Mandir");

  const defaultUsers = [
    {
      userName: "Admin User",
      email: "admin@example.com",
      roleId: rolesByName["Admin"].id,
      mobileNumber: "9999999999",
      password: adminPassword,
      isActive: true,
    },
    {
      userName: "Sevak User",
      email: "sevak@example.com",
      roleId: rolesByName["Sevak"].id,
      mobileNumber: "8888888888",
      password: sevakPassword,
      isActive: true,
    },
  ];

  for (const u of defaultUsers) {
    const exists = await User.findOne({ email: u.email }).lean();
    if (!exists) {
      await User.create(u);
    }
  }

  console.log("Seeder 001-initial-data: done.");
}
