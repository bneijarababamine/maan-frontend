import { Donor } from './donor.model';

export interface Donation {
  id: number;
  receipt_number?: number;
  donor_id: number;
  donor?: { id: number; full_name: string };
  amount: number;
  payment_method?: 'cash' | 'bankily' | 'sadad' | 'masrafi';
  transaction_ref?: string;
  screenshot_url?: string;
  screenshots?: { url: string; public_id: string }[];
  donated_at: string;
  notes?: string;
  created_at?: string;
}
