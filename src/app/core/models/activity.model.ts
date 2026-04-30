export interface Activity {
  id: number;
  title_fr: string;
  title_ar: string;
  title?: string;
  activity_type: 'school_fees' | 'eid_help' | 'food_basket' | 'winter_clothes' | 'ramadan' | 'other';
  type?: string;
  beneficiary_type: 'orphans' | 'families' | 'general';
  payment_type?: 'financial' | 'in_kind';
  payment_method?: string;
  description_fr?: string;
  description_ar?: string;
  description?: string;
  activity_date: string;
  total_cost?: number;
  photos?: ActivityPhoto[];
  beneficiaries?: ActivityBeneficiary[];
  items?: ActivityItem[];
  created_at?: string;
}

export interface ActivityItem {
  id: number;
  activity_id?: number;
  name: string;
  quantity: number;
  unit_value: number;
  total?: number;
  payment_method?: string;
}

export interface ActivityPhoto {
  id: number;
  activity_id: number;
  photo_url: string;
  caption?: string;
  caption_fr?: string;
  caption_ar?: string;
}

export interface ActivityBeneficiary {
  id: number;
  activity_id: number;
  beneficiary_type: 'orphan' | 'family' | 'member';
  beneficiary_id: number;
  beneficiary_name?: string;
  value_received?: number;
  notes?: string;
}
