import { useState, useEffect } from 'react';
import { AdminPortal } from './components/AdminPortal';
import { CheckInInterface } from './components/CheckInInterface';
import { RegistrationForm } from './components/RegistrationForm';
import { AdminLogin } from './components/AdminLogin';
import { CheckInEventSelector } from './components/CheckInEventSelector';
import { HomePage } from './components/HomePage';

type ViewMode = 'home' | 'register' | 'checkin' | 'admin' | 'admin-login';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  useEffect(() => {
    sessionStorage.removeItem('admin_authenticated');
  }, []);

  const handleNavigateToCheckIn = (eventId: string) => {
    setSelectedEventId(eventId);
    setViewMode('checkin');
  };

  const handleBackToAdmin = () => {
    setViewMode('admin');
    setSelectedEventId('');
  };

  const handleAdminAccess = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
    setViewMode('admin-login');
  };

  if (viewMode === 'home') {
    return (
      <>
        <HomePage
          onRegister={() => setViewMode('register')}
          onCheckIn={() => setViewMode('checkin')}
        />
        <button
          onClick={handleAdminAccess}
          className="fixed bottom-4 right-4 w-3 h-3 bg-slate-800/50 hover:bg-slate-700 rounded-full transition-all duration-300 hover:w-32 hover:h-12 overflow-hidden group z-50"
          title="Admin Access"
        >
          <span className="opacity-0 group-hover:opacity-100 flex items-center justify-center h-full text-white text-xs transition-opacity duration-300">
            Admin
          </span>
        </button>
      </>
    );
  }

  if (viewMode === 'admin-login') {
    return (
      <AdminLogin
        onSuccess={() => {
          setIsAdminAuthenticated(true);
          setViewMode('admin');
        }}
        onCancel={() => setViewMode('home')}
      />
    );
  }

  if (viewMode === 'register') {
    return (
      <>
        <div className="print:hidden">
          <button
            onClick={() => setViewMode('home')}
            className="fixed top-4 left-4 px-4 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-100 transition-colors shadow-lg z-50"
          >
            ← Back to Home
          </button>
        </div>
        <RegistrationForm onSuccess={() => setViewMode('home')} />
      </>
    );
  }

  if (viewMode === 'checkin') {
    return selectedEventId ? (
      <CheckInInterface
        eventId={selectedEventId}
        onBack={handleBackToAdmin}
        onHome={() => setViewMode('home')}
        onRegister={() => setViewMode('register')}
      />
    ) : (
      <CheckInEventSelector
        onSelectEvent={(eventId) => {
          setSelectedEventId(eventId);
        }}
        onBack={() => setViewMode('home')}
      />
    );
  }

  if (viewMode === 'admin') {
    if (!isAdminAuthenticated) {
      setViewMode('admin-login');
      return null;
    }

    return (
      <>
        <div className="print:hidden">
          <button
            onClick={() => {
              setIsAdminAuthenticated(false);
              sessionStorage.removeItem('admin_authenticated');
              setViewMode('home');
            }}
            className="fixed top-4 left-4 px-4 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-100 transition-colors shadow-lg z-40"
          >
            ← Back to Home
          </button>
        </div>
        <AdminPortal onNavigateToCheckIn={handleNavigateToCheckIn} />
      </>
    );
  }

  return null;
}

export default App;
