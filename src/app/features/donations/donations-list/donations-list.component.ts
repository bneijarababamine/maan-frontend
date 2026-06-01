import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DonationService } from '../../../core/services/donation.service';
import { DonationTypeService } from '../../../core/services/donation-type.service';
import { Donation, DonationType } from '../../../core/models/donation.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { InsufficientBalanceModalComponent, InsufficientBalanceData } from '../../../shared/components/insufficient-balance-modal/insufficient-balance-modal.component';
import { SearchableSelectComponent, SelectOption } from '../../../shared/components/searchable-select/searchable-select.component';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-donations-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule, ConfirmDialogComponent, InsufficientBalanceModalComponent, SearchableSelectComponent],
  template: `
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:10px">
        <h1 class="page-title">{{ 'DONATIONS.TITLE' | translate }}</h1>
        <span class="count-badge">{{ donations.length }}</span>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-outline" (click)="exportPdf()">{{ 'DONATIONS.EXPORT_PDF' | translate }}</button>
        <button class="btn btn-primary" routerLink="/donations/new">+ {{ 'DONATIONS.ADD' | translate }}</button>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="filter-item">
        <app-searchable-select
          [options]="yearSelectOptions"
          [value]="filterYear"
          [placeholder]="'DONATIONS.ALL_YEARS' | translate"
          (valueChange)="onYearFilter($event)">
        </app-searchable-select>
      </div>

      <div class="filter-item">
        <app-searchable-select
          [options]="typeSelectOptions"
          [value]="filterTypeId"
          [placeholder]="'DONATIONS.ALL_TYPES' | translate"
          (valueChange)="onTypeFilter($event)">
        </app-searchable-select>
      </div>

      <div class="filter-item">
        <app-searchable-select
          [options]="paymentSelectOptions"
          [value]="filterPaymentMethod"
          [placeholder]="'DONATIONS.ALL_METHODS' | translate"
          (valueChange)="onPaymentFilter($event)">
        </app-searchable-select>
      </div>

      <button *ngIf="filterYear || filterTypeId || filterPaymentMethod" class="btn-clear" (click)="clearFilters()">✕ {{ 'COMMON.RESET' | translate }}</button>
    </div>

    <!-- Total -->
    <div class="total-bar" *ngIf="!loading">
      <span class="total-label">{{ 'DONATIONS.TOTAL' | translate }} :</span>
      <span class="total-amount">{{ total | number:'1.0-0' }} {{ 'COMMON.MRU' | translate }}</span>
    </div>

    <div *ngIf="loading" class="loading-state"><div class="spinner-lg"></div></div>
    <div class="table-card" *ngIf="!loading">
      <table class="data-table">
        <thead><tr>
          <th>{{ 'DONATIONS.DONOR' | translate }}</th>
          <th>{{ 'DONATIONS.TYPE' | translate }}</th>
          <th>{{ 'DONATIONS.YEAR' | translate }}</th>
          <th>{{ 'COMMON.AMOUNT' | translate }}</th>
          <th>{{ 'CONTRIBUTIONS.PAYMENT_METHOD' | translate }}</th>
          <th>{{ 'DONATIONS.PAID_AT' | translate }}</th>
          <th></th>
        </tr></thead>
        <tbody>
          <tr *ngFor="let d of donations" class="clickable-row" (click)="goDetail(d.id)">
            <td class="fw-600">{{ donorName(d) }}</td>
            <td class="text-muted text-sm">{{ d.donation_type?.name_fr || '—' }}</td>
            <td class="text-muted text-sm">{{ d.year || '—' }}</td>
            <td class="text-green fw-600">{{ d.amount | number:'1.0-0' }} {{ 'COMMON.MRU' | translate }}</td>
            <td>
              <span class="badge" [ngClass]="{
                'success': d.payment_method === 'cash',
                'blue':    d.payment_method === 'bankily',
                'orange':  d.payment_method === 'sadad',
                'purple':  d.payment_method === 'masrafi'
              }">{{ d.payment_method || '—' }}</span>
            </td>
            <td class="text-muted text-sm">{{ d.donated_at | date:'dd/MM/yyyy' }}</td>
            <td (click)="$event.stopPropagation()">
              <div class="action-menu" (click)="toggleMenu(d.id, $event)">
                <button class="btn-dots">⋮</button>
                <div class="dropdown" *ngIf="openMenu===d.id" [ngStyle]="menuStyle" (click)="$event.stopPropagation()">
                  <a *ngIf="d.screenshot_url" [href]="d.screenshot_url" target="_blank" class="dropdown-item">{{ 'CONTRIBUTIONS.VIEW_RECEIPT' | translate }}</a>
                  <button class="dropdown-item" (click)="editDonation(d)">{{ 'COMMON.EDIT' | translate }}</button>
                  <button class="dropdown-item danger" (click)="confirmDelete(d)">{{ 'COMMON.DELETE' | translate }}</button>
                </div>
              </div>
            </td>
          </tr>
          <tr *ngIf="donations.length===0"><td colspan="7" class="empty-cell">{{ 'DONATIONS.NO_DATA' | translate }}</td></tr>
        </tbody>
      </table>
    </div>
    <app-confirm-dialog [visible]="showDelete" type="danger"
      [title]="'DONATIONS.DELETE_TITLE' | translate"
      [message]="'DONATIONS.DELETE_MSG' | translate"
      [confirmLabel]="'COMMON.DELETE' | translate" iconName="delete"
      (confirmed)="deleteConfirmed()" (cancelled)="showDelete=false"></app-confirm-dialog>

    <app-insufficient-balance-modal
      [visible]="showInsufficientModal"
      [data]="insufficientData"
      [lang]="currentLang"
      (close)="showInsufficientModal=false">
    </app-insufficient-balance-modal>
  `,
  styles: [`
    .clickable-row { cursor: pointer; transition: background .12s; }
    .clickable-row:hover { background: #f9fafb; }
    .action-menu { position: relative; display: inline-block; }
    .dropdown { position: fixed; background: #fff; border: 1px solid #E0E0E0; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.12); z-index: 1000; min-width: 130px; overflow: hidden; }
    .dropdown-item { display: block; width: 100%; padding: 9px 14px; font-size: 13px; color: #212121; text-decoration: none; border: none; background: none; cursor: pointer; text-align: left; font-family: inherit; }
    .dropdown-item:hover { background: #F5F5F5; }
    .dropdown-item.danger { color: #C62828; }
    .dropdown-item.danger:hover { background: #FFEBEE; }
    .empty-cell { text-align: center; color: #BDBDBD; padding: 40px; }

    .filters-bar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 16px; }
    .filter-item { width: 190px; }
    .btn-clear { background: none; border: 1px solid #ddd; color: #888; border-radius: 8px; padding: 8px 12px; font-size: 12px; cursor: pointer; white-space: nowrap; }
    .btn-clear:hover { background: #f5f5f5; }

    .total-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding: 12px 18px; background: #E8F5E9; border-radius: 10px; }
    .total-label { font-size: 14px; font-weight: 600; color: #555; }
    .total-amount { font-size: 18px; font-weight: 700; color: #2E7D32; }

    .btn-outline { background: #fff; border: 1.5px solid #1565C0; color: #1565C0; padding: 9px 18px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; }
    .btn-outline:hover { background: #E3F2FD; }
  `]
})
export class DonationsListComponent implements OnInit {
  donations: Donation[] = [];
  donationTypes: DonationType[] = [];
  loading = false;
  showDelete = false;
  selectedId: number | null = null;
  openMenu: number | null = null;
  menuStyle: Record<string, string> = {};
  showInsufficientModal = false;
  insufficientData: InsufficientBalanceData | null = null;

