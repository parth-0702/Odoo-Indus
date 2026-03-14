import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { startOutboxSyncLoop, wireOnlineEvents, processOutboxOnce } from '@/lib/sync';

import MainLayout from "@/components/layout/MainLayout";
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";

import DashboardPage from "@/pages/DashboardPage";
import ProductListPage from "@/pages/products/ProductListPage";
import CreateProductPage from "@/pages/products/CreateProductPage";
import ProductDetailPage from "@/pages/products/ProductDetailPage";
import WarehousesPage from "@/pages/WarehousesPage";
import ReceiptsPage from "@/pages/operations/ReceiptsPage";
import DeliveriesPage from "@/pages/operations/DeliveriesPage";
import TransfersPage from "@/pages/operations/TransfersPage";
import AdjustmentsPage from "@/pages/operations/AdjustmentsPage";
import MoveHistoryPage from "@/pages/MoveHistoryPage";
import ReportsPage from "@/pages/ReportsPage";
import SettingsPage from "@/pages/SettingsPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFound from "@/pages/NotFound";
import Index from "@/pages/Index";

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route element={<MainLayout />}>
        <Route index element={<Index />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/create" element={<CreateProductPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/products/:id/edit" element={<CreateProductPage />} />
        <Route path="/warehouses" element={<WarehousesPage />} />
        <Route path="/operations/receipts" element={<ReceiptsPage />} />
        <Route path="/operations/deliveries" element={<DeliveriesPage />} />
        <Route path="/operations/transfers" element={<TransfersPage />} />
        <Route path="/operations/adjustments" element={<AdjustmentsPage />} />
        <Route path="/history" element={<MoveHistoryPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  useEffect(() => {
    const stop = startOutboxSyncLoop();
    const unwire = wireOnlineEvents(() => {
      void processOutboxOnce();
    });
    return () => {
      stop();
      unwire();
    };
  }, []);

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppRoutes />
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
