export interface Orphan {
  id: number;
  full_name: string;
  birth_date: string;
  age: number;
  is_adult: boolean;
  months_until_18?: number;
  gender: 'male' | 'female';
  school_name?: string;
  grade?: string;
  guardian_name: string;
  guardian_phone: string;
  address: string;
  photo_url?: string;
  is_active: boolean;
  deactivated_reason?: 'aged_out' | 'manual' | 'other';
  siblings?: Orphan[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
}
