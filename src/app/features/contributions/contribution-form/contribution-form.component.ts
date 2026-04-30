import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ContributionService } from '../../../core/services/contribution.service';
import { MemberService } from '../../../core/services/member.service';
import { Member, UnpaidMonth } from '../../../core/models/member.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PaymentFormComponent, PaymentData } from '../../../shared/components/payment-form/payment-form.component';
import { SearchableSelectComponent, SelectOption } from '../../../shared/components/searchable-select/searchable-select.component';

const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];

interface MonthCell { month: number; label: string; state: 'unpaid'|'paid'|'future'; selected: boolean; }

@Component({
  selector: 'app-contribution-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, TranslateModule, PageHeaderComponent, PaymentFormComponent, SearchableSelectComponent],
  template: `
    <app-page-header [title]="'CONTRIBUTIONS.ADD' | translate" backLink="/contributions"></app-page-header>
    <div class="form-card">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">

        <!-- Membre -->
        <div class="form-group">
          <label>{{ 'CONTRIBUTIONS.MEMBER' | translate }} *</label>
          <app-searchable-select
            [options]="memberOptions"
            [value]="selectedMemberId"
            [hasError]="hasError('member_id')"
            [placeholder]="'— ' + ('CONTRIBUTIONS.MEMBER' | translate) + ' —'"
            (valueChange)="onMemberSelect($event)"
            [class.disabled-select]="memberLocked">
          </app-searchable-select>
        </div>

        <!-- Sélecteur de mois -->
        <div *ngIf="selectedMember" class="form-group">
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
                 [class.state-unpaid]="cell.state === 'unpaid'"
                 [class.state-paid]="cell.state === 'paid'"
                 [class.state-future]="cell.state === 'future'"
                 [class.is-selected]="cell.selected"
                 (click)="toggleMonth(cell)">
              <span class="m-label">{{ cell.label }}</span>
              <span class="m-icon ms-icon" *ngIf="cell.state === 'paid'">check_circle</span>
              <span class="m-icon ms-icon" *ngIf="cell.selected">check_circle</span>
              <span class="m-icon ms-icon" *ngIf="cell.state === 'future' && !cell.selected">schedule</span>
              <span class="m-icon ms-icon" *ngIf="cell.state === 'unpaid' && !cell.selected">radio_button_unchecked</span>
            </div>
          </div>

          <!-- Summary: break down by year if multi-year selection -->
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
          <app-payment-form (dataChange)="onPaymentChange($event)"></app-payment-form>
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

    /* Past, unpaid — selectable to catch up */
    .month-cell-12.state-unpaid { background: #F5F5F5; border-color: #E0E0E0; cursor: pointer; }
    .month-cell-12.state-unpaid:hover { border-color: #2E7D32; background: #F1F8E9; }
    .month-cell-12.state-unpaid.is-selected { background: #E8F5E9; border-color: #2E7D32; }

    /* Already paid — not selectable */
    .month-cell-12.state-paid { background: #F1F8E9; border-color: #A5D6A7; cursor: default; opacity: .8; }

    /* Future month — selectable for advance payment */
    .month-cell-12.state-future { background: #EDE7F6; border-color: #CE93D8; cursor: pointer; opacity: .85; }
    .month-cell-12.state-future:hover { border-color: #7B1FA2; background: #F3E5F5; opacity: 1; }
    .month-cell-12.state-future.is-selected { background: #E8EAF6; border-color: #3949AB; opacity: 1; }

    .m-label { font-size: 12px; font-weight: 600; }
    .month-cell-12.state-unpaid .m-label { color: #424242; }
    .month-cell-12.state-unpaid.is-selected .m-label { color: #2E7D32; }
    .month-cell-12.state-paid .m-label { color: #2E7D32; }
    .month-cell-12.state-future .m-label { color: #6A1B9A; }
    .month-cell-12.state-future.is-selected .m-label { color: #3949AB; }

    .ms-icon { font-family: 'Material Symbols Outlined'; font-style: normal; font-weight: normal; font-variation-settings: 'FILL' 1,'wght' 400; font-size: 14px; line-height: 1; }
    .m-icon { font-size: 14px; }
    .month-cell-12.state-paid .m-icon { color: #4CAF50; }
    .month-cell-12.state-unpaid.is-selected .m-icon { color: #2E7D32; }
    .month-cell-12.state-unpaid:not(.is-selected) .m-icon { color: #BDBDBD; }
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
    textarea.form-control { resize: vertical; }
  `]
})
export class ContributionFormComponent implements OnInit {
  form!: FormGroup;
  members: Member[] = [];
  memberOptions: SelectOption[] = [];
  selectedMemberId: number | null = null;
  selectedMember: Member | null = null;
  memberLocked = false;

  /** All months the member has already paid (past AND future advance). */
  paidSet = new Set<string>();

  years: number[] = [];
  selectedYear = new Date().getFullYear();
  monthGrid: MonthCell[] = [];
  selectedMonths: { year: number; month: number }[] = [];

