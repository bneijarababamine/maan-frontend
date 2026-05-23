export interface Orphan {
  id: number;
  full_name: string;
  display_name: string;
  birth_date: string;
  birth_year: number;
  age: number;
  is_adult: boolean;
  months_until_18?: number;
  gender: 'male' | 'female';
  school_name?: string;
  grade?: string;
  guardian_id?: number;
  guardian_name?: string;
  guardian_phone?: string;
  guardian?: {
    id: number;
    name: string;
    father_name?: string;
    phone: string;
    whatsapp?: string;
    address?: string;
  } | null;
  address?: string;
  photo_url?: string;
  is_active: boolean;
  deactivated_reason?: 'aged_out' | 'manual' | 'other';
  siblings?: Orphan[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
}
