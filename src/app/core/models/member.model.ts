export interface Member {
  id: number;
  full_name: string;
  gender?: 'male' | 'female';
  phone: string;
  whatsapp?: string;
  address: string;
  profession?: string;
  join_date: string;
  monthly_amount: number;
  is_active: boolean;
  notes?: string;
  unpaid_months?: UnpaidMonth[];
  created_at: string;
  updated_at?: string;
}

export interface UnpaidMonth {
  year: number;
  month: number;
}
