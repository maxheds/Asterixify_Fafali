import { supabase } from './supabase';
import { sendWaitlistPromotionEmail } from './emailService';
import { sendRegistrationSMS } from './smsService';

/**
 * Promotes the next N people from the waitlist into confirmed attendees.
 * Sends email + SMS to each promoted person.
 * Returns the number actually promoted.
 */
export const promoteFromWaitlist = async (eventId: string, spotsAvailable: number): Promise<number> => {
  if (spotsAvailable <= 0) return 0;

  const { data: entries } = await supabase
    .from('waitlist')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })
    .limit(spotsAvailable);

  if (!entries || entries.length === 0) return 0;

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .maybeSingle();

  if (!event) return 0;

  const eventDate = new Date(event.event_date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  let promoted = 0;

  for (const entry of entries) {
    const { error } = await supabase.from('attendees').insert({
      event_id:             entry.event_id,
      salutation:           entry.salutation || '',
      first_name:           entry.first_name,
      last_name:            entry.last_name,
      email:                entry.email,
      phone:                entry.phone || '',
      gender:               entry.gender || '',
      organization:         entry.organization || '',
      age_group:            entry.age_group || '',
      ticket_type:          entry.ticket_type || 'Attendee',
      special_requirements: entry.special_requirements || '',
      form_data:            entry.form_data || {},
      registration_source:  'waitlist',
      app_id:               'default_app',
    });

    if (!error) {
      await supabase.from('waitlist').delete().eq('id', entry.id);

      await Promise.all([
        sendWaitlistPromotionEmail({
          first_name:     entry.first_name,
          last_name:      entry.last_name,
          to_email:       entry.email,
          event_name:     event.name,
          event_date:     eventDate,
          event_location: event.location || 'TBA',
        }),
        sendRegistrationSMS({
          first_name:      entry.first_name,
          phone:           entry.phone || '',
          event_name:      event.name,
          event_date:      eventDate,
          event_location:  event.location || 'TBA',
          programme_link:  event.programme_link || '',
        }),
      ]);

      promoted++;
    }
  }

  return promoted;
};

/**
 * Calculates how many spots are open and promotes that many from the waitlist.
 */
export const checkAndPromote = async (eventId: string): Promise<number> => {
  const { data: event } = await supabase
    .from('events')
    .select('max_attendees')
    .eq('id', eventId)
    .maybeSingle();

  if (!event?.max_attendees) return 0;

  const { count } = await supabase
    .from('attendees')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId);

  const spots = event.max_attendees - (count ?? 0);
  return promoteFromWaitlist(eventId, spots);
};
