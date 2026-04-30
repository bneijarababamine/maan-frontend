export interface Family {
  id: number;
  name?: string;
  representative_name: string;
  phone: string;
  address: string;
  members_count: number;
  is_active: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}
