import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DonorService } from '../../../core/services/donor.service';
import { Donor } from '../../../core/models/donor.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { InsufficientBalanceModalComponent, InsufficientBalanceData } from '../../../shared/components/insufficient-balance-modal/insufficient-balance-modal.component';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface FilterChip {
  key: string;
  labelKey: string;
  color: 'default' | 'success' | 'secondary';
}

@Component({
  selector: 'app-donors-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule, ConfirmDialogComponent, InsufficientBalanceModalComponent],
  template: `
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:10px">
        <h1 class="page-title">{{ 'DONORS.TITLE' | translate }}</h1>
        <span class="count-badge">{{ donors.length }}</span>
      </div>
      <div style="display:flex;gap:10px">
        <div class="export-wrap" (click)="$event.stopPropagation()">
          <button class="btn btn-export" (click)="showExportMenu = !showExportMenu">
            <span class="ms-icon" style="font-size:16px">picture_as_pdf</span>
            {{ 'COMMON.EXPORT_PDF' | translate }} <span style="font-size:9px">▾</span>
          </button>
          <div class="export-dropdown" *ngIf="showExportMenu">
            <button class="export-opt" (click)="exportPdf('simple');   showExportMenu=false">📋 {{ 'COMMON.EXPORT_SIMPLE'   | translate }}</button>
            <button class="export-opt" (click)="exportPdf('complete'); showExportMenu=false">📊 {{ 'COMMON.EXPORT_COMPLETE' | translate }}</button>
          </div>
        </div>
        <button class="btn btn-primary" routerLink="/donors/new">+ {{ 'DONORS.ADD' | translate }}</button>
      </div>
    </div>

    <div class="search-bar">
      <input class="search-input" [(ngModel)]="search" (input)="onSearch()" [placeholder]="'COMMON.SEARCH' | translate">
    </div>

    <div class="filter-chips">
      <button *ngFor="let f of filters"
              class="chip chip-{{ f.color }}"
              [class.active]="activeFilter === f.key"
              (click)="setFilter(f.key)">
        <span class="chip-dot"></span>
        {{ f.labelKey | translate }}
      </button>
    </div>

    <div class="filter-chips" style="margin-top:6px">
      <button class="chip chip-default" [class.active]="genderFilter === ''" (click)="setGender('')">{{ 'DONORS.FILTER_ALL' | translate }}</button>
      <button class="chip chip-blue"    [class.active]="genderFilter === 'male'"   (click)="setGender('male')">♂ {{ 'DONORS.MALE' | translate }}</button>
      <button class="chip chip-pink"    [class.active]="genderFilter === 'female'" (click)="setGender('female')">♀ {{ 'DONORS.FEMALE' | translate }}</button>
    </div>

    <div *ngIf="loading" class="loading-state"><div class="spinner-lg"></div></div>
    <div class="table-card" *ngIf="!loading">
      <table class="data-table">
        <thead><tr>
          <th>{{ 'DONORS.FULL_NAME' | translate }}</th>
          <th>{{ 'DONORS.GENDER' | translate }}</th>
          <th>{{ 'DONORS.PHONE' | translate }}</th>
          <th>{{ 'DONORS.ADDRESS' | translate }}</th>
          <th>{{ 'DONORS.TOTAL_DONATIONS' | translate }}</th>
          <th></th>
        </tr></thead>
        <tbody>
          <tr *ngFor="let d of donors" class="clickable-row" (click)="goDetail(d.id)">
            <td class="fw-600">{{ d.full_name }}</td>
            <td>
              <span *ngIf="d.gender" class="badge" [class]="d.gender === 'male' ? 'blue' : 'pink'">
                {{ d.gender === 'male' ? '♂' : '♀' }} {{ (d.gender === 'male' ? 'DONORS.MALE' : 'DONORS.FEMALE') | translate }}
              </span>
              <span *ngIf="!d.gender" class="text-muted">—</span>
            </td>
            <td>{{ d.phone }}</td>
            <td class="text-muted">{{ d.address || '—' }}</td>
            <td class="text-green fw-600">{{ d.total_donations | number:'1.0-0' }} {{ 'COMMON.MRU' | translate }}</td>
            <td (click)="$event.stopPropagation()">
              <div class="action-menu" (click)="toggleMenu(d.id)">
                <button class="btn-dots">⋮</button>
                <div class="dropdown" *ngIf="openMenu===d.id" (click)="$event.stopPropagation()">
                  <a class="dropdown-item" [routerLink]="['/donors', d.id]">{{ 'COMMON.VIEW' | translate }}</a>
                  <a class="dropdown-item" [routerLink]="['/donors', d.id, 'edit']">{{ 'COMMON.EDIT' | translate }}</a>
                  <button class="dropdown-item danger" (click)="confirmDelete(d)">{{ 'COMMON.DELETE' | translate }}</button>
                </div>
              </div>
            </td>
          </tr>
          <tr *ngIf="donors.length===0"><td colspan="6" class="empty-cell">{{ 'DONORS.NO_DATA' | translate }}</td></tr>
        </tbody>
      </table>
    </div>
    <app-confirm-dialog [visible]="showDelete" type="danger"
      [title]="'DONORS.DELETE_TITLE' | translate"
      [message]="'DONORS.DELETE_MSG' | translate"
      [confirmLabel]="'COMMON.DELETE' | translate" iconName="person_remove"
      (confirmed)="deleteConfirmed()" (cancelled)="showDelete=false"></app-confirm-dialog>

    <app-insufficient-balance-modal
      [visible]="showInsufficientModal"
      [data]="insufficientData"
      [lang]="currentLang"
      (close)="showInsufficientModal=false">
    </app-insufficient-balance-modal>
  `,
  styles: [`
    .search-bar { margin-bottom: 12px; }
    .search-input { width: 100%; max-width: 400px; padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; box-sizing: border-box; }
    .search-input:focus { border-color: #2E7D32; }
    .filter-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
    .chip { display: flex; align-items: center; gap: 6px; padding: 7px 16px; border-radius: 20px; border: 1.5px solid; cursor: pointer; font-size: 13px; font-weight: 600; background: transparent; transition: all .15s; font-family: inherit; }
    .chip-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
    .chip-default   { border-color: #9E9E9E; color: #757575; }
    .chip-default:hover, .chip-default.active   { background: #757575; color: #fff; border-color: #757575; }
    .chip-success   { border-color: #2E7D32; color: #2E7D32; }
    .chip-success:hover, .chip-success.active   { background: #2E7D32; color: #fff; }
    .chip-secondary { border-color: #9E9E9E; color: #616161; }
    .chip-secondary:hover, .chip-secondary.active { background: #616161; color: #fff; border-color: #616161; }
    .chip-blue    { border-color: #1565C0; color: #1565C0; }
    .chip-blue:hover, .chip-blue.active    { background: #1565C0; color: #fff; }
    .chip-pink    { border-color: #C2185B; color: #C2185B; }
    .chip-pink:hover, .chip-pink.active    { background: #C2185B; color: #fff; }
    .badge { padding: 3px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; display: inline-block; }
    .badge.blue { background: #E3F2FD; color: #1565C0; }
    .badge.pink { background: #FCE4EC; color: #C2185B; }
    .btn-export { background: #fff; border: 1.5px solid #C62828; color: #C62828; border-radius: 8px; padding: 9px 16px; cursor: pointer; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px; font-family: inherit; transition: all .15s; }
    .btn-export:hover { background: #FFEBEE; }
    .export-wrap { position: relative; display: inline-block; }
    .export-dropdown { position: absolute; top: calc(100% + 4px); right: 0; background: #fff; border: 1px solid #E0E0E0; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.12); z-index: 100; min-width: 230px; overflow: hidden; }
    :host-context(body.rtl) .export-dropdown { right: auto; left: 0; }
    .export-opt { display: block; width: 100%; padding: 10px 14px; font-size: 13px; color: #212121; border: none; background: none; cursor: pointer; text-align: left; font-family: inherit; white-space: nowrap; }
    .export-opt:hover { background: #F5F5F5; }
    :host-context(body.rtl) .export-opt { text-align: right; }
    .ms-icon { font-family: 'Material Symbols Outlined'; font-style: normal; font-weight: normal; font-variation-settings: 'FILL' 1,'wght' 400; display: inline-block; line-height: 1; }
    .clickable-row { cursor: pointer; transition: background .12s; }
    .clickable-row:hover { background: #f9fafb; }
    .action-menu { position: relative; display: inline-block; }
    .dropdown { position: absolute; right: 0; top: 100%; background: #fff; border: 1px solid #E0E0E0; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.12); z-index: 50; min-width: 130px; overflow: hidden; }
    :host-context(body.rtl) .dropdown { right: auto; left: 0; }
    .dropdown-item { display: block; width: 100%; padding: 9px 14px; font-size: 13px; color: #212121; text-decoration: none; border: none; background: none; cursor: pointer; text-align: left; font-family: inherit; }
    .dropdown-item:hover { background: #F5F5F5; }
    .dropdown-item.danger { color: #C62828; }
    .dropdown-item.danger:hover { background: #FFEBEE; }
    .empty-cell { text-align: center; color: #BDBDBD; padding: 40px; }
  `]
})
export class DonorsListComponent implements OnInit {
  donors: Donor[] = [];
  loading = false;
  search = '';
  activeFilter = '';
  genderFilter = '';
  showDelete = false;
  selectedId: number | null = null;
  openMenu: number | null = null;
  showExportMenu = false;
  showInsufficientModal = false;
  insufficientData: InsufficientBalanceData | null = null;
  private debounce: any;

