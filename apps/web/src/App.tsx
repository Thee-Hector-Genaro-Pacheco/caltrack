import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import InstrumentsList from './pages/instruments-list';
import InstrumentNew from './pages/instrument-new';
import InstrumentDetails from './pages/instrument-details';
import InstrumentEdit from './pages/instrument-edit';
import AuditTrail from './pages/audit-trail';
import ProcessAreas from './pages/process-areas';
import ControlLoops from './pages/control-loops';
import LoopDetails from './pages/loop-details';
import WorkOrders from './pages/work-orders';
import Approvals from './pages/approvals';
import ReferenceStandards from './pages/reference-standards';
import DocumentationLibrary from './pages/documentation-library';
import DocumentationUpload from './pages/documentation-upload';
import DocumentationDetails from './pages/documentation-details';
import AppLayout from './layouts/AppLayout';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/process-areas" element={<ProcessAreas />} />
                    <Route path="/control-loops" element={<ControlLoops />} />
                    <Route path="/control-loops/:id" element={<LoopDetails />} />
                    <Route path="/work-orders" element={<WorkOrders />} />
                    
                    <Route
                      path="/approvals"
                      element={
                        <ProtectedRoute allowedRoles={['QA_REVIEWER']}>
                          <Approvals />
                        </ProtectedRoute>
                      }
                    />
                    
                    <Route
                      path="/reference-standards"
                      element={
                        <ProtectedRoute allowedRoles={['METROLOGY_MANAGER']}>
                          <ReferenceStandards />
                        </ProtectedRoute>
                      }
                    />
                    
                    <Route path="/documentation" element={<DocumentationLibrary />} />
                    
                    <Route
                      path="/documentation/new"
                      element={
                        <ProtectedRoute allowedRoles={['METROLOGY_MANAGER', 'SUPERVISOR']}>
                          <DocumentationUpload />
                        </ProtectedRoute>
                      }
                    />
                    
                    <Route path="/documentation/:id" element={<DocumentationDetails />} />
                    
                    <Route path="/instruments" element={<InstrumentsList />} />
                    
                    <Route
                      path="/instruments/new"
                      element={
                        <ProtectedRoute allowedRoles={['METROLOGY_MANAGER', 'SUPERVISOR']}>
                          <InstrumentNew />
                        </ProtectedRoute>
                      }
                    />
                    
                    <Route path="/instruments/:id" element={<InstrumentDetails />} />
                    
                    <Route
                      path="/instruments/:id/edit"
                      element={
                        <ProtectedRoute allowedRoles={['METROLOGY_MANAGER', 'SUPERVISOR']}>
                          <InstrumentEdit />
                        </ProtectedRoute>
                      }
                    />
                    
                    <Route path="/audit" element={<AuditTrail />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
