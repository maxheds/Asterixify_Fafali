export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          app_id: string;
          name: string;
          description: string;
          event_date: string;
          location: string;
          event_flyer: string;
          is_active: boolean;
          custom_fields: any;
          primary_color: string | null;
          secondary_color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          app_id?: string;
          name: string;
          description?: string;
          event_date: string;
          location?: string;
          event_flyer?: string;
          is_active?: boolean;
          custom_fields?: any;
          primary_color?: string | null;
          secondary_color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          app_id?: string;
          name?: string;
          description?: string;
          event_date?: string;
          location?: string;
          event_flyer?: string;
          is_active?: boolean;
          custom_fields?: any;
          primary_color?: string | null;
          secondary_color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      admin_users: {
        Row: {
          id: string;
          app_id: string;
          username: string;
          password_hash: string;
          salt: string;
          role: 'master' | 'admin';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          app_id?: string;
          username: string;
          password_hash: string;
          salt: string;
          role?: 'master' | 'admin';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          app_id?: string;
          username?: string;
          password_hash?: string;
          salt?: string;
          role?: 'master' | 'admin';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      notification_settings: {
        Row: {
          id: string;
          app_id: string;
          sms_enabled: boolean;
          email_enabled: boolean;
          sms_registration_template: string;
          sms_checkin_template: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          app_id?: string;
          sms_enabled?: boolean;
          email_enabled?: boolean;
          sms_registration_template?: string;
          sms_checkin_template?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          app_id?: string;
          sms_enabled?: boolean;
          email_enabled?: boolean;
          sms_registration_template?: string;
          sms_checkin_template?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      admin_settings: {
        Row: {
          id: string;
          app_id: string;
          admin_password: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          app_id?: string;
          admin_password: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          app_id?: string;
          admin_password?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      attendees: {
        Row: {
          id: string;
          app_id: string;
          event_id: string;
          salutation: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          gender: string;
          ticket_type: string;
          organization: string;
          age_group: string;
          special_requirements: string;
          registration_source: string;
          form_data: any;
          checked_in: boolean;
          checked_in_at: string | null;
          checked_in_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          app_id?: string;
          event_id: string;
          salutation?: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string;
          gender?: string;
          ticket_type?: string;
          organization?: string;
          age_group?: string;
          special_requirements?: string;
          registration_source?: string;
          form_data?: any;
          checked_in?: boolean;
          checked_in_at?: string | null;
          checked_in_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          app_id?: string;
          event_id?: string;
          salutation?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string;
          gender?: string;
          ticket_type?: string;
          organization?: string;
          age_group?: string;
          special_requirements?: string;
          registration_source?: string;
          form_data?: any;
          checked_in?: boolean;
          checked_in_at?: string | null;
          checked_in_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      check_in_history: {
        Row: {
          id: string;
          app_id: string;
          attendee_id: string;
          event_id: string;
          checked_in_by: string;
          checked_in_at: string;
          notes: string;
        };
        Insert: {
          id?: string;
          app_id?: string;
          attendee_id: string;
          event_id: string;
          checked_in_by: string;
          checked_in_at?: string;
          notes?: string;
        };
        Update: {
          id?: string;
          app_id?: string;
          attendee_id?: string;
          event_id?: string;
          checked_in_by?: string;
          checked_in_at?: string;
          notes?: string;
        };
      };
    };
  };
}

export type Event = Database['public']['Tables']['events']['Row'];
export type Attendee = Database['public']['Tables']['attendees']['Row'];
export type CheckInHistory = Database['public']['Tables']['check_in_history']['Row'];
export type AdminUser = Database['public']['Tables']['admin_users']['Row'];