  get currentLang(): string { return this.translate.currentLang || 'fr'; }

  readonly filters: FilterChip[] = [
    { key: '',           labelKey: 'DONORS.FILTER_ALL',        color: 'default'   },
    { key: 'member',     labelKey: 'DONORS.FILTER_MEMBER',     color: 'success'   },
    { key: 'non_member', labelKey: 'DONORS.FILTER_NON_MEMBER', color: 'secondary' },
  ];

  constructor(private svc: DonorService, private router: Router, private translate: TranslateService) {}

  ngOnInit(): void {
    this.load();
    document.addEventListener('click', () => { this.openMenu = null; this.showExportMenu = false; });
  }

  setFilter(key: string): void { this.activeFilter = key; this.load(); }

  setGender(gender: string): void { this.genderFilter = gender; this.load(); }

  load(): void {
    this.loading = true;
    const p: any = {};
    if (this.search) p.search = this.search;
    if (this.activeFilter === 'member')     p.is_member = true;
    if (this.activeFilter === 'non_member') p.is_member = false;
    if (this.genderFilter) p.gender = this.genderFilter;
    this.svc.getAll(p).subscribe({
      next: res => { this.donors = res.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onSearch(): void { clearTimeout(this.debounce); this.debounce = setTimeout(() => this.load(), 400); }

  exportPdf(mode: 'simple' | 'complete' = 'complete'): void {
    const lang = this.translate.currentLang || 'fr';
    const isAr = lang === 'ar';
    const dir = isAr ? 'rtl' : 'ltr';
    const t = (key: string) => this.translate.instant(key);
    const date = new Date().toLocaleDateString('fr-FR');
    const filterLabel = this.activeFilter
      ? t(this.filters.find(f => f.key === this.activeFilter)?.labelKey ?? '')
      : t('DONORS.FILTER_ALL');
    if (mode === 'simple') {
      const names = this.donors.map(d => d.full_name);
      this.generateSimplePdf(names, t('DONORS.TITLE'), filterLabel, '#2E7D32', `donateurs_simple_${date.replace(/\//g,'-')}.pdf`, dir);
      return;
    }
    const thAlign = isAr ? 'right' : 'left';

    const headers = [
      t('DONORS.FULL_NAME'), t('DONORS.PHONE'), t('DONORS.ADDRESS'),
      `${t('DONORS.TOTAL_DONATIONS')} (${t('COMMON.MRU')})`,
    ];

    const container = document.createElement('div');
    container.style.cssText = [
      'position:fixed', 'top:-99999px', 'left:-99999px', 'width:1122px',
      'background:#fff', 'padding:24px 28px',
      `font-family:'Cairo',Arial,sans-serif`, 'font-size:12px', 'color:#212121', `direction:${dir}`,
    ].join(';');

    container.innerHTML = `
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
      <h1 style="color:#2E7D32;font-size:18px;margin-bottom:4px">${t('DONORS.TITLE')}</h1>
      <div style="color:#757575;font-size:11px;margin-bottom:16px">
        ${t('COMMON.DATE')}: ${date} &nbsp;|&nbsp; ${t('COMMON.FILTER')}: ${filterLabel} &nbsp;|&nbsp; ${this.donors.length} ${t('COMMON.TOTAL')}
      </div>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr>${headers.map(h => `<th style="background:#2E7D32;color:#fff;padding:8px 10px;text-align:${thAlign};font-weight:600;font-size:11px">${h}</th>`).join('')}</tr>
        </thead>
        <tbody>${this.donors.map((d, i) => `<tr style="background:${i % 2 === 0 ? '#fff' : '#f5faf5'}">
          <td style="padding:6px 10px"><strong>${d.full_name}</strong></td>
          <td style="padding:6px 10px">${d.phone || '—'}</td>
          <td style="padding:6px 10px;color:#888">${d.address || '—'}</td>
          <td style="padding:6px 10px;text-align:center;color:#2E7D32;font-weight:700">${Math.floor(d.total_donations || 0).toLocaleString('fr-FR')}</td>
        </tr>`).join('')}</tbody>
      </table>`;

    document.body.appendChild(container);
    document.fonts.load('600 12px Cairo').then(() => {
      html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(canvas => {
        document.body.removeChild(container);
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const imgH = (canvas.height / canvas.width) * pageW;
        if (imgH <= pageH) {
          pdf.addImage(imgData, 'PNG', 0, 0, pageW, imgH);
        } else {
          const ratio = canvas.width / pageW;
          const sliceH = Math.floor(pageH * ratio);
          let yOffset = 0;
          while (yOffset < canvas.height) {
            const sc = document.createElement('canvas');
            sc.width = canvas.width;
            sc.height = Math.min(sliceH, canvas.height - yOffset);
            sc.getContext('2d')!.drawImage(canvas, 0, -yOffset);
            pdf.addImage(sc.toDataURL('image/png'), 'PNG', 0, 0, pageW, pageH);
            yOffset += sliceH;
            if (yOffset < canvas.height) pdf.addPage();
          }
        }
        pdf.save(`donateurs_${new Date().toISOString().slice(0, 10)}.pdf`);
      });
    });
  }

  generateSimplePdf(names: string[], title: string, filterLabel: string, color: string, filename: string, dir: string): void {
    const t = (key: string) => this.translate.instant(key);
    const date = new Date().toLocaleDateString('fr-FR');
    const rows = names.map((n, i) =>
      `<tr style="border-bottom:1px solid #EEEEEE">
        <td style="padding:8px 10px;width:55%"><span style="color:${color};font-weight:700;min-width:22px;display:inline-block">${i + 1}.</span> ${n}</td>
        <td style="width:45%;border-left:1px solid #EEEEEE"></td>
      </tr>`
    ).join('');
    const container = document.createElement('div');
    container.style.cssText = `position:fixed;top:-99999px;left:-99999px;width:794px;background:#fff;padding:28px 32px;font-family:'Cairo',Arial,sans-serif;font-size:12px;color:#212121;direction:${dir}`;
    container.innerHTML = `
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <h1 style="color:${color};font-size:18px;margin:0">${title}</h1>
        <span style="font-size:22px;font-weight:800;color:${color}">${names.length}</span>
      </div>
      <div style="color:#999;font-size:11px;margin-bottom:12px">${t('COMMON.DATE')}: ${date} &nbsp;|&nbsp; ${filterLabel}</div>
      <hr style="border:none;border-top:2px solid ${color};margin-bottom:16px">
      <table style="width:100%;border-collapse:collapse">${rows}</table>`;
    document.body.appendChild(container);
    document.fonts.load('600 12px Cairo').then(() => {
      html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(canvas => {
        document.body.removeChild(container);
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const imgH = (canvas.height / canvas.width) * pageW;
        if (imgH <= pageH) {
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pageW, imgH);
        } else {
          const ratio = canvas.width / pageW;
          const sliceH = Math.floor(pageH * ratio);
          let yOff = 0;
          while (yOff < canvas.height) {
            const sc = document.createElement('canvas');
            sc.width = canvas.width; sc.height = Math.min(sliceH, canvas.height - yOff);
            sc.getContext('2d')!.drawImage(canvas, 0, -yOff);
            pdf.addImage(sc.toDataURL('image/png'), 'PNG', 0, 0, pageW, pageH);
            yOff += sliceH; if (yOff < canvas.height) pdf.addPage();
          }
        }
        pdf.save(filename);
      });
    });
  }

  toggleMenu(id: number): void { this.openMenu = this.openMenu === id ? null : id; }
  goDetail(id: number): void { this.router.navigate(['/donors', id]); }
  confirmDelete(d: Donor): void { this.selectedId = d.id; this.showDelete = true; this.openMenu = null; }
  deleteConfirmed(): void {
    if (!this.selectedId) return;
    this.svc.delete(this.selectedId).subscribe({
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
}
