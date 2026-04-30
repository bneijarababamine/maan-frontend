export interface BankTransfer {
  id: number;
  from_bank: { id: number; name_fr: string; name_ar: string; logo?: string };
  to_bank:   { id: number; name_fr: string; name_ar: string; logo?: string };
  amount: number;
  notes?: string;
  created_by?: string;
  created_at?: string;
}
