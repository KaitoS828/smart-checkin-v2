// Database types

export interface Property {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  wifi_ssid: string | null;
  wifi_password: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: string;
  guest_name: string | null;
  guest_name_kana: string | null;
  guest_address: string | null;
  guest_contact: string | null;
  guest_occupation: string | null;
  guest_gender: string | null;
  is_foreign_national: boolean;
  nationality: string | null;
  passport_number: string | null;
  passport_image_url: string | null;
  secret_code: string;
  door_pin: string;
  password_hash: string | null;
  whereby_room_url: string | null;
  whereby_host_room_url: string | null;
  is_checked_in: boolean;
  is_archived: boolean;
  check_in_date: string | null;
  check_out_date: string | null;
  check_in_time: string | null;
  property_id: string | null;
  stay_type: string;
  notes: string | null;
  cleaning_confirmed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Passkey {
  id: string; // credentialID
  reservation_id: string;
  public_key: string;
  counter: number;
  transports: string[] | null;
  created_at: string;
}

export interface Challenge {
  id: string;
  challenge: string;
  created_at: string;
  expires_at: string;
}

export interface Database {
  public: {
    Tables: {
      reservations: {
        Row: Reservation;
        Insert: Omit<Reservation, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Reservation>;
      };
    };
  };
}
