import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CheckInInterface } from './components/CheckInInterface';
import { RegistrationForm } from './components/RegistrationForm';
import { CheckInEventSelector } from './components/CheckInEventSelector';
import { HomePage } from './components/HomePage';
import { Modal } from './components/Modal';
import { AdminPage } from './components/AdminPage';

type ModalMode = 'none' | 'register' | 'checkin';

function App() {
  const [modalMode, setModalMode] = useState<ModalMode>('none');
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  const closeModal = () => {
    setModalMode('none');
    setSelectedEventId('');
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <>
            <HomePage
              onRegister={() => setModalMode('register')}
              onCheckIn={() => setModalMode('checkin')}
            />

            <Modal
              isOpen={modalMode === 'register'}
              onClose={closeModal}
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
                onBack={() => {
                  setSelectedEventId('');
                  setModalMode('checkin');
                }}
                onHome={closeModal}
                onRegister={() => setModalMode('register')}
              />
            </Modal>
          </>
        } />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
