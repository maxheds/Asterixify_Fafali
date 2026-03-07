import { useState, useEffect } from 'react';
import { AdminPortal } from './components/AdminPortal';
import { CheckInInterface } from './components/CheckInInterface';
import { RegistrationForm } from './components/RegistrationForm';
import { AdminLogin } from './components/AdminLogin';
import { CheckInEventSelector } from './components/CheckInEventSelector';
import { HomePage } from './components/HomePage';
import { Modal } from './components/Modal';

type ModalMode = 'none' | 'register' | 'checkin' | 'admin-login' | 'admin';

function App() {
  const [modalMode, setModalMode] = useState<ModalMode>('none');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  useEffect(() => {
    sessionStorage.removeItem('admin_authenticated');
  }, []);

  const handleNavigateToCheckIn = (eventId: string) => {
    setSelectedEventId(eventId);
    setModalMode('checkin');
  };

  const handleBackToAdmin = () => {
    setModalMode('admin');
    setSelectedEventId('');
  };

  const handleAdminAccess = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
    setModalMode('admin-login');
  };

  const closeModal = () => {
    setModalMode('none');
    setSelectedEventId('');
  };

  return (
    <>
      <HomePage
        onRegister={() => setModalMode('register')}
        onCheckIn={() => setModalMode('checkin')}
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

      <Modal
        isOpen={modalMode === 'admin-login'}
        onClose={closeModal}
        title="Admin Login"
        size="small"
      >
        <AdminLogin
          onSuccess={() => {
            setIsAdminAuthenticated(true);
            setModalMode('admin');
          }}
          onCancel={closeModal}
        />
      </Modal>

      <Modal
        isOpen={modalMode === 'register'}
        onClose={closeModal}
        title="Event Registration"
        size="large"
      >
        <RegistrationForm onSuccess={closeModal} />
      </Modal>

      <Modal
        isOpen={modalMode === 'checkin' && !selectedEventId}
        onClose={closeModal}
        title="Select Event for Check-In"
        size="medium"
      >
        <CheckInEventSelector
          onSelectEvent={(eventId) => {
            setSelectedEventId(eventId);
          }}
          onBack={closeModal}
        />
      </Modal>

      <Modal
        isOpen={modalMode === 'checkin' && !!selectedEventId}
        onClose={() => {
          setSelectedEventId('');
          closeModal();
        }}
        title="Event Check-In"
        size="xlarge"
      >
        <CheckInInterface
          eventId={selectedEventId}
          onBack={handleBackToAdmin}
          onHome={closeModal}
          onRegister={() => setModalMode('register')}
        />
      </Modal>

      <Modal
        isOpen={modalMode === 'admin'}
        onClose={() => {
          setIsAdminAuthenticated(false);
          sessionStorage.removeItem('admin_authenticated');
          closeModal();
        }}
        title="Admin Portal"
        size="xlarge"
      >
        {isAdminAuthenticated ? (
          <AdminPortal onNavigateToCheckIn={handleNavigateToCheckIn} />
        ) : null}
      </Modal>
    </>
  );
}

export default App;
