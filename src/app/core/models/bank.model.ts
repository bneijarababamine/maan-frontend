export interface Bank {
  id: number;
  name_fr: string;
  name_ar: string;
  logo?: string;
  balance: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
