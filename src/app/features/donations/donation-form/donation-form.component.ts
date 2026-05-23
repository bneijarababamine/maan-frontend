import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DonationService } from '../../../core/services/donation.service';
import { DonorService } from '../../../core/services/donor.service';
import { MemberService } from '../../../core/services/member.service';
import { DonationTypeService } from '../../../core/services/donation-type.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PaymentFormComponent, PaymentData } from '../../../shared/components/payment-form/payment-form.component';
import { SearchableSelectComponent, SelectOption } from '../../../shared/components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-donation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule, PageHeaderComponent, PaymentFormComponent, SearchableSelectComponent],
  template: `
    <app-page-header [title]="'DONATIONS.ADD' | translate" backLink="/donations"></app-page-header>
    <div class="form-card">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="form-grid">

          <!-- Toggle Donateur / Adhérent -->
          <div class="form-group full-width">
            <label>{{ 'DONATIONS.DONOR_TYPE' | translate }} *</label>
            <div class="donor-type-toggle">
              <button type="button" class="type-btn" [class.active]="donorType === 'donor'"
                      (click)="setDonorType('donor')">{{ 'DONATIONS.DONOR' | translate }}</button>
              <button type="button" class="type-btn" [class.active]="donorType === 'member'"
                      (click)="setDonorType('member')">{{ 'DONATIONS.MEMBER' | translate }}</button>
            </div>
          </div>

          <!-- Sélect selon le type -->
          <div class="form-group full-width" *ngIf="donorType === 'donor'">
            <label>{{ 'DONATIONS.DONOR' | translate }} *</label>
            <app-searchable-select
              [options]="donorOptions"
              [value]="selectedDonorId"
              [hasError]="hasError('donor_id')"
              [placeholder]="'— ' + ('DONATIONS.DONOR' | translate) + ' —'"
              (valueChange)="onDonorSelect($event)"
              [class.disabled-select]="donorLocked">
            </app-searchable-select>
          </div>

          <div class="form-group full-width" *ngIf="donorType === 'member'">
            <label>{{ 'DONATIONS.MEMBER' | translate }} *</label>
            <app-searchable-select
              [options]="memberOptions"
              [value]="selectedMemberId"
              [hasError]="hasError('member_id')"
              [placeholder]="'— ' + ('DONATIONS.MEMBER' | translate) + ' —'"
              (valueChange)="onMemberSelect($event)">
            </app-searchable-select>
          </div>

          <!-- Type de don -->
          <div class="form-group">
            <label>{{ 'DONATIONS.TYPE' | translate }}</label>
            <app-searchable-select
              [options]="donationTypeOptions"
              [value]="selectedDonationTypeId"
              [placeholder]="'— ' + ('DONATIONS.NO_TYPE' | translate) + ' —'"
              (valueChange)="onDonationTypeSelect($event)">
            </app-searchable-select>
          </div>

          <!-- Année -->
          <div class="form-group">
            <label>{{ 'DONATIONS.YEAR' | translate }} *</label>
            <input type="number" formControlName="year" class="form-control" min="2000" max="2100">
          </div>

          <div class="form-group">
            <label>{{ 'COMMON.AMOUNT' | translate }} *</label>
            <div class="input-addon-wrap">
              <input type="number" formControlName="amount" class="form-control" min="1">
              <span class="addon">{{ 'COMMON.MRU' | translate }}</span>
            </div>
          </div>

          <div class="form-group">
            <label>{{ 'DONATIONS.PAID_AT' | translate }}</label>
            <input type="date" formControlName="donated_at" class="form-control">
          </div>

          <div class="form-group full-width">
            <label>{{ 'COMMON.NOTES' | translate }}</label>
            <textarea formControlName="notes" class="form-control" rows="2"></textarea>
          </div>
        </div>

        <div class="payment-wrapper">
          <h4 class="section-title">{{ 'CONTRIBUTIONS.PAYMENT_METHOD' | translate }}</h4>
          <app-payment-form (dataChange)="onPaymentChange($event)"></app-payment-form>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="saving">
            {{ saving ? ('COMMON.LOADING' | translate) : ('COMMON.SAVE' | translate) }}
          </button>
          <button type="button" class="btn btn-secondary" routerLink="/donations">{{ 'COMMON.CANCEL' | translate }}</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-card { background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); max-width: 700px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group.full-width { grid-column: 1/-1; }
    .form-group label { font-weight: 600; color: #555; font-size: 14px; }
    .form-control { padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; }
    .form-control:focus { border-color: #1565C0; }
    .input-addon-wrap { display: flex; align-items: center; }
    .input-addon-wrap .form-control { border-radius: 8px 0 0 8px; flex: 1; }
    .addon { padding: 10px 12px; background: #f5f5f5; border: 1px solid #ddd; border-left: none; border-radius: 0 8px 8px 0; }
    .payment-wrapper { border: 1px solid #eee; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .section-title { font-size: 15px; font-weight: 700; color: #444; margin: 0 0 12px; }
    .form-actions { display: flex; gap: 12px; }
    .btn { padding: 12px 28px; border-radius: 8px; border: none; cursor: pointer; font-size: 15px; font-weight: 600; }
    .btn-primary { background: #1565C0; color: #fff; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary { background: #eee; color: #555; }
    textarea.form-control { resize: vertical; }
    .donor-type-toggle { display: flex; gap: 0; border: 1.5px solid #ddd; border-radius: 8px; overflow: hidden; width: fit-content; }
    .type-btn { padding: 9px 24px; border: none; background: #fff; color: #555; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.15s; font-family: inherit; }
    .type-btn:first-child { border-right: 1px solid #ddd; }
    .type-btn.active { background: #1565C0; color: #fff; font-weight: 600; }
    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
  `]
})
export class DonationFormComponent implements OnInit {
  form!: FormGroup;
  donorType: 'donor' | 'member' = 'donor';
  donorOptions: SelectOption[] = [];
  memberOptions: SelectOption[] = [];
  donationTypeOptions: SelectOption[] = [];
  selectedDonorId: number | null = null;
  selectedMemberId: number | null = null;
  selectedDonationTypeId: number | null = null;
  donorLocked = false;
  paymentData: PaymentData = { payment_method: 'cash', screenshots: [], keepPublicIds: [] };
  saving = false;

