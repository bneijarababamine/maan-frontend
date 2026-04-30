export interface Donor {
  id: number;
  full_name: string;
  gender?: 'male' | 'female';
  phone: string;
  whatsapp?: string;
  address?: string;
  type?: 'individual' | 'company';
  profession?: string;
  is_member: boolean;
  member_id?: number;
  total_donations: number;
  notes?: string;
  created_at?: string;
}
