import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from './lib/supabase';
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
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const mockToken = localStorage.getItem('caltrack_mock_token');
      const mockEmail = localStorage.getItem('caltrack_user_email') || 'technician@caltrack.com';
      if (mockToken) {
        setSession({ user: { email: mockEmail } });
      }
      setLoading(false);
      return;
    }

    supabase!.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setLoading(false);
    });

    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (!isSupabaseConfigured) {
      localStorage.removeItem('caltrack_mock_token');
      localStorage.removeItem('caltrack_user_email');
      setSession(null);
      return;
    }
    await supabase!.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  const userEmail = session?.user?.email || 'admin@caltrack.com';

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={session ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        
        <Route
          path="/*"
          element={
            session ? (
              <AppLayout userEmail={userEmail} handleLogout={handleLogout}>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/process-areas" element={<ProcessAreas />} />
                  <Route path="/control-loops" element={<ControlLoops />} />
                  <Route path="/control-loops/:id" element={<LoopDetails />} />
                  <Route path="/work-orders" element={<WorkOrders />} />
                  <Route path="/approvals" element={<Approvals />} />
                  <Route path="/reference-standards" element={<ReferenceStandards />} />
                  <Route path="/documentation" element={<DocumentationLibrary />} />
                  <Route path="/documentation/new" element={<DocumentationUpload />} />
                  <Route path="/documentation/:id" element={<DocumentationDetails />} />
                  <Route path="/instruments" element={<InstrumentsList />} />
                  <Route path="/instruments/new" element={<InstrumentNew />} />
                  <Route path="/instruments/:id" element={<InstrumentDetails />} />
                  <Route path="/instruments/:id/edit" element={<InstrumentEdit />} />
                  <Route path="/audit" element={<AuditTrail />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </AppLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
