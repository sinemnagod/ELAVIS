import { createBrowserRouter } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PublicLayout } from "@/layouts/PublicLayout";

// Public Pages
import { Home } from "@/pages/public/Home";
import { Vehicles } from "@/pages/public/Vehicles";
import { VectorDetail } from "@/pages/public/VectorDetail";
import { CloudDetail } from "@/pages/public/CloudDetail";
import { BulletDetail } from "@/pages/public/BulletDetail";
import { Charging } from "@/pages/public/Charging";
import { Shop } from "@/pages/public/Shop";
import { Checkout } from "@/pages/public/Checkout";
import { Profile } from "@/pages/public/Profile";
import { TestDrive } from "@/pages/public/TestDrive";
import { Login } from "@/pages/public/Login";
import { Signup } from "@/pages/public/Signup";
import { AboutFaq } from "@/pages/public/AboutFaq";

// Dashboard Pages
import { DashboardOverview } from "@/pages/dashboard/DashboardOverview";
import { Stations } from "@/pages/dashboard/Stations";
import { VehiclesList } from "@/pages/dashboard/VehiclesList";
import { VehicleDetails } from "@/pages/dashboard/VehicleDetails";
import { ChargingDashboard } from "@/pages/dashboard/ChargingDashboard";
import { ChargingHistory } from "@/pages/dashboard/ChargingHistory";
import { ChargingSchedules } from "@/pages/dashboard/ChargingSchedules";
import { EnergyDashboard } from "@/pages/dashboard/EnergyDashboard";
import { NotificationsDashboard } from "@/pages/dashboard/NotificationsDashboard";
import { RewardsDashboard } from "@/pages/dashboard/RewardsDashboard";
import { SettingsDashboard } from "@/pages/dashboard/SettingsDashboard";

// Admin Pages
import { AdminOverview } from "@/pages/admin/AdminOverview";
import { AdminUsers } from "@/pages/admin/AdminUsers";
import { AdminVehicles } from "@/pages/admin/AdminVehicles";
import { AdminStations } from "@/pages/admin/AdminStations";
import { AdminOrders } from "@/pages/admin/AdminOrders";
import { AdminTestDrives } from "@/pages/admin/AdminTestDrives";
import { AdminAnalytics } from "@/pages/admin/AdminAnalytics";
import { AdminSettings } from "@/pages/admin/AdminSettings";
import { AdminSessions } from "@/pages/admin/AdminSessions";
import { AdminProducts } from "@/pages/admin/AdminProducts";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/signup",
    element: <Signup />
  },
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "vehicles", element: <Vehicles /> },
      { path: "vehicles/vector", element: <VectorDetail /> },
      { path: "vehicles/cloud", element: <CloudDetail /> },
      { path: "vehicles/bullet", element: <BulletDetail /> },
      { path: "charging", element: <Charging /> },
      { path: "shop", element: <Shop /> },
      { path: "checkout", element: <Checkout /> },
      { path: "profile", element: <Profile /> },
      { path: "test-drive", element: <TestDrive /> },
      { path: "about", element: <AboutFaq /> }
    ]
  },
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardOverview /> },
      { path: "vehicles", element: <VehiclesList /> },
      { path: "vehicles/:vehicleId", element: <VehicleDetails /> },
      { path: "charging", element: <ChargingDashboard /> },
      { path: "stations", element: <Stations /> },
      { path: "history", element: <ChargingHistory /> },
      { path: "schedules", element: <ChargingSchedules /> },
      { path: "energy", element: <EnergyDashboard /> },
      { path: "notifications", element: <NotificationsDashboard /> },
      { path: "rewards", element: <RewardsDashboard /> },
      { path: "settings", element: <SettingsDashboard /> }
    ]
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminOverview /> },
      { path: "users", element: <AdminUsers /> },
      { path: "vehicles", element: <AdminVehicles /> },
      { path: "stations", element: <AdminStations /> },
      { path: "sessions", element: <AdminSessions /> },
      { path: "products", element: <AdminProducts /> },
      { path: "orders", element: <AdminOrders /> },
      { path: "test-drives", element: <AdminTestDrives /> },
      { path: "analytics", element: <AdminAnalytics /> },
      { path: "settings", element: <AdminSettings /> }
    ]
  }
]);
