import { Member } from './member.model';

export interface Contribution {
  id: number;
  receipt_number?: number;
  member_id: number;
  member?: Member;
  months_count: number;
  amount_per_month: number;
  total_amount: number;
  payment_method: 'cash' | 'bankily' | 'sadad' | 'masrafi';
  transaction_ref?: string;
  screenshot_url?: string;
  screenshots?: { url: string; public_id: string }[];
  paid_at: string;
  months: ContributionMonth[];
  notes?: string;
  created_at?: string;
}

export interface ContributionMonth {
  year: number;
  month: number;
}
