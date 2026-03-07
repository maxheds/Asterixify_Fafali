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
