import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ContributionService } from '../../../core/services/contribution.service';
import { MemberService } from '../../../core/services/member.service';
import { Member, UnpaidMonth } from '../../../core/models/member.model';
import { Contribution, ContributionMonth } from '../../../core/models/contribution.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PaymentFormComponent, PaymentData, ExistingScreenshot } from '../../../shared/components/payment-form/payment-form.component';

const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];

/**
 * selectable = can be toggled (unpaid, or part of this contribution)
 * other      = locked, paid in a different contribution
 * future     = future month, selectable for advance payment
 */
interface MonthCell { month: number; label: string; state: 'selectable'|'other'|'future'; selected: boolean; }

@Component({
  selector: 'app-contribution-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, TranslateModule, PageHeaderComponent, PaymentFormComponent],
  template: `
    <app-page-header [title]="'CONTRIBUTIONS.EDIT' | translate" backLink="/contributions"></app-page-header>
    <div *ngIf="loading" class="loading-state"><div class="spinner-lg"></div></div>
    <div class="form-card" *ngIf="!loading">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">

        <!-- Membre (verrouillé) -->
        <div class="form-group">
          <label>{{ 'CONTRIBUTIONS.MEMBER' | translate }}</label>
          <div class="locked-field">
            <span class="ms-icon lock-icon">person</span>
            <span>{{ member?.full_name }}</span>
            <span class="amount-tag" *ngIf="member">{{ member.monthly_amount | number:'1.0-0' }} {{ 'COMMON.MRU' | translate }}/mois</span>
          </div>
        </div>

        <!-- Sélecteur de mois -->
        <div class="form-group" *ngIf="member">
          <div class="year-header">
            <label>{{ 'CONTRIBUTIONS.SELECT_MONTHS' | translate }}</label>
            <div class="year-controls">
              <label class="year-label-sm">{{ 'CONTRIBUTIONS.SELECT_YEAR' | translate }}</label>
              <select class="year-select" [(ngModel)]="selectedYear" [ngModelOptions]="{standalone:true}" (change)="buildMonthGrid()">
                <option *ngFor="let y of years" [value]="y">{{ y }}</option>
              </select>
              <button type="button" class="btn-select-all" [class.is-active]="isAllYearSelected" (click)="selectAllYear()">
                {{ isAllYearSelected ? ('CONTRIBUTIONS.DESELECT_ALL' | translate) : ('CONTRIBUTIONS.SELECT_ALL_YEAR' | translate) }}
              </button>
            </div>
          </div>

          <div class="months-grid-12">
            <div *ngFor="let cell of monthGrid"
                 class="month-cell-12"
                 [class.state-selectable]="cell.state === 'selectable'"
                 [class.state-other]="cell.state === 'other'"
                 [class.state-future]="cell.state === 'future'"
                 [class.is-selected]="cell.selected"
                 (click)="toggleMonth(cell)">
              <span class="m-label">{{ cell.label }}</span>
              <span class="m-icon ms-icon" *ngIf="cell.state === 'other' && !cell.selected">lock</span>
              <span class="m-icon ms-icon" *ngIf="cell.selected">check_circle</span>
              <span class="m-icon ms-icon" *ngIf="cell.state === 'future' && !cell.selected">schedule</span>
              <span class="m-icon ms-icon" *ngIf="cell.state === 'selectable' && !cell.selected">radio_button_unchecked</span>
            </div>
          </div>

          <div class="summary-bar" *ngIf="selectedMonths.length > 0">
            <span>{{ selectedMonths.length }} {{ 'COMMON.MONTHS' | translate }}</span>
            <strong>= {{ totalAmount | number:'1.0-0' }} {{ 'COMMON.MRU' | translate }}</strong>
          </div>
          <div class="year-tags" *ngIf="selectedYears.length > 1">
            <span *ngFor="let y of selectedYears" class="year-tag">
              {{ y }}: {{ monthsForYear(y) }} {{ 'COMMON.MONTHS' | translate }}
            </span>
          </div>
        </div>

        <!-- Date -->
        <div class="form-group">
          <label>{{ 'CONTRIBUTIONS.PAID_AT' | translate }} *</label>
          <input type="date" formControlName="paid_at" class="form-control">
        </div>

        <!-- Notes -->
        <div class="form-group">
          <label>{{ 'COMMON.NOTES' | translate }}</label>
          <textarea formControlName="notes" class="form-control" rows="2"></textarea>
        </div>

        <!-- Paiement -->
        <div class="payment-section-wrapper">
          <h4 class="section-title">{{ 'CONTRIBUTIONS.PAYMENT_METHOD' | translate }}</h4>
          <app-payment-form
            [initialData]="initialPaymentData"
            [existingScreenshots]="existingScreenshots"
            (dataChange)="onPaymentChange($event)">
          </app-payment-form>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="saving || selectedMonths.length === 0">
            <span *ngIf="saving" class="spinner-sm"></span>
            {{ saving ? ('COMMON.LOADING' | translate) : ('COMMON.SAVE' | translate) }}
          </button>
          <button type="button" class="btn btn-secondary" routerLink="/contributions">{{ 'COMMON.CANCEL' | translate }}</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-card { background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); max-width: 700px; }
    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; font-weight: 600; color: #555; font-size: 14px; margin-bottom: 6px; }
    .form-control { width: 100%; padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; box-sizing: border-box; }
    .form-control:focus { border-color: #2E7D32; }

    .locked-field { display: flex; align-items: center; gap: 10px; background: #F5F5F5; border: 1px solid #E0E0E0; border-radius: 8px; padding: 10px 14px; }
    .lock-icon { color: #999; }
    .amount-tag { margin-left: auto; background: #E8F5E9; color: #2E7D32; padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 700; }
    .ms-icon { font-family: 'Material Symbols Outlined'; font-style: normal; font-weight: normal; font-variation-settings: 'FILL' 1,'wght' 400; font-size: 16px; line-height: 1; }

    .year-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px; }
    .year-controls { display: flex; align-items: center; gap: 8px; }
    .year-label-sm { font-size: 13px; color: #777; font-weight: 500; }
    .year-select { padding: 6px 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 13px; outline: none; cursor: pointer; }
    .btn-select-all { padding: 6px 12px; border: 1.5px solid #2E7D32; border-radius: 8px; background: #fff; color: #2E7D32; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all .15s; }
    .btn-select-all:hover { background: #E8F5E9; }
    .btn-select-all.is-active { background: #2E7D32; color: #fff; }
    .btn-select-all.is-active:hover { background: #1b5e20; }

    .months-grid-12 { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
    @media (max-width: 500px) { .months-grid-12 { grid-template-columns: repeat(4, 1fr); } }

    .month-cell-12 { border-radius: 10px; padding: 10px 4px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 3px; border: 2px solid transparent; transition: all .15s; }

    /* Past months — unlocked (either from this contribution or unpaid) */
    .month-cell-12.state-selectable { background: #F5F5F5; border-color: #E0E0E0; cursor: pointer; }
    .month-cell-12.state-selectable:hover { border-color: #2E7D32; background: #F1F8E9; }
    .month-cell-12.state-selectable.is-selected { background: #E8F5E9; border-color: #2E7D32; }

    /* Paid in another contribution — locked */
    .month-cell-12.state-other { background: #FFF8E1; border-color: #FFE082; cursor: default; opacity: .75; }

    /* Future month — selectable for advance payment */
    .month-cell-12.state-future { background: #EDE7F6; border-color: #CE93D8; cursor: pointer; opacity: .85; }
    .month-cell-12.state-future:hover { border-color: #7B1FA2; background: #F3E5F5; opacity: 1; }
    .month-cell-12.state-future.is-selected { background: #E8EAF6; border-color: #3949AB; opacity: 1; }

    .m-label { font-size: 12px; font-weight: 600; color: #424242; }
    .month-cell-12.state-selectable.is-selected .m-label { color: #2E7D32; }
    .month-cell-12.state-other .m-label { color: #F57F17; }
    .month-cell-12.state-future .m-label { color: #6A1B9A; }
    .month-cell-12.state-future.is-selected .m-label { color: #3949AB; }

    .m-icon { font-size: 14px; }
    .month-cell-12.state-selectable.is-selected .m-icon { color: #2E7D32; }
    .month-cell-12.state-selectable:not(.is-selected) .m-icon { color: #BDBDBD; }
    .month-cell-12.state-other .m-icon { color: #F57F17; }
    .month-cell-12.state-future.is-selected .m-icon { color: #3949AB; }
    .month-cell-12.state-future:not(.is-selected) .m-icon { color: #AB47BC; }

    .summary-bar { display: flex; justify-content: space-between; align-items: center; background: #f1f8e9; border-radius: 8px; padding: 10px 16px; margin-top: 12px; font-size: 14px; color: #2E7D32; }
    .year-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .year-tag { background: #E8EAF6; color: #3949AB; border-radius: 12px; padding: 3px 10px; font-size: 12px; font-weight: 600; }

    .section-title { font-size: 15px; font-weight: 700; color: #444; margin: 24px 0 12px; }
    .payment-section-wrapper { border: 1px solid #eee; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .form-actions { display: flex; gap: 12px; margin-top: 24px; }
    .btn { padding: 12px 28px; border-radius: 8px; border: none; cursor: pointer; font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
    .btn-primary { background: #2E7D32; color: #fff; }
    .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
    .btn-secondary { background: #eee; color: #555; }
    .spinner-sm { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-state { display: flex; justify-content: center; padding: 80px; }
    .spinner-lg { width: 40px; height: 40px; border: 4px solid #eee; border-top-color: #2E7D32; border-radius: 50%; animation: spin .8s linear infinite; }
    textarea.form-control { resize: vertical; }
  `]
})
export class ContributionEditComponent implements OnInit {
  form!: FormGroup;
  contribution: Contribution | null = null;
  member: Member | null = null;
  loading = true;
  saving = false;
  initialPaymentData: Partial<PaymentData> = {};
  existingScreenshots: ExistingScreenshot[] = [];

