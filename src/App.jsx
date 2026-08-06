import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import metallicTheme from './styles/metallicTheme';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Branches from './pages/Branches';
import Users from './pages/Users';
import NewRequest from './pages/NewRequest';
import Requests from './pages/Requests';
import Approvals from './pages/Approvals';
import Deliveries from './pages/Deliveries';
import Verification from './pages/Verification';
import Monitor from './pages/Monitor';
import AuditLogs from './pages/AuditLogs';
import Reports from './pages/Reports';

function App() {
  return (
    <ThemeProvider theme={metallicTheme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Protected Application Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/branches" element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                  <Route path="" element={<Branches />} />
                </Route>
                <Route path="/users" element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                  <Route path="" element={<Users />} />
                </Route>
                <Route path="/requests/new" element={<ProtectedRoute allowedRoles={['ADMIN', 'BRANCH_REQUESTER']} />}>
                  <Route path="" element={<NewRequest />} />
                </Route>
                <Route path="/requests" element={<Requests />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/approvals" element={<ProtectedRoute allowedRoles={['ADMIN', 'APPROVER']} />}>
                  <Route path="" element={<Approvals />} />
                </Route>
                <Route path="/deliveries" element={<ProtectedRoute allowedRoles={['ADMIN', 'AGENCY']} />}>
                  <Route path="" element={<Deliveries />} />
                </Route>
                <Route path="/verification" element={<ProtectedRoute allowedRoles={['ADMIN', 'BRANCH_REQUESTER']} />}>
                  <Route path="" element={<Verification />} />
                </Route>
                <Route path="/monitor" element={<ProtectedRoute allowedRoles={['ADMIN', 'MONITOR']} />}>
                  <Route path="" element={<Monitor />} />
                </Route>
                <Route path="/audit-logs" element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                  <Route path="" element={<AuditLogs />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
