import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { CheckInInterface } from './components/CheckInInterface';
import { RegistrationForm } from './components/RegistrationForm';
import { CheckInEventSelector } from './components/CheckInEventSelector';
import { HomePage } from './components/HomePage';
import { Modal } from './components/Modal';
import { AdminPage } from './components/AdminPage';
import { supabase } from './lib/supabase';

type ModalMode = 'none' | 'register' | 'checkin';

function App() {
  const [modalMode, setModalMode] = useState<ModalMode>('none');
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  useEffect(() => {
    if (modalMode === 'checkin') {
      loadActiveEvent();
    }
  }, [modalMode]);

  const loadActiveEvent = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('id')
      .eq('is_active', true)
      .order('event_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setSelectedEventId(data.id);
    }
  };

  const closeModal = () => {
    setModalMode('none');
    setSelectedEventId('');
  };

  return (
    <BrowserRouter>
      <SpeedInsights />
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
              title="Registration for Event"
              size="large"
            >
              <RegistrationForm onSuccess={closeModal} />
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
                  closeModal();
                }}
                onHome={closeModal}
                onRegister={() => {
                  setSelectedEventId('');
                  setModalMode('register');
                }}
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
