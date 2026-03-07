import { pgTable, text, uuid, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  appId: text('app_id').notNull().default('default_app'),
  name: text('name').notNull(),
  description: text('description').default(''),
  eventDate: timestamp('event_date').notNull(),
  location: text('location').default(''),
  eventFlyer: text('event_flyer').default(''),
  isActive: boolean('is_active').default(true),
  customFields: jsonb('custom_fields').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const attendees = pgTable('attendees', {
  id: uuid('id').primaryKey().defaultRandom(),
  appId: text('app_id').notNull().default('default_app'),
  eventId: uuid('event_id').notNull().references(() => events.id),
  salutation: text('salutation').default(''),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').default(''),
  gender: text('gender').default(''),
  ticketType: text('ticket_type').default(''),
  organization: text('organization').default(''),
  ageGroup: text('age_group').default(''),
  specialRequirements: text('special_requirements').default(''),
  registrationSource: text('registration_source').default(''),
  formData: jsonb('form_data').default({}),
  checkedIn: boolean('checked_in').default(false),
  checkedInAt: timestamp('checked_in_at'),
  checkedInBy: text('checked_in_by').default(''),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const checkInHistory = pgTable('check_in_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  appId: text('app_id').notNull().default('default_app'),
  attendeeId: uuid('attendee_id').notNull().references(() => attendees.id),
  eventId: uuid('event_id').notNull().references(() => events.id),
  checkedInBy: text('checked_in_by').notNull(),
  checkedInAt: timestamp('checked_in_at').defaultNow(),
  notes: text('notes').default(''),
});

export const adminSettings = pgTable('admin_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  appId: text('app_id').notNull().default('default_app'),
  adminPassword: text('admin_password').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