  /**
   * Months paid in OTHER contributions for this member (locked).
   * = allPaidSet - currentContributionMonthsSet
   */
  otherPaidSet = new Set<string>();
  currentMonthsSet = new Set<string>();

  years: number[] = [];
  selectedYear = new Date().getFullYear();
  monthGrid: MonthCell[] = [];
  selectedMonths: { year: number; month: number }[] = [];
  paymentData: PaymentData = { payment_method: 'cash', screenshots: [], keepPublicIds: [] };

  get totalAmount(): number {
    return this.selectedMonths.length * (this.member?.monthly_amount || 0);
  }

  get selectedYears(): number[] {
    return [...new Set(this.selectedMonths.map(m => m.year))].sort();
  }

  get isAllYearSelected(): boolean {
    const selectable = this.monthGrid.filter(c => c.state === 'selectable' || c.state === 'future');
    return selectable.length > 0 && selectable.every(c => c.selected);
  }

  constructor(
    private fb: FormBuilder,
    private service: ContributionService,
    private memberService: MemberService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      paid_at: ['', Validators.required],
      notes: ['']
    });
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.service.getById(id).subscribe({
      next: res => {
        this.contribution = res.data;
        this.initialPaymentData = { payment_method: res.data.payment_method, transaction_ref: res.data.transaction_ref };
        this.paymentData = { payment_method: res.data.payment_method, transaction_ref: res.data.transaction_ref, screenshots: [], keepPublicIds: [] };

        const existing: ExistingScreenshot[] = res.data.screenshots?.length
          ? res.data.screenshots
          : (res.data.screenshot_url ? [{ url: res.data.screenshot_url, public_id: '' }] : []);
        this.existingScreenshots = existing;
        this.paymentData.keepPublicIds = existing.map(s => s.public_id).filter(Boolean);

        const paidAt = res.data.paid_at ? res.data.paid_at.split('T')[0] : new Date().toISOString().split('T')[0];
        this.form.patchValue({ paid_at: paidAt, notes: res.data.notes || '' });

        this.currentMonthsSet = new Set((res.data.months || []).map((m: ContributionMonth) => `${m.year}-${m.month}`));
        this.selectedMonths = [...(res.data.months || [])];

        this.loadMemberData(res.data.member_id);
      },
      error: () => { this.loading = false; }
    });
  }

  private loadMemberData(memberId: number): void {
    this.memberService.getById(memberId).subscribe({
      next: mRes => {
        this.member = mRes.data;
        const joinDate = new Date(this.member.join_date || this.member.created_at || '2020-01-01');
        const joinYear = joinDate.getFullYear();
        const cy = new Date().getFullYear();

        // Include future years if this contribution already covers them
        const maxExistingYear = this.selectedMonths.length
          ? Math.max(...this.selectedMonths.map(m => m.year))
          : cy;
        const maxYear = Math.max(cy + 2, maxExistingYear);

        this.years = [];
        for (let y = maxYear; y >= joinYear; y--) this.years.push(y);

        // Default to the year containing the most months of this contribution
        this.selectedYear = maxExistingYear > cy ? maxExistingYear : cy;

        // Load ALL paid months, then compute which belong to other contributions
        this.memberService.getPaidMonths(memberId).subscribe({
          next: pRes => {
            const allPaid = new Set<string>((pRes.data as UnpaidMonth[]).map(m => `${m.year}-${m.month}`));
            // otherPaid = paid by any other contribution (not this one)
            this.otherPaidSet = new Set([...allPaid].filter(k => !this.currentMonthsSet.has(k)));
            this.loading = false;
            this.buildMonthGrid();
          }
        });
      }
    });
  }

  buildMonthGrid(): void {
    const now = new Date();
    const cy = now.getFullYear();
    const cm = now.getMonth() + 1;
    this.monthGrid = MONTHS_FR.map((label, i) => {
      const month = i + 1;
      const key = `${this.selectedYear}-${month}`;
      let state: 'selectable' | 'other' | 'future';

      if (this.otherPaidSet.has(key)) {
        state = 'other'; // locked — paid in a different contribution
      } else if (this.selectedYear > cy || (this.selectedYear === cy && month > cm)) {
        state = 'future'; // future — selectable for advance payment
      } else {
        state = 'selectable'; // past — can be added/removed from this contribution
      }

      const selected = this.selectedMonths.some(m => m.year === this.selectedYear && m.month === month);
      return { month, label, state, selected };
    });
  }

  toggleMonth(cell: MonthCell): void {
    // Only 'other' is locked; 'selectable' and 'future' can both be toggled
    if (cell.state === 'other') return;
    if (cell.selected) {
      this.selectedMonths = this.selectedMonths.filter(m => !(m.year === this.selectedYear && m.month === cell.month));
    } else {
      this.selectedMonths.push({ year: this.selectedYear, month: cell.month });
    }
    this.buildMonthGrid();
  }

  selectAllYear(): void {
    const selectable = this.monthGrid.filter(c => c.state === 'selectable' || c.state === 'future');
    const allSelected = selectable.length > 0 && selectable.every(c => c.selected);
    this.selectedMonths = this.selectedMonths.filter(m => m.year !== this.selectedYear);
    if (!allSelected) {
      for (const cell of selectable) {
        this.selectedMonths.push({ year: this.selectedYear, month: cell.month });
      }
    }
    this.buildMonthGrid();
  }

  monthsForYear(year: number): number {
    return this.selectedMonths.filter(m => m.year === year).length;
  }

  onPaymentChange(data: PaymentData): void { this.paymentData = data; }

  onSubmit(): void {
    if (this.form.invalid || this.selectedMonths.length === 0) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const fd = new FormData();
    fd.append('paid_at', this.form.value.paid_at);
    fd.append('notes', this.form.value.notes || '');
    fd.append('payment_method', this.paymentData.payment_method);
    if (this.paymentData.transaction_ref) fd.append('transaction_ref', this.paymentData.transaction_ref);
    this.paymentData.screenshots.forEach((f, i) => fd.append(`screenshots[${i}]`, f));
    this.paymentData.keepPublicIds.forEach((id, i) => fd.append(`keep_public_ids[${i}]`, id));
    this.selectedMonths.forEach((m, i) => {
      fd.append(`months[${i}][year]`, String(m.year));
      fd.append(`months[${i}][month]`, String(m.month));
    });
    this.service.update(this.contribution!.id, fd).subscribe({
      next: () => { this.saving = false; this.router.navigate(['/contributions']); },
      error: () => { this.saving = false; }
    });
  }
}
