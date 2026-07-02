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
          country: 'TN' | 'MA';
          gender: 'female' | 'male' | null;
          role: Role;
          is_verified: boolean;
          /** Modérateur KYC (migration 0034) — absent tant que la migration n'est pas appliquée. */
          is_admin?: boolean;
          rating_avg: number;
          level: number;
          xp: number;
          bio: string | null;
          tags: string[];
          referral_code: string | null;
          referred_by: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          phone?: string | null;
          full_name?: string;
          avatar_url?: string | null;
          avatar_key?: string | null;
          country?: 'TN' | 'MA';
          gender?: 'female' | 'male' | null;
          role?: Role;
          is_verified?: boolean;
          rating_avg?: number;
          level?: number;
          xp?: number;
          bio?: string | null;
          tags?: string[];
          referral_code?: string | null;
          referred_by?: string | null;
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
          country: 'TN' | 'MA';
          women_only: boolean;
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
          country?: 'TN' | 'MA';
          women_only?: boolean;
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
          picked_up_at: string | null;
          arrived_at: string | null;
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
          picked_up_at?: string | null;
          arrived_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>;
        Relationships: [];
      };
      vehicles: {
        Row: {
          id: string;
          driver_id: string;
          make: string | null;
          model: string | null;
          color: string | null;
          plate: string | null;
          seats: number | null;
          photo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          driver_id: string;
          make?: string | null;
          model?: string | null;
          color?: string | null;
          plate?: string | null;
          seats?: number | null;
          photo_url?: string | null;
        };
        Update: Partial<Database['public']['Tables']['vehicles']['Insert']>;
        Relationships: [];
      };
      user_achievements: {
        Row: {
          user_id: string;
          key: string;
          unlocked_at: string;
        };
        Insert: {
          user_id: string;
          key: string;
          unlocked_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_achievements']['Insert']>;
        Relationships: [];
      };
      feature_flags: {
        Row: {
          key: string;
          num: number;
          label: string;
          version: string;
          enabled: boolean;
          updated_at: string;
        };
        Insert: {
          key: string;
          num: number;
          label: string;
          version: string;
          enabled?: boolean;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['feature_flags']['Insert']>;
        Relationships: [];
      };
      trip_share_links: {
        Row: {
          id: string;
          token: string;
          trip_id: string;
          user_id: string;
          expires_at: string;
          revoked: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          token?: string;
          trip_id: string;
          user_id: string;
          expires_at?: string;
          revoked?: boolean;
        };
        Update: Partial<Database['public']['Tables']['trip_share_links']['Insert']>;
        Relationships: [];
      };
      trip_live_positions: {
        Row: {
          trip_id: string;
          user_id: string;
          lat: number;
          lng: number;
          speed: number | null;
          updated_at: string;
        };
        Insert: {
          trip_id: string;
          user_id: string;
          lat: number;
          lng: number;
          speed?: number | null;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['trip_live_positions']['Insert']>;
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
          country: 'TN' | 'MA';
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
          country?: 'TN' | 'MA';
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
      otp_login: {
        Args: { p_phone: string; p_code: string; p_full_name?: string | null };
        Returns:
          | { ok: true; email: string; password: string }
          | { ok: false; reason: string };
      };
      get_my_phone: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      confirm_pickup: {
        Args: { p_booking_id: string; p_code: string };
        Returns: { ok: boolean; reason?: string };
      };
      confirm_arrival: {
        Args: { p_booking_id: string };
        Returns: { ok: boolean; reason?: string };
      };
      apply_referral: {
        Args: { p_code: string };
        Returns: { ok: boolean; reason?: string };
      };
      my_referral_count: {
        Args: Record<string, never>;
        Returns: number;
      };
      admin_list_kyc: {
        Args: Record<string, never>;
        Returns: {
          doc_id: string;
          profile_id: string;
          full_name: string;
          phone: string | null;
          role: string;
          is_verified: boolean;
          doc_type: string;
          file_path: string;
          status: string;
          created_at: string;
          reviewed_at: string | null;
        }[];
      };
      admin_review_kyc: {
        Args: { p_doc_id: string; p_approve: boolean };
        Returns: { ok: boolean; reason?: string; verified?: boolean };
      };
      request_booking: {
        Args: { p_trip_id: string };
        Returns: { ok: boolean; reason?: string; reactivated?: boolean };
      };
      get_trip_vehicle: {
        Args: { p_trip_id: string };
        Returns: {
          ok: boolean;
          reason?: string;
          make?: string | null;
          model?: string | null;
          color?: string | null;
          seats?: number | null;
          revealed?: boolean;
          plate?: string | null;
          photo_url?: string | null;
        };
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