  paymentData: PaymentData = { payment_method: 'cash', screenshots: [], keepPublicIds: [] };
  saving = false;

  get totalAmount(): number {
    return this.selectedMonths.length * (this.selectedMember?.monthly_amount || 0);
  }

  /** Distinct years present in the current selection (for multi-year summary). */
  get selectedYears(): number[] {
    return [...new Set(this.selectedMonths.map(m => m.year))].sort();
  }

  get isAllYearSelected(): boolean {
    const selectable = this.monthGrid.filter(c => c.state === 'unpaid' || c.state === 'future');
    return selectable.length > 0 && selectable.every(c => c.selected);
  }

  constructor(
    private fb: FormBuilder,
    private service: ContributionService,
    private memberService: MemberService,
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      member_id: ['', Validators.required],
      paid_at: [new Date().toISOString().split('T')[0], Validators.required],
      notes: ['']
    });
    const memberId = this.route.snapshot.queryParamMap.get('member_id');
    this.memberService.getAll({ is_active: true }).subscribe({
      next: res => {
        this.members = res.data;
        this.memberOptions = res.data.map(m => ({
          id: m.id,
          label: m.full_name,
          sublabel: `${m.monthly_amount | 0} ${this.translate.instant('COMMON.MRU')}/mois · ${m.phone || ''}`
        }));
        if (memberId) {
          const id = +memberId;
          this.form.get('member_id')!.setValue(id);
          this.form.get('member_id')!.disable();
          this.selectedMemberId = id;
          this.memberLocked = true;
          this.onMemberChange();
        }
      }
    });
  }

  hasError(f: string): boolean {
    const c = this.form.get(f);
    return !!(c?.invalid && c?.touched);
  }

  onMemberSelect(id: number | string | null): void {
    this.selectedMemberId = id as number | null;
    this.form.get('member_id')!.setValue(id ?? '');
    this.onMemberChange();
  }

  onMemberChange(): void {
    const id = +(this.form.getRawValue().member_id);
    this.selectedMember = null;
    this.paidSet = new Set();
    this.selectedMonths = [];
    this.monthGrid = [];
    if (!id) return;
    this.selectedMember = this.members.find(m => m.id === id) || null;
    if (!this.selectedMember) return;

    const joinDate = new Date(this.selectedMember.join_date || this.selectedMember.created_at || '2026-01-01');
    const joinYear = Math.max(joinDate.getFullYear(), 2026);
    const currentYear = new Date().getFullYear();
    this.years = [];
    // Allow selecting up to 2 years in advance
    for (let y = currentYear + 2; y >= joinYear; y--) this.years.push(y);
    this.selectedYear = currentYear;

    // Use paid-months so we know ALL paid months (past AND advance)
    this.memberService.getPaidMonths(id).subscribe({
      next: res => {
        this.paidSet = new Set((res.data as UnpaidMonth[]).map(m => `${m.year}-${m.month}`));
        this.buildMonthGrid();
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
      let state: 'unpaid' | 'paid' | 'future';

      if (this.paidSet.has(key)) {
        state = 'paid';
      } else if (this.selectedYear > cy || (this.selectedYear === cy && month > cm)) {
        // Future month, not yet paid → available for advance payment
        state = 'future';
      } else {
        // Past month, not paid → available to catch up
        state = 'unpaid';
      }

      const selected = this.selectedMonths.some(m => m.year === this.selectedYear && m.month === month);
      return { month, label, state, selected };
    });
  }

  toggleMonth(cell: MonthCell): void {
    if (cell.state === 'paid') return;
    if (cell.selected) {
      this.selectedMonths = this.selectedMonths.filter(m => !(m.year === this.selectedYear && m.month === cell.month));
    } else {
      this.selectedMonths.push({ year: this.selectedYear, month: cell.month });
    }
    this.buildMonthGrid();
  }

  /** Select/deselect all non-paid months of the current year (both past unpaid and future). */
  selectAllYear(): void {
    const selectable = this.monthGrid.filter(c => c.state === 'unpaid' || c.state === 'future');
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
    fd.append('member_id', String(this.form.getRawValue().member_id));
    fd.append('paid_at', this.form.value.paid_at);
    fd.append('notes', this.form.value.notes || '');
    fd.append('payment_method', this.paymentData.payment_method);
    if (this.paymentData.transaction_ref) fd.append('transaction_ref', this.paymentData.transaction_ref);
    this.paymentData.screenshots.forEach((f, i) => fd.append(`screenshots[${i}]`, f));
    this.selectedMonths.forEach((m, i) => {
      fd.append(`months[${i}][year]`, String(m.year));
      fd.append(`months[${i}][month]`, String(m.month));
    });
    this.service.store(fd).subscribe({
      next: res => { this.saving = false; this.router.navigate(['/contributions', res.data.id]); },
      error: () => { this.saving = false; }
    });
  }
}
