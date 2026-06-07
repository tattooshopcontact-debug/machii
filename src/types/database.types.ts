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
    };
    Enums: {
      role_type: Role;
      trip_status: TripStatus;
      booking_status: BookingStatus;
    };
  };
};
