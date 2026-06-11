/**
 * Types de la base Supabase Machii.
 *
 * En V0 on type uniquement les 3 tables utilisées par l'app + les enums.
 * Les 7 autres tables existent en DB mais ne sont pas encore consommées.
 *
 * Quand le projet grossit, régénérer automatiquement :
 *   npx supabase gen types typescript --project-id qtgqvwfzwjprclqrkfue \
 *     > src/types/database.types.ts
 */

type Role = 'passenger' | 'driver' | 'both';
type TripStatus = 'open' | 'full' | 'ongoing' | 'done' | 'cancelled';
type BookingStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          phone: string | null;
          full_name: string;
          avatar_url: string | null;
          avatar_key: string | null;
          role: Role;
          is_verified: boolean;
          rating_avg: number;
          level: number;
          xp: number;
          bio: string | null;
          tags: string[];
          created_at: string;
        };
        Insert: {
          id: string;
          phone?: string | null;
          full_name?: string;
          avatar_url?: string | null;
          avatar_key?: string | null;
          role?: Role;
          is_verified?: boolean;
          rating_avg?: number;
          level?: number;
          xp?: number;
          bio?: string | null;
          tags?: string[];
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      trips: {
        Row: {
          id: string;
          driver_id: string;
          vehicle_id: string | null;
          origin_label: string;
          destination_label: string;
          /** GeoJSON Point serialised — en V0 on ne le manipule pas côté client. */
          origin: unknown;
          destination: unknown;
          route: unknown | null;
          departure_time: string;
          seats_available: number;
          seats_total: number;
          price_per_seat: number | null;
          status: TripStatus;
          is_recurring: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          driver_id: string;
          vehicle_id?: string | null;
          origin_label: string;
          destination_label: string;
          /** PostGIS string : `SRID=4326;POINT(lng lat)`. */
          origin: string;
          destination: string;
          route?: string | null;
          departure_time: string;
          seats_available?: number;
          seats_total?: number;
          price_per_seat?: number | null;
          status?: TripStatus;
          is_recurring?: boolean;
        };
        Update: Partial<Database['public']['Tables']['trips']['Insert']>;
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          trip_id: string;
          passenger_id: string;
          pickup: unknown | null;
          dropoff: unknown | null;
          seats_booked: number;
          status: BookingStatus;
          confirm_code: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          passenger_id: string;
          pickup?: string | null;
          dropoff?: string | null;
          seats_booked?: number;
          status?: BookingStatus;
          confirm_code?: string | null;
        };
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>;
        Relationships: [];
      };
      trip_requests: {
        Row: {
          id: string;
          passenger_id: string;
          origin_label: string;
          destination_label: string;
          origin: unknown;
          destination: unknown;
          departure_start: string;
          departure_end: string;
          seats_needed: number;
          message: string | null;
          status: 'open' | 'matched' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          passenger_id: string;
          origin_label: string;
          destination_label: string;
          origin: unknown;
          destination: unknown;
          departure_start: string;
          departure_end: string;
          seats_needed?: number;
          message?: string | null;
          status?: 'open' | 'matched' | 'cancelled';
        };
        Update: Partial<Database['public']['Tables']['trip_requests']['Insert']>;
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          trip_id: string;
          driver_id: string;
          passenger_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          driver_id: string;
          passenger_id: string;
        };
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          blocked: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          blocked?: boolean;
          read_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
        Relationships: [];
      };
      push_tokens: {
        Row: {
          user_id: string;
          expo_token: string;
          platform: 'ios' | 'android' | 'web';
          updated_at: string;
        };
        Insert: {
          user_id: string;
          expo_token: string;
          platform: 'ios' | 'android' | 'web';
        };
        Update: Partial<Database['public']['Tables']['push_tokens']['Insert']>;
        Relationships: [];
      };
      emergency_contacts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          phone: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          phone: string;
        };
        Update: Partial<Database['public']['Tables']['emergency_contacts']['Insert']>;
        Relationships: [];
      };
      sos_events: {
        Row: {
          id: string;
          profile_id: string;
          trip_id: string | null;
          location: unknown | null;
          resolved: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          trip_id?: string | null;
          location?: string | null;
          resolved?: boolean;
        };
        Update: Partial<Database['public']['Tables']['sos_events']['Insert']>;
        Relationships: [];
      };
      ratings: {
        Row: {
          id: string;
          trip_id: string;
          rater_id: string;
          ratee_id: string;
          punctuality: number | null;
          cleanliness: number | null;
          driving: number | null;
          friendliness: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          rater_id: string;
          ratee_id: string;
          punctuality?: number | null;
          cleanliness?: number | null;
          driving?: number | null;
          friendliness?: number | null;
        };
        Update: Partial<Database['public']['Tables']['ratings']['Insert']>;
        Relationships: [];
      };
      kyc_documents: {
        Row: {
          id: string;
          profile_id: string;
          doc_type: 'cin' | 'permis' | 'carte_grise' | 'photo_vehicule';
          file_path: string;
          status: 'pending' | 'approved' | 'rejected';
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          doc_type: 'cin' | 'permis' | 'carte_grise' | 'photo_vehicule';
          file_path: string;
          status?: 'pending' | 'approved' | 'rejected';
          reviewed_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['kyc_documents']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_trips: {
        Args: {
          p_origin_lng: number;
          p_origin_lat: number;
          p_dest_lng: number;
          p_dest_lat: number;
          p_radius_m?: number;
        };
        Returns: Database['public']['Tables']['trips']['Row'][];
      };
      send_whatsapp_otp: {
        Args: { p_phone: string };
        Returns: { sent: boolean; reason?: string };
      };
      verify_whatsapp_otp: {
        Args: { p_phone: string; p_code: string };
        Returns: boolean;
      };
      delete_my_account: {
        Args: Record<string, never>;
        Returns: { ok: boolean; reason?: string; deleted_user?: number; deleted_storage_objects?: number };
      };
    };
    Enums: {
      role_type: Role;
      trip_status: TripStatus;
      booking_status: BookingStatus;
    };
  };
};
