import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/hooks/use-theme";
import ProtectedRoute from "@/components/ProtectedRoute";
import EmployeeLayout from "@/components/layouts/EmployeeLayout";
import AdminLayout from "@/components/layouts/AdminLayout";

// Pages
import Auth from "./pages/Auth";
import RoleRedirect from "./pages/RoleRedirect";
import NotFound from "./pages/NotFound";

// Employee pages
import Courses from "./pages/employee/Courses";
import ChapterDetail from "./pages/employee/ChapterDetail";
import Simulation from "./pages/employee/Simulation";
import Reports from "./pages/employee/Reports";
import History from "./pages/employee/History";
import HistoryDetail from "./pages/employee/HistoryDetail";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminCourses from "./pages/admin/Courses";
import AdminMaterials from "./pages/admin/Materials";
import AdminEmployees from "./pages/admin/Employees";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="sales-training-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<Auth />} />

              {/* Role-based redirect */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <RoleRedirect />
                  </ProtectedRoute>
                }
              />

              {/* Employee routes */}
              <Route
                element={
                  <ProtectedRoute requiredRole="employee">
                    <EmployeeLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/courses" element={<Courses />} />
                <Route path="/courses/:chapterId" element={<ChapterDetail />} />
                <Route path="/simulation" element={<Simulation />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/history" element={<History />} />
                <Route path="/history/:sessionId" element={<HistoryDetail />} />
              </Route>

              {/* Admin routes */}
              <Route
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/courses" element={<AdminCourses />} />
                <Route path="/admin/materials" element={<AdminMaterials />} />
                <Route path="/admin/employees" element={<AdminEmployees />} />
                
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
