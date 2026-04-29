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

export interface WaitlistEmailData {
  first_name: string;
  last_name: string;
  to_email: string;
  event_name: string;
  event_date: string;
  event_location: string;
}

export interface BlastEmailData {
  first_name: string;
  last_name: string;
  to_email: string;
  event_name: string;
  subject: string;
  message: string;
}

const SERVICE_ID                  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const PUBLIC_KEY                  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const REGISTRATION_TEMPLATE_ID    = import.meta.env.VITE_EMAILJS_REGISTRATION_TEMPLATE_ID;
const CHECKIN_TEMPLATE_ID         = import.meta.env.VITE_EMAILJS_CHECKIN_TEMPLATE_ID;
// Create these templates in your EmailJS dashboard:
// WAITLIST: variables — first_name, last_name, to_email, event_name, event_date, event_location
// WAITLIST_PROMOTION: same variables, different subject/body ("You've been confirmed!")
// BLAST: variables — first_name, last_name, to_email, event_name, subject, message
const WAITLIST_TEMPLATE_ID        = import.meta.env.VITE_EMAILJS_WAITLIST_TEMPLATE_ID;
const WAITLIST_PROMOTION_TEMPLATE = import.meta.env.VITE_EMAILJS_WAITLIST_PROMOTION_TEMPLATE_ID;
const BLAST_TEMPLATE_ID           = import.meta.env.VITE_EMAILJS_BLAST_TEMPLATE_ID;

export const sendRegistrationEmail = async (data: RegistrationEmailData): Promise<boolean> => {
  if (!SERVICE_ID || !PUBLIC_KEY || !REGISTRATION_TEMPLATE_ID) {
    console.warn('EmailJS not configured for registration emails');
    return false;
  }

  try {
    await emailjs.send(SERVICE_ID, REGISTRATION_TEMPLATE_ID, {
      attendee_id:  data.attendee_id,
      salutation:   data.salutation,
      first_name:   data.first_name,
      last_name:    data.last_name,
      to_email:     data.to_email,
      event_name:   data.event_name,
      event_date:   data.event_date,
      event_location: data.event_location,
      qr_url:       `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(data.attendee_id)}&size=200x200`,
      ticket_url:   `${window.location.origin}/ticket/${data.attendee_id}`,
    }, PUBLIC_KEY);
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
    await emailjs.send(SERVICE_ID, CHECKIN_TEMPLATE_ID, {
      salutation:     data.salutation,
      first_name:     data.first_name,
      last_name:      data.last_name,
      to_email:       data.to_email,
      event_name:     data.event_name,
      checked_in_at:  data.checked_in_at,
    }, PUBLIC_KEY);
    return true;
  } catch (error) {
    console.error('Failed to send check-in email:', error);
    return false;
  }
};

export const sendWaitlistConfirmationEmail = async (data: WaitlistEmailData): Promise<boolean> => {
  if (!SERVICE_ID || !PUBLIC_KEY || !WAITLIST_TEMPLATE_ID) return false;
  try {
    await emailjs.send(SERVICE_ID, WAITLIST_TEMPLATE_ID, {
      first_name:     data.first_name,
      last_name:      data.last_name,
      to_email:       data.to_email,
      event_name:     data.event_name,
      event_date:     data.event_date,
      event_location: data.event_location,
    }, PUBLIC_KEY);
    return true;
  } catch (error) {
    console.error('Failed to send waitlist confirmation email:', error);
    return false;
  }
};

export const sendWaitlistPromotionEmail = async (data: WaitlistEmailData): Promise<boolean> => {
  if (!SERVICE_ID || !PUBLIC_KEY || !WAITLIST_PROMOTION_TEMPLATE) return false;
  try {
    await emailjs.send(SERVICE_ID, WAITLIST_PROMOTION_TEMPLATE, {
      first_name:     data.first_name,
      last_name:      data.last_name,
      to_email:       data.to_email,
      event_name:     data.event_name,
      event_date:     data.event_date,
      event_location: data.event_location,
    }, PUBLIC_KEY);
    return true;
  } catch (error) {
    console.error('Failed to send waitlist promotion email:', error);
    return false;
  }
};

export const sendBlastEmail = async (data: BlastEmailData): Promise<boolean> => {
  if (!SERVICE_ID || !PUBLIC_KEY || !BLAST_TEMPLATE_ID) return false;
  try {
    await emailjs.send(SERVICE_ID, BLAST_TEMPLATE_ID, {
      first_name:  data.first_name,
      last_name:   data.last_name,
      to_email:    data.to_email,
      event_name:  data.event_name,
      subject:     data.subject,
      message:     data.message,
    }, PUBLIC_KEY);
    return true;
  } catch (error) {
    console.error('Failed to send blast email:', error);
    return false;
  }
};