  filterYear: string | null = null;
  filterTypeId: string | null = null;
  filterPaymentMethod: string | null = null;

  yearSelectOptions: SelectOption[] = [];
  typeSelectOptions: SelectOption[] = [];
  paymentSelectOptions: SelectOption[] = [
    { id: 'cash',    label: 'Cash' },
    { id: 'bankily', label: 'Bankily' },
    { id: 'masrafi', label: 'Masrafi' },
    { id: 'sadad',   label: 'Sadad' },
  ];

  get currentLang(): string { return this.translate.currentLang || 'fr'; }
  get total(): number { return this.donations.reduce((sum, d) => sum + (d.amount || 0), 0); }

  constructor(
    private service: DonationService,
    private donationTypeService: DonationTypeService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    const currentYear = new Date().getFullYear();
    this.yearSelectOptions = Array.from({ length: 10 }, (_, i) => {
      const y = currentYear - i;
      return { id: String(y), label: String(y) };
    });

    this.donationTypeService.getAll().subscribe({
      next: res => {
        this.donationTypes = res.data;
        this.typeSelectOptions = res.data.map(t => ({ id: String(t.id), label: t.name_fr, sublabel: t.name_ar || '' }));
      }
    });

    this.load();
    document.addEventListener('click', () => { this.openMenu = null; });
  }

