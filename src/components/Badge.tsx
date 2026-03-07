import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Attendee, Event } from '../lib/database.types';

interface BadgeProps {
  attendee: Attendee;
  event: Event;
}

export function Badge({ attendee, event }: BadgeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    generateQRCode();
  }, [attendee]);

  const generateQRCode = async () => {
    const fullName = attendee.salutation
      ? `${attendee.salutation} ${attendee.first_name} ${attendee.last_name}`
      : `${attendee.first_name} ${attendee.last_name}`;

    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${fullName}
N:${attendee.last_name};${attendee.first_name};;${attendee.salutation || ''};
EMAIL:${attendee.email}
TEL:${attendee.phone || ''}
ORG:${attendee.organization || ''}
END:VCARD`;

    try {
      const url = await QRCode.toDataURL(vcard, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  return (
    <div className="bg-white border-4 border-blue-600 rounded-xl p-6 w-full shadow-2xl">
      <div className="text-center mb-4">
        <h3 className="text-3xl font-bold text-slate-900 mb-2">
          {attendee.salutation && `${attendee.salutation} `}{attendee.first_name} {attendee.last_name}
        </h3>
        {attendee.organization && (
          <p className="text-xl text-slate-600 font-medium">{attendee.organization}</p>
        )}
      </div>

      <div className="flex flex-col items-center justify-center">
        <p className="text-xs text-slate-500 mb-1">Scan for contact</p>
        {qrDataUrl && (
          <img
            src={qrDataUrl}
            alt="QR Code for contact"
            className="w-48 h-48"
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}

export function PrintableBadge({ attendee, event }: BadgeProps) {
  return (
    <div className="hidden print:block">
      <Badge attendee={attendee} event={event} />
    </div>
  );
}
