export interface DonationType {
  id: number;
  name_fr: string;
  name_ar?: string;
  is_active: boolean;
}

export interface Donation {
  id: number;
  receipt_number?: number;
  donor_id?: number | null;
  member_id?: number | null;
  donation_type_id?: number | null;
  year?: number | null;
  donor?:  { id: number; full_name: string; phone?: string } | null;
  member?: { id: number; full_name: string; phone?: string } | null;
  donation_type?: DonationType | null;
  amount: number;
  payment_method?: string;
  transaction_ref?: string;
  screenshot_url?: string;
  screenshots?: { url: string; public_id: string }[];
  donated_at: string;
  notes?: string;
  created_at?: string;
}
