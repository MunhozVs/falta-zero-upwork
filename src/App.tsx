import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Protocols } from './pages/Protocols';
import { Escalations } from './pages/Escalations';
import { Agenda } from './pages/Agenda';
import { Waitlist } from './pages/Waitlist';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="protocolos" element={<Protocols />} />
            <Route path="escalations" element={<Escalations />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="waitlist" element={<Waitlist />} />
            {/* Fallback route for all menu clicks in demo */}
            <Route path="*" element={<Dashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
