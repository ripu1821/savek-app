import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";

// Pages
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

// Activities
import ActivitiesList from "./pages/activities/ActivitiesList";
import ActivityForm from "./pages/activities/ActivityForm";
import ActivityDetail from "./pages/activities/ActivityDetail";

// Activity Permissions
import ActivityPermissionsList from "./pages/activity-permissions/ActivityPermissionsList";
import ActivityPermissionForm from "./pages/activity-permissions/ActivityPermissionForm";

// Amavasya
import AmavasyaList from "./pages/amavasya/AmavasyaList";
import AmavasyaForm from "./pages/amavasya/AmavasyaForm";
import AmavasyaDetail from "./pages/amavasya/AmavasyaDetail";

// Amavasya User Locations
import AmavasyaUserLocationsList from "./pages/amavasya-user-locations/AmavasyaUserLocationsList";
import AmavasyaUserLocationForm from "./pages/amavasya-user-locations/AmavasyaUserLocationForm";
import AmavasyaUserLocationDetail from "./pages/amavasya-user-locations/AmavasyaUserLocationDetail";

// Locations
import LocationsList from "./pages/locations/LocationsList";
import LocationForm from "./pages/locations/LocationForm";

// Permissions
import PermissionsList from "./pages/permissions/PermissionsList";
import PermissionForm from "./pages/permissions/PermissionForm";

// Roles
import RolesList from "./pages/roles/RolesList";
import RoleForm from "./pages/roles/RoleForm";
import RoleDetail from "./pages/roles/RoleDetail";

// Users
import UsersList from "./pages/users/UsersList";
import UserForm from "./pages/users/UserForm";
import UserDetail from "./pages/users/UserDetail";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            
            {/* Activities */}
            <Route path="/activities" element={<ActivitiesList />} />
            <Route path="/activities/create" element={<ActivityForm />} />
            <Route path="/activities/:id" element={<ActivityDetail />} />
            <Route path="/activities/:id/edit" element={<ActivityForm />} />
            
            {/* Activity Permissions */}
            <Route path="/activity-permissions" element={<ActivityPermissionsList />} />
            <Route path="/activity-permissions/create" element={<ActivityPermissionForm />} />
            <Route path="/activity-permissions/:id/edit" element={<ActivityPermissionForm />} />
            
            {/* Amavasya */}
            <Route path="/amavasya" element={<AmavasyaList />} />
            <Route path="/amavasya/create" element={<AmavasyaForm />} />
            <Route path="/amavasya/:id" element={<AmavasyaDetail />} />
            <Route path="/amavasya/:id/edit" element={<AmavasyaForm />} />
            
            {/* Amavasya User Locations */}
            <Route path="/amavasyaUserLocation" element={<AmavasyaUserLocationsList />} />
            <Route path="/amavasyaUserLocation/create" element={<AmavasyaUserLocationForm />} />
            <Route path="/amavasyaUserLocation/:id/edit" element={<AmavasyaUserLocationForm />} />
            <Route path="/amavasyaUserLocation/:id" element={<AmavasyaUserLocationDetail />} />
            
            {/* Locations */}
            <Route path="/locations" element={<LocationsList />} />
            <Route path="/locations/create" element={<LocationForm />} />
            <Route path="/locations/:id/edit" element={<LocationForm />} />
            
            {/* Permissions */}
            <Route path="/permissions" element={<PermissionsList />} />
            <Route path="/permissions/create" element={<PermissionForm />} />
            <Route path="/permissions/:id/edit" element={<PermissionForm />} />
            
            {/* Roles */}
            <Route path="/roles" element={<RolesList />} />
            <Route path="/roles/create" element={<RoleForm />} />
            <Route path="/roles/:id" element={<RoleDetail />} />
            <Route path="/roles/:id/edit" element={<RoleForm />} />
            
            {/* Users */}
            <Route path="/users" element={<UsersList />} />
            <Route path="/users/create" element={<UserForm />} />
            <Route path="/users/:id" element={<UserDetail />} />
            <Route path="/users/:id/edit" element={<UserForm />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