  load(): void {
    this.loading = true;
    const params: any = {};
    if (this.filterYear)          params.year = +this.filterYear;
    if (this.filterTypeId)        params.donation_type_id = +this.filterTypeId;
    if (this.filterPaymentMethod) params.payment_method = this.filterPaymentMethod;
    this.service.getAll(params).subscribe({
      next: res => { this.donations = res.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onYearFilter(val: string | number | null): void    { this.filterYear = val ? String(val) : null; this.load(); }
  onTypeFilter(val: string | number | null): void    { this.filterTypeId = val ? String(val) : null; this.load(); }
  onPaymentFilter(val: string | number | null): void { this.filterPaymentMethod = val ? String(val) : null; this.load(); }

  clearFilters(): void {
    this.filterYear = null;
    this.filterTypeId = null;
    this.filterPaymentMethod = null;
    this.load();
  }

  goDetail(id: number): void { this.router.navigate(['/donations', id]); }
  editDonation(d: Donation): void { this.router.navigate(['/donations', d.id, 'edit']); this.openMenu = null; }

  donorName(d: Donation): string {
    return d.donor?.full_name || d.member?.full_name || '—';
  }

  toggleMenu(id: number, event: MouseEvent): void {
    if (this.openMenu === id) { this.openMenu = null; return; }
    this.openMenu = id;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < 140) {
      this.menuStyle = { bottom: `${window.innerHeight - rect.top}px`, right: `${window.innerWidth - rect.right}px` };
    } else {
      this.menuStyle = { top: `${rect.bottom + 4}px`, right: `${window.innerWidth - rect.right}px` };
    }
  }

  confirmDelete(d: Donation): void { this.selectedId = d.id; this.showDelete = true; this.openMenu = null; }

  deleteConfirmed(): void {
    if (!this.selectedId) return;
    this.service.delete(this.selectedId).subscribe({
      next: () => { this.showDelete = false; this.load(); },
      error: (err) => {
        this.showDelete = false;
        if (err?.status === 422 && err?.error?.error === 'insufficient_balance') {
          this.insufficientData = { bank_fr: err.error.bank_fr, bank_ar: err.error.bank_ar, available: err.error.available, required: err.error.required };
          this.showInsufficientModal = true;
        }
      }
    });
  }

  exportPdf(): void {
    const lang = this.translate.currentLang || 'fr';
    const isAr = lang === 'ar';
    const dir  = isAr ? 'rtl' : 'ltr';
    const t    = (fr: string, ar: string) => isAr ? ar : fr;

    const subtitle = this.buildSubtitle();
    const totalVal = this.total.toLocaleString('fr-FR');

    const rowsHtml = this.donations.map((d, i) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#F5F8FF'}">
        <td style="padding:7px 10px;font-weight:600;color:#1a1a2e">${this.donorName(d)}</td>
        <td style="padding:7px 10px;text-align:center;color:#555">${d.donation_type?.name_fr || '—'}</td>
        <td style="padding:7px 10px;text-align:center;color:#555">${d.year || '—'}</td>
        <td style="padding:7px 10px;text-align:center;font-weight:600;color:#1565C0">${Number(d.amount).toLocaleString('fr-FR')} MRU</td>
        <td style="padding:7px 10px;text-align:center;color:#555">${d.payment_method || '—'}</td>
        <td style="padding:7px 10px;text-align:center;color:#555">${d.donated_at ? new Date(d.donated_at).toLocaleDateString('fr-FR') : '—'}</td>
      </tr>`).join('');

    const container = document.createElement('div');
    container.style.cssText = `position:fixed;top:-99999px;left:-99999px;width:794px;background:#fff;padding:28px 32px;font-family:'Cairo',Arial,sans-serif;font-size:12px;color:#212121;direction:${dir}`;
    container.innerHTML = `
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${subtitle ? '6px' : '18px'}">
        <h1 style="color:#1565C0;font-size:18px;margin:0;font-weight:700">${t('Liste des Dons', 'قائمة التبرعات')}</h1>
        <span style="color:#999;font-size:11px">${new Date().toLocaleDateString('fr-FR')}</span>
      </div>
      ${subtitle ? `<p style="color:#888;font-size:11px;margin:0 0 16px">${subtitle}</p>` : ''}
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        <thead>
          <tr style="background:#1565C0;color:#fff">
            <th style="padding:9px 10px;text-align:${isAr ? 'right' : 'left'}">${t('Donateur', 'المتبرع')}</th>
            <th style="padding:9px 10px;text-align:center;width:80px">${t('Type', 'النوع')}</th>
            <th style="padding:9px 10px;text-align:center;width:55px">${t('Année', 'السنة')}</th>
            <th style="padding:9px 10px;text-align:center;width:110px">${t('Montant', 'المبلغ')}</th>
            <th style="padding:9px 10px;text-align:center;width:80px">${t('Mode', 'الطريقة')}</th>
            <th style="padding:9px 10px;text-align:center;width:90px">${t('Date', 'التاريخ')}</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <div style="margin-top:16px;padding-top:12px;border-top:2px solid #1565C0;color:#2E7D32;font-weight:700;font-size:14px">
        ${t('Total', 'الإجمالي')} : ${totalVal} MRU
      </div>`;

    document.body.appendChild(container);
    document.fonts.load('600 12px Cairo').then(() => {
      html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(canvas => {
        document.body.removeChild(container);
        const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const imgH  = (canvas.height / canvas.width) * pageW;
        if (imgH <= pageH) {
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pageW, imgH);
        } else {
          let y = 0;
          const ratio = canvas.width / pageW;
          while (y < canvas.height) {
            const sliceH = Math.min(pageH * ratio, canvas.height - y);
            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width  = canvas.width;
            sliceCanvas.height = sliceH;
            sliceCanvas.getContext('2d')!.drawImage(canvas, 0, -y);
            if (y > 0) pdf.addPage();
            pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', 0, 0, pageW, sliceH / ratio);
            y += sliceH;
          }
        }
        pdf.save(`dons-${new Date().toISOString().slice(0, 10)}.pdf`);
      });
    });
  }

  private buildSubtitle(): string {
    const parts: string[] = [];
    if (this.filterYear) parts.push(`${this.translate.instant('DONATIONS.YEAR')} ${this.filterYear}`);
    if (this.filterTypeId) {
      const type = this.donationTypes.find(x => String(x.id) === this.filterTypeId);
      if (type) parts.push(type.name_fr);
    }
    if (this.filterPaymentMethod) parts.push(this.filterPaymentMethod);
    return parts.join(' | ');
  }
}
