import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DonationService } from '../../../core/services/donation.service';
import { DonationTypeService } from '../../../core/services/donation-type.service';
import { Donation } from '../../../core/models/donation.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PaymentFormComponent, PaymentData, ExistingScreenshot } from '../../../shared/components/payment-form/payment-form.component';
import { SearchableSelectComponent, SelectOption } from '../../../shared/components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-donation-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule, PageHeaderComponent, PaymentFormComponent, SearchableSelectComponent],
  template: `
    <app-page-header [title]="'DONATIONS.EDIT' | translate" backLink="/donations"></app-page-header>

    <div *ngIf="loading" class="loading-state"><div class="spinner-lg"></div></div>

    <div class="form-card" *ngIf="!loading && donation">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">

        <div class="form-group">
          <label>{{ 'DONATIONS.DONOR' | translate }}</label>
          <div class="locked-field">
            <span class="ms-icon">person</span>
            <span>{{ donation.donor?.full_name || donation.member?.full_name || '—' }}</span>
          </div>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label>{{ 'COMMON.AMOUNT' | translate }} *</label>
            <div class="input-addon-wrap">
              <input type="number" formControlName="amount" class="form-control" min="1">
              <span class="addon">{{ 'COMMON.MRU' | translate }}</span>
            </div>
          </div>

          <div class="form-group">
            <label>{{ 'DONATIONS.YEAR' | translate }} *</label>
            <input type="number" formControlName="year" class="form-control" min="2000" max="2100">
          </div>

          <div class="form-group">
            <label>{{ 'DONATIONS.TYPE' | translate }}</label>
            <app-searchable-select
              [options]="donationTypeOptions"
              [value]="selectedDonationTypeId"
              [placeholder]="'— ' + ('DONATIONS.NO_TYPE' | translate) + ' —'"
              (valueChange)="onDonationTypeSelect($event)">
            </app-searchable-select>
          </div>

          <div class="form-group">
            <label>{{ 'DONATIONS.PAID_AT' | translate }} *</label>
            <input type="date" formControlName="donated_at" class="form-control">
          </div>

          <div class="form-group full-width">
            <label>{{ 'COMMON.NOTES' | translate }}</label>
            <textarea formControlName="notes" class="form-control" rows="2"></textarea>
          </div>
        </div>

        <div class="payment-wrapper">
          <h4 class="section-title">{{ 'CONTRIBUTIONS.PAYMENT_METHOD' | translate }}</h4>
          <app-payment-form
            [initialData]="initialPaymentData"
            [existingScreenshots]="existingScreenshots"
            (dataChange)="onPaymentChange($event)">
          </app-payment-form>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="saving">
            <span *ngIf="saving" class="spinner-sm"></span>
            {{ saving ? ('COMMON.LOADING' | translate) : ('COMMON.SAVE' | translate) }}
          </button>
          <button type="button" class="btn btn-secondary" [routerLink]="['/donations', donation.id]">{{ 'COMMON.CANCEL' | translate }}</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-card { background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); max-width: 700px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 4px; }
    .form-group label { font-weight: 600; color: #555; font-size: 14px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 4px; }
    .form-group.full-width { grid-column: 1/-1; }
    .form-control { padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; }
    .form-control:focus { border-color: #1565C0; }
    .input-addon-wrap { display: flex; align-items: center; }
    .input-addon-wrap .form-control { border-radius: 8px 0 0 8px; flex: 1; }
    .addon { padding: 10px 12px; background: #f5f5f5; border: 1px solid #ddd; border-left: none; border-radius: 0 8px 8px 0; font-size: 14px; }
    .locked-field { display: flex; align-items: center; gap: 10px; background: #F5F5F5; border: 1px solid #E0E0E0; border-radius: 8px; padding: 10px 14px; margin-bottom: 20px; }
    .ms-icon { font-family: 'Material Symbols Outlined'; font-style: normal; font-weight: normal; font-variation-settings: 'FILL' 1,'wght' 400; font-size: 18px; color: #999; line-height: 1; }
    .payment-wrapper { border: 1px solid #eee; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .section-title { font-size: 15px; font-weight: 700; color: #444; margin: 0 0 12px; }
    .form-actions { display: flex; gap: 12px; margin-top: 8px; }
    .btn { padding: 12px 28px; border-radius: 8px; border: none; cursor: pointer; font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
    .btn-primary { background: #1565C0; color: #fff; }
    .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
    .btn-secondary { background: #eee; color: #555; }
    textarea.form-control { resize: vertical; }
    .spinner-sm { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-state { display: flex; justify-content: center; padding: 80px; }
    .spinner-lg { width: 40px; height: 40px; border: 4px solid #eee; border-top-color: #1565C0; border-radius: 50%; animation: spin .8s linear infinite; }
    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
  `]
})
export class DonationEditComponent implements OnInit {
  form!: FormGroup;
  donation: Donation | null = null;
  loading = true;
  saving = false;
  initialPaymentData: Partial<PaymentData> = {};
  existingScreenshots: ExistingScreenshot[] = [];
  paymentData: PaymentData = { payment_method: 'cash', screenshots: [], keepPublicIds: [] };
  donationTypeOptions: SelectOption[] = [];
  selectedDonationTypeId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private service: DonationService,
    private donationTypeService: DonationTypeService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      amount:           [null, [Validators.required, Validators.min(1)]],
      year:             [new Date().getFullYear(), [Validators.required, Validators.min(2000), Validators.max(2100)]],
      donation_type_id: [null],
      donated_at:       [''],
      notes:            ['']
    });

    this.donationTypeService.getAll().subscribe({
      next: res => {
        this.donationTypeOptions = res.data
          .filter(t => t.is_active)
          .map(t => ({ id: t.id, label: t.name_fr, sublabel: t.name_ar || '' }));
      }
    });

    const id = +this.route.snapshot.paramMap.get('id')!;
    this.service.getById(id).subscribe({
      next: res => {
        this.donation = res.data;
        this.initialPaymentData = {
          payment_method: res.data.payment_method,
          transaction_ref: res.data.transaction_ref
        };
        this.paymentData = {
          payment_method: res.data.payment_method || 'cash',
          transaction_ref: res.data.transaction_ref,
          screenshots: [],
          keepPublicIds: []
        };

        const existing: ExistingScreenshot[] = res.data.screenshots?.length
          ? res.data.screenshots
          : (res.data.screenshot_url ? [{ url: res.data.screenshot_url, public_id: '' }] : []);
        this.existingScreenshots = existing;
        this.paymentData.keepPublicIds = existing.map(s => s.public_id).filter(Boolean);

        this.selectedDonationTypeId = res.data.donation_type_id ?? null;

        this.form.patchValue({
          amount:           res.data.amount,
          year:             res.data.year ?? new Date().getFullYear(),
          donation_type_id: res.data.donation_type_id ?? null,
          donated_at:       res.data.donated_at ? res.data.donated_at.split('T')[0] : '',
          notes:            res.data.notes || ''
        });

        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onDonationTypeSelect(id: number | string | null): void {
    this.selectedDonationTypeId = id as number | null;
    this.form.get('donation_type_id')!.setValue(id ?? null);
  }

  onPaymentChange(data: PaymentData): void { this.paymentData = data; }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const v = this.form.value;
    const fd = new FormData();
    if (this.donation?.donor_id)  fd.append('donor_id',  String(this.donation.donor_id));
    if (this.donation?.member_id) fd.append('member_id', String(this.donation.member_id));
    fd.append('amount',          v.amount);
    fd.append('year',            String(v.year ?? new Date().getFullYear()));
    if (v.donation_type_id) fd.append('donation_type_id', String(v.donation_type_id));
    fd.append('donated_at',      v.donated_at);
    fd.append('notes',           v.notes || '');
    fd.append('payment_method',  this.paymentData.payment_method);
    if (this.paymentData.transaction_ref) fd.append('transaction_ref', this.paymentData.transaction_ref);
    this.paymentData.screenshots.forEach((f, i) => fd.append(`screenshots[${i}]`, f));
    this.paymentData.keepPublicIds.forEach((pid, i) => fd.append(`keep_public_ids[${i}]`, pid));

    this.service.update(this.donation!.id, fd).subscribe({
      next: res => { this.saving = false; this.router.navigate(['/donations', res.data.id]); },
      error: () => { this.saving = false; }
    });
  }
}
