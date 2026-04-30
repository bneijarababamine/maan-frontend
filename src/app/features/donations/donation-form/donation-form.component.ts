import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DonationService } from '../../../core/services/donation.service';
import { DonorService } from '../../../core/services/donor.service';
import { Donor } from '../../../core/models/donor.model';
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
          <div class="form-group full-width">
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

          <div class="form-group">
            <label>{{ 'DONATIONS.TYPE' | translate }} *</label>
            <app-searchable-select
              [options]="typeOptions"
              [value]="selectedType"
              [placeholder]="'— ' + ('DONATIONS.TYPE' | translate) + ' —'"
              (valueChange)="onTypeSelect($event)">
            </app-searchable-select>
          </div>

          <div class="form-group" *ngIf="form.value.type === 'money'">
            <label>{{ 'COMMON.AMOUNT' | translate }} *</label>
            <div class="input-addon-wrap">
              <input type="number" formControlName="amount" class="form-control" min="0">
              <span class="addon">{{ 'COMMON.MRU' | translate }}</span>
            </div>
          </div>
          <div class="form-group" *ngIf="form.value.type === 'kind'">
            <label>{{ 'DONATIONS.DESCRIPTION' | translate }} *</label>
            <input type="text" formControlName="description" class="form-control">
          </div>
          <div class="form-group">
            <label>{{ 'DONATIONS.PAID_AT' | translate }} *</label>
            <input type="date" formControlName="paid_at" class="form-control">
          </div>
          <div class="form-group full-width">
            <label>{{ 'COMMON.NOTES' | translate }}</label>
            <textarea formControlName="notes" class="form-control" rows="2"></textarea>
          </div>
        </div>

        <div *ngIf="form.value.type === 'money'" class="payment-wrapper">
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
    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
  `]
})
export class DonationFormComponent implements OnInit {
  form!: FormGroup;
  donors: Donor[] = [];
  donorOptions: SelectOption[] = [];
  selectedDonorId: number | null = null;
  donorLocked = false;
  selectedType: string = 'money';
  typeOptions: SelectOption[] = [];
  paymentData: PaymentData = { payment_method: 'cash', screenshots: [], keepPublicIds: [] };
  saving = false;

  constructor(
    private fb: FormBuilder,
    private service: DonationService,
    private donorService: DonorService,
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      donor_id: ['', Validators.required],
      type: ['money', Validators.required],
      amount: [null],
      description: [''],
      paid_at: [new Date().toISOString().split('T')[0], Validators.required],
      notes: ['']
    });

    this.typeOptions = [
      { id: 'money', label: this.translate.instant('DONATIONS.TYPE_MONEY') },
      { id: 'kind',  label: this.translate.instant('DONATIONS.TYPE_KIND') }
    ];

    const donorId = this.route.snapshot.queryParamMap.get('donor_id');
    this.donorService.getAll().subscribe({
      next: res => {
        this.donors = res.data;
        this.donorOptions = res.data.map(d => ({
          id: d.id,
          label: d.full_name,
          sublabel: d.phone || ''
        }));
        if (donorId) {
          const id = +donorId;
          this.form.get('donor_id')!.setValue(id);
          this.form.get('donor_id')!.disable();
          this.selectedDonorId = id;
          this.donorLocked = true;
        }
      },
      error: () => {}
    });
  }

  onDonorSelect(id: number | string | null): void {
    this.selectedDonorId = id as number | null;
    this.form.get('donor_id')!.setValue(id ?? '');
  }

  onTypeSelect(val: number | string | null): void {
    this.selectedType = (val as string) || 'money';
    this.form.get('type')!.setValue(this.selectedType);
  }

  hasError(f: string): boolean { const c = this.form.get(f); return !!(c?.invalid && c?.touched); }
  onPaymentChange(d: PaymentData): void { this.paymentData = d; }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const fd = new FormData();
    const v = this.form.getRawValue();
    fd.append('donor_id', v.donor_id);
    fd.append('type', v.type);
    fd.append('paid_at', v.paid_at);
    if (v.notes) fd.append('notes', v.notes);
    if (v.type === 'money') {
      fd.append('amount', v.amount);
      fd.append('payment_method', this.paymentData.payment_method);
      if (this.paymentData.transaction_ref) fd.append('transaction_ref', this.paymentData.transaction_ref);
      this.paymentData.screenshots.forEach((f, i) => fd.append(`screenshots[${i}]`, f));
    } else {
      fd.append('description', v.description);
    }
    this.service.store(fd).subscribe({
      next: res => { this.saving = false; this.router.navigate(['/donations', res.data.id]); },
      error: () => { this.saving = false; }
    });
  }
}