  constructor(
    private fb: FormBuilder,
    private service: DonationService,
    private donorService: DonorService,
    private memberService: MemberService,
    private donationTypeService: DonationTypeService,
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      donor_id:         [null],
      member_id:        [null],
      donation_type_id: [null],
      year:             [new Date().getFullYear(), [Validators.required, Validators.min(2000), Validators.max(2100)]],
      amount:           [null, [Validators.required, Validators.min(1)]],
      donated_at:       [new Date().toISOString().split('T')[0]],
      notes:            ['']
    });

    const donorId  = this.route.snapshot.queryParamMap.get('donor_id');
    const memberId = this.route.snapshot.queryParamMap.get('member_id');

    this.donorService.getAll().subscribe({
      next: res => {
        this.donorOptions = res.data.map(d => ({ id: d.id, label: d.full_name, sublabel: d.phone || '' }));
        if (donorId) {
          this.selectedDonorId = +donorId;
          this.form.get('donor_id')!.setValue(this.selectedDonorId);
          this.donorLocked = true;
        }
      }
    });

    this.memberService.getAll().subscribe({
      next: res => {
        this.memberOptions = res.data.map((m: any) => ({ id: m.id, label: m.full_name, sublabel: m.phone || '' }));
        if (memberId) {
          this.donorType = 'member';
          this.selectedMemberId = +memberId;
          this.form.get('member_id')!.setValue(this.selectedMemberId);
        }
      }
    });

    this.donationTypeService.getAll().subscribe({
      next: res => {
        this.donationTypeOptions = res.data
          .filter(t => t.is_active)
          .map(t => ({ id: t.id, label: t.name_fr, sublabel: t.name_ar || '' }));
      }
    });
  }

  setDonorType(type: 'donor' | 'member'): void {
    this.donorType = type;
    this.form.get('donor_id')!.setValue(null);
    this.form.get('member_id')!.setValue(null);
    this.selectedDonorId = null;
    this.selectedMemberId = null;
  }

  onDonorSelect(id: number | string | null): void {
    this.selectedDonorId = id as number | null;
    this.form.get('donor_id')!.setValue(id ?? null);
  }

  onMemberSelect(id: number | string | null): void {
    this.selectedMemberId = id as number | null;
    this.form.get('member_id')!.setValue(id ?? null);
  }

  onDonationTypeSelect(id: number | string | null): void {
    this.selectedDonationTypeId = id as number | null;
    this.form.get('donation_type_id')!.setValue(id ?? null);
  }

  hasError(f: string): boolean { const c = this.form.get(f); return !!(c?.invalid && c?.touched); }
  onPaymentChange(d: PaymentData): void { this.paymentData = d; }

  onSubmit(): void {
    const v = this.form.getRawValue();
    const hasSource = this.donorType === 'donor' ? !!v.donor_id : !!v.member_id;
    if (!hasSource) { this.form.markAllAsTouched(); return; }
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.saving = true;
    const fd = new FormData();
    if (this.donorType === 'donor' && v.donor_id)  fd.append('donor_id',  String(v.donor_id));
    if (this.donorType === 'member' && v.member_id) fd.append('member_id', String(v.member_id));
    if (v.donation_type_id) fd.append('donation_type_id', String(v.donation_type_id));
    fd.append('year',      String(v.year ?? new Date().getFullYear()));
    fd.append('amount',    String(v.amount));
    fd.append('payment_method', this.paymentData.payment_method);
    if (this.paymentData.transaction_ref) fd.append('transaction_ref', this.paymentData.transaction_ref);
    if (v.donated_at) fd.append('donated_at', v.donated_at);
    if (v.notes) fd.append('notes', v.notes);
    this.paymentData.screenshots.forEach((f, i) => fd.append(`screenshots[${i}]`, f));

    this.service.store(fd).subscribe({
      next: res => { this.saving = false; this.router.navigate(['/donations', res.data.id]); },
      error: () => { this.saving = false; }
    });
  }
}
