import { useState, useEffect } from 'react';
import { UserPlus, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface HomePageProps {
  onRegister: () => void;
  onCheckIn: () => void;
}

interface Event {
  id: string;
  name: string;
  description: string;
  event_date: string;
  location: string;
  event_flyer?: string;
  primary_color?: string | null;
  secondary_color?: string | null;
}

export function HomePage({ onRegister, onCheckIn }: HomePageProps) {
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadActiveEvent();
  }, []);

  const loadActiveEvent = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('event_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setActiveEvent(data);
    }
  };

  const backgroundImage = activeEvent?.event_flyer ||
    'https://res.cloudinary.com/dtosbfggh/image/upload/v1776783416/Dr_Kofi_zrmp1e.jpg';

  const primaryColor = activeEvent?.primary_color || null;
  const secondaryColor = activeEvent?.secondary_color || null;

  const registerButtonStyle = primaryColor
    ? { backgroundColor: primaryColor, borderColor: primaryColor }
    : {};
  const registerButtonClass = primaryColor
    ? 'group relative w-full backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300 px-8 py-8 landscape:py-4 landscape:px-6 border-2'
    : 'group relative w-full bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300 px-8 py-8 landscape:py-4 landscape:px-6 border-2 border-white/30 hover:bg-white/20';

  const checkInButtonStyle = secondaryColor
    ? { backgroundColor: secondaryColor, borderColor: secondaryColor }
    : {};
  const checkInButtonClass = secondaryColor
    ? 'group relative w-full backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300 px-8 py-8 landscape:py-4 landscape:px-6 border-2'
    : 'group relative w-full bg-black/20 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300 px-8 py-8 landscape:py-4 landscape:px-6 border-2 border-white/20 hover:bg-black/30';

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-transparent">
      <img
        src={backgroundImage}
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      <div className="relative h-screen flex items-center justify-end pr-4 md:pr-6 lg:pr-8 landscape:pr-4 bg-transparent" style={{ zIndex: 10 }}>
        <div className="w-full max-w-md flex flex-col gap-6 landscape:gap-3">
          <button
            onClick={onRegister}
            className={registerButtonClass}
            style={registerButtonStyle}
          >
            <div className="relative flex items-center gap-5 landscape:gap-3">
              <div className="bg-white/30 backdrop-blur-sm w-16 h-16 landscape:w-11 landscape:h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg flex-shrink-0">
                <UserPlus size={36} className="text-white landscape:hidden" strokeWidth={2.5} />
                <UserPlus size={24} className="text-white hidden landscape:block" strokeWidth={2.5} />
              </div>
              <div className="text-left flex-1">
                <h2 className="text-3xl md:text-4xl landscape:text-xl font-black text-white mb-1.5 landscape:mb-0.5 tracking-tight">New Registration</h2>
                <p className="text-base landscape:text-xs text-white/80 font-medium">
                  Sign up and receive your digital pass
                </p>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/30 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
          </button>

          <button
            onClick={onCheckIn}
            className={checkInButtonClass}
            style={checkInButtonStyle}
          >
            <div className="relative flex items-center gap-5 landscape:gap-3">
              <div className="bg-white/30 backdrop-blur-sm w-16 h-16 landscape:w-11 landscape:h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg flex-shrink-0">
                <LogIn size={36} className="text-white landscape:hidden" strokeWidth={2.5} />
                <LogIn size={24} className="text-white hidden landscape:block" strokeWidth={2.5} />
              </div>
              <div className="text-left flex-1">
                <h2 className="text-3xl md:text-4xl landscape:text-xl font-black text-white mb-1.5 landscape:mb-0.5 tracking-tight">Check-In</h2>
                <p className="text-base landscape:text-xs text-white/80 font-medium">
                  Already registered? Fast entry here
                </p>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/30 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
          </button>
        </div>
      </div>

      <div className="fixed bottom-6 left-8" style={{ zIndex: 100 }}>
        <button
          onClick={() => navigate('/admin')}
          className="group relative w-4 h-4 rounded-full bg-gradient-to-br from-slate-700/90 to-slate-900/90 backdrop-blur-md border border-slate-600/50 shadow-2xl hover:border-lime-400/50 hover:from-lime-600/90 hover:to-lime-700/90 transition-all duration-300"
          aria-label="Admin Portal"
        />
      </div>

      <div className="fixed bottom-6 right-8 md:right-16 lg:right-24" style={{ zIndex: 100 }}>
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-gradient-to-br from-lime-400/20 via-purple-400/10 to-transparent blur-lg rounded-full" />
          <div className="relative bg-gradient-to-br from-stone-900/80 via-stone-950/85 to-black/90 backdrop-blur-md px-6 py-2.5 rounded-full border border-lime-400/40 shadow-2xl">
            <p className="relative text-lime-100 text-sm font-bold tracking-wide">
              Powered by Asterixify
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
