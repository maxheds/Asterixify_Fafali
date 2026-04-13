import { supabase } from './supabase';

const API_KEY   = import.meta.env.VITE_ARKESEL_API_KEY   || '';
const SENDER_ID = import.meta.env.VITE_ARKESEL_SENDER_ID || 'Asterixify';
const API_URL   = 'https://sms.arkesel.com/api/v2/sms/send';

// ─── Default templates ────────────────────────────────────────────────────────
export const DEFAULT_REGISTRATION_TEMPLATE =
  'Hi {name}, your registration for {event_name} on {date} at {location} is confirmed. See you there! - Asterixify';

export const DEFAULT_CHECKIN_TEMPLATE =
  'Hi {name}, you have been checked in to {event_name}. Welcome and enjoy the event! - Asterixify';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface NotificationSettings {
  sms_enabled: boolean;
  email_enabled: boolean;
  sms_registration_template: string;
  sms_checkin_template: string;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  sms_enabled: true,
  email_enabled: true,
  sms_registration_template: DEFAULT_REGISTRATION_TEMPLATE,
  sms_checkin_template: DEFAULT_CHECKIN_TEMPLATE,
};

// ─── Settings cache (5-minute TTL) ───────────────────────────────────────────
let settingsCache: { data: NotificationSettings; fetchedAt: number } | null = null;

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const now = Date.now();
  if (settingsCache && now - settingsCache.fetchedAt < 5 * 60 * 1000) {
    return settingsCache.data;
  }
  try {
    const { data } = await supabase
      .from('notification_settings')
      .select('sms_enabled, email_enabled, sms_registration_template, sms_checkin_template')
      .maybeSingle();

    const settings: NotificationSettings = data
      ? {
          sms_enabled: data.sms_enabled,
          email_enabled: data.email_enabled,
          sms_registration_template: data.sms_registration_template || DEFAULT_REGISTRATION_TEMPLATE,
          sms_checkin_template: data.sms_checkin_template || DEFAULT_CHECKIN_TEMPLATE,
        }
      : DEFAULT_SETTINGS;

    settingsCache = { data: settings, fetchedAt: now };
    return settings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Call this after saving settings so the next send picks up new values. */
export function invalidateSettingsCache(): void {
  settingsCache = null;
}

export async function isEmailEnabled(): Promise<boolean> {
  const s = await getNotificationSettings();
  return s.email_enabled;
}

export async function isSmsEnabled(): Promise<boolean> {
  const s = await getNotificationSettings();
  return s.sms_enabled;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function applyTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');
}

/**
 * Normalise a phone number to international format (no leading +).
 * Handles Ghanaian numbers (0XX → 233XX) and generic +XX formats.
 */
function formatPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  if (cleaned.startsWith('00'))  return cleaned.slice(2);
  if (cleaned.startsWith('0'))   return '233' + cleaned.slice(1);
  if (cleaned.startsWith('233')) return cleaned;
  return cleaned;
}

// ─── Core send ───────────────────────────────────────────────────────────────
async function sendRawSMS(phones: string[], message: string): Promise<boolean> {
  if (!API_KEY) {
    console.warn('[SMS] VITE_ARKESEL_API_KEY is not set — SMS skipped');
    return false;
  }
  const recipients = phones.filter(p => p?.trim()).map(formatPhone);
  if (recipients.length === 0) return false;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'api-key': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: SENDER_ID, message, recipients }),
    });
    const json = await res.json();
    return json.status === 'success';
  } catch (err) {
    console.error('[SMS] Send failed:', err);
    return false;
  }
}

// ─── Public send functions ────────────────────────────────────────────────────
export async function sendRegistrationSMS(data: {
  first_name: string;
  phone: string;
  event_name: string;
  event_date: string;
  event_location: string;
}): Promise<boolean> {
  if (!data.phone?.trim()) return false;
  const settings = await getNotificationSettings();
  if (!settings.sms_enabled) return false;

  const message = applyTemplate(settings.sms_registration_template, {
    name:       data.first_name,
    event_name: data.event_name,
    date:       data.event_date,
    location:   data.event_location || 'TBA',
  });
  return sendRawSMS([data.phone], message);
}

export async function sendCheckInSMS(data: {
  first_name: string;
  phone: string;
  event_name: string;
  checked_in_at: string;
}): Promise<boolean> {
  if (!data.phone?.trim()) return false;
  const settings = await getNotificationSettings();
  if (!settings.sms_enabled) return false;

  const message = applyTemplate(settings.sms_checkin_template, {
    name:       data.first_name,
    event_name: data.event_name,
    time:       data.checked_in_at,
  });
  return sendRawSMS([data.phone], message);
}

/**
 * Send a custom message to many recipients in batches of 50.
 * @param onProgress  optional callback fired after each batch
 */
export async function sendBulkSMS(
  phones: string[],
  message: string,
  onProgress?: (done: number, total: number) => void,
): Promise<{ sent: number; failed: number }> {
  if (!API_KEY) {
    console.warn('[SMS] VITE_ARKESEL_API_KEY is not set — Bulk SMS skipped');
    return { sent: 0, failed: phones.length };
  }

  const valid = phones.filter(p => p?.trim());
  let sent = 0;
  let failed = 0;
  const BATCH = 50;

  for (let i = 0; i < valid.length; i += BATCH) {
    const batch = valid.slice(i, i + BATCH);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'api-key': API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: SENDER_ID,
          message,
          recipients: batch.map(formatPhone),
        }),
      });
      const json = await res.json();
      if (json.status === 'success') sent += batch.length;
      else failed += batch.length;
    } catch {
      failed += batch.length;
    }
    onProgress?.(sent + failed, valid.length);
  }

  return { sent, failed };
}
