import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLogin } from './AdminLogin';
import { AdminPortal } from './AdminPortal';
import { CheckInInterface } from './CheckInInterface';
import { CheckInEventSelector } from './CheckInEventSelector';
import { Modal } from './Modal';

export function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [showCheckInSelector, setShowCheckInSelector] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const authenticated = sessionStorage.getItem('admin_authenticated');
    if (authenticated === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    sessionStorage.setItem('admin_authenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
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
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-lime-500/30 w-full max-w-md p-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-lime-400 to-lime-300 bg-clip-text text-transparent mb-4 text-center">
              Admin Portal
            </h1>
            <AdminLogin onSuccess={handleLoginSuccess} onCancel={() => navigate('/')} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {!selectedEventId ? (
          <AdminPortal onNavigateToCheckIn={handleNavigateToCheckIn} onLogout={handleLogout} />
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
