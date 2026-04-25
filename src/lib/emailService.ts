import emailjs from '@emailjs/browser';

export interface RegistrationEmailData {
  attendee_id: string;
  salutation: string;
  first_name: string;
  last_name: string;
  to_email: string;
  event_name: string;
  event_date: string;
  event_location: string;
}

export interface CheckInEmailData {
  salutation: string;
  first_name: string;
  last_name: string;
  to_email: string;
  event_name: string;
  checked_in_at: string;
}

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const REGISTRATION_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_REGISTRATION_TEMPLATE_ID;
const CHECKIN_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_CHECKIN_TEMPLATE_ID;

export const sendRegistrationEmail = async (data: RegistrationEmailData): Promise<boolean> => {
  if (!SERVICE_ID || !PUBLIC_KEY || !REGISTRATION_TEMPLATE_ID) {
    console.warn('EmailJS not configured for registration emails');
    return false;
  }

  try {
    const templateParams = {
      attendee_id: data.attendee_id,
      salutation: data.salutation,
      first_name: data.first_name,
      last_name: data.last_name,
      to_email: data.to_email,
      event_name: data.event_name,
      event_date: data.event_date,
      event_location: data.event_location,
      qr_url: `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(data.attendee_id)}&size=200x200`,
      ticket_url: `${window.location.origin}/ticket/${data.attendee_id}`,
    };

    await emailjs.send(
      SERVICE_ID,
      REGISTRATION_TEMPLATE_ID,
      templateParams,
      PUBLIC_KEY
    );

    console.log('Registration email sent successfully to:', data.to_email);
    return true;
  } catch (error) {
    console.error('Failed to send registration email:', error);
    return false;
  }
};

export const sendCheckInEmail = async (data: CheckInEmailData): Promise<boolean> => {
  if (!SERVICE_ID || !PUBLIC_KEY || !CHECKIN_TEMPLATE_ID) {
    console.warn('EmailJS not configured for check-in emails');
    return false;
  }

  try {
    const templateParams = {
      salutation: data.salutation,
      first_name: data.first_name,
      last_name: data.last_name,
      to_email: data.to_email,
      event_name: data.event_name,
      checked_in_at: data.checked_in_at,
    };

    await emailjs.send(
      SERVICE_ID,
      CHECKIN_TEMPLATE_ID,
      templateParams,
      PUBLIC_KEY
    );

    console.log('Check-in email sent successfully to:', data.to_email);
    return true;
  } catch (error) {
    console.error('Failed to send check-in email:', error);
    return false;
  }
};
