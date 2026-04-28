import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AdminLogin } from './AdminLogin';
import { AdminPortal } from './AdminPortal';
import { CheckInInterface } from './CheckInInterface';
import { CheckInEventSelector } from './CheckInEventSelector';
import { Modal } from './Modal';

export function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminRole, setAdminRole] = useState<'master' | 'admin'>('admin');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [showCheckInSelector, setShowCheckInSelector] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const authenticated = sessionStorage.getItem('admin_authenticated');
    const storedUsername = sessionStorage.getItem('admin_username') ?? '';
    const storedRole = sessionStorage.getItem('admin_role') as 'master' | 'admin' | null;
    if (authenticated === 'true' && storedUsername) {
      setIsAuthenticated(true);
      setAdminUsername(storedUsername);
      setAdminRole(storedRole ?? 'admin');
    }
  }, []);

  const handleLoginSuccess = (username: string, role: 'master' | 'admin') => {
    sessionStorage.setItem('admin_authenticated', 'true');
    sessionStorage.setItem('admin_username', username);
    sessionStorage.setItem('admin_role', role);
    setAdminUsername(username);
    setAdminRole(role);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('admin_username');
    sessionStorage.removeItem('admin_role');
    setIsAuthenticated(false);
    setAdminUsername('');
    setAdminRole('admin');
    navigate('/');
  };

  const handleNavigateToCheckIn = (eventId: string) => {
    setSelectedEventId(eventId);
    setShowCheckInSelector(false);
  };

  const handleBackToAdmin = () => {
    setSelectedEventId('');
    setShowCheckInSelector(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex items-center justify-center min-h-screen p-4">
          <AdminLogin onSuccess={handleLoginSuccess} onCancel={() => navigate('/')} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {!selectedEventId ? (
          <AdminPortal
            onNavigateToCheckIn={handleNavigateToCheckIn}
            onLogout={handleLogout}
            adminUsername={adminUsername}
            adminRole={adminRole}
          />
        ) : (
          <div className="h-screen overflow-y-auto">
            <CheckInInterface
              eventId={selectedEventId}
              onBack={handleBackToAdmin}
              onHome={() => navigate('/')}
              onRegister={() => navigate('/')}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={showCheckInSelector}
        onClose={() => setShowCheckInSelector(false)}
        title="Select Event for Check-In"
        size="medium"
      >
        <CheckInEventSelector
          onSelectEvent={handleNavigateToCheckIn}
          onBack={() => setShowCheckInSelector(false)}
        />
      </Modal>
    </>
  );
}
