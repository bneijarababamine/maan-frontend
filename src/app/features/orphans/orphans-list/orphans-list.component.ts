import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OrphanService } from '../../../core/services/orphan.service';
import { Orphan } from '../../../core/models/orphan.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface FilterChip {
  key: string;
  labelKey: string;
  color: 'default' | 'success' | 'secondary' | 'orange' | 'danger';
}

@Component({
  selector: 'app-orphans-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule, ConfirmDialogComponent],
  template: `
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:10px">
        <h1 class="page-title">{{ 'ORPHANS.TITLE' | translate }}</h1>
        <span class="count-badge">{{ orphans.length }}</span>
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
        <button class="btn btn-primary" routerLink="/orphans/new">+ {{ 'ORPHANS.ADD' | translate }}</button>
      </div>
    </div>

    <div class="alert-bar" *ngIf="near18Count > 0">⚠ {{ near18Count }} {{ 'ORPHANS.NEAR_18' | translate }}</div>

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
      <button class="chip chip-default" [class.active]="genderFilter === ''"       (click)="setGender('')">{{ 'ORPHANS.FILTER_ALL' | translate }}</button>
      <button class="chip chip-blue"    [class.active]="genderFilter === 'male'"   (click)="setGender('male')">♂ {{ 'ORPHANS.MALE' | translate }}</button>
      <button class="chip chip-pink"    [class.active]="genderFilter === 'female'" (click)="setGender('female')">♀ {{ 'ORPHANS.FEMALE' | translate }}</button>
    </div>

    <div *ngIf="loading" class="loading-state"><div class="spinner-lg"></div></div>
    <div class="table-card" *ngIf="!loading">
      <table class="data-table">
        <thead><tr>
          <th>{{ 'ORPHANS.TITLE' | translate }}</th>
          <th>{{ 'ORPHANS.AGE' | translate }}</th>
          <th>{{ 'ORPHANS.GENDER' | translate }}</th>
          <th>{{ 'ORPHANS.GUARDIAN' | translate }}</th>
          <th>{{ 'COMMON.STATUS' | translate }}</th>
          <th></th>
        </tr></thead>
        <tbody>
          <tr *ngFor="let o of orphans" class="clickable-row" (click)="goDetail(o.id)">
            <td>
              <div class="orphan-cell">
                <img *ngIf="o.photo_url" [src]="o.photo_url" class="o-avatar" [alt]="o.full_name">
                <span *ngIf="!o.photo_url" class="o-initials">{{ o.full_name.charAt(0) }}</span>
                <span class="fw-600">{{ o.full_name }}</span>
              </div>
            </td>
            <td>
              <div>{{ o.age }} {{ 'COMMON.YEARS' | translate }}</div>
              <span *ngIf="o.is_adult" class="badge danger">{{ 'ORPHANS.AGED_OUT' | translate }}</span>
              <span *ngIf="!o.is_adult && (o.months_until_18||99)<=6" class="badge warning">{{ o.months_until_18 }} {{ 'COMMON.MONTHS' | translate }}</span>
            </td>
            <td><span class="badge" [class]="o.gender==='male'?'blue':'purple'">{{ (o.gender==='male'?'ORPHANS.MALE':'ORPHANS.FEMALE')|translate }}</span></td>
            <td>
              <div>{{ o.guardian_name }}</div>
              <div class="text-muted text-sm">{{ o.guardian_phone }}</div>
            </td>
            <td><span class="badge" [class]="o.is_active?'success':'secondary'">{{ (o.is_active?'ORPHANS.STATUS_ACTIVE':'ORPHANS.STATUS_INACTIVE')|translate }}</span></td>
            <td (click)="$event.stopPropagation()">
              <div class="action-menu" (click)="toggleMenu(o.id)">
                <button class="btn-dots">⋮</button>
                <div class="dropdown" *ngIf="openMenu===o.id" (click)="$event.stopPropagation()">
                  <a class="dropdown-item" [routerLink]="['/orphans', o.id]">{{ 'COMMON.VIEW' | translate }}</a>
                  <a class="dropdown-item" [routerLink]="['/orphans', o.id, 'edit']">{{ 'COMMON.EDIT' | translate }}</a>
                  <button class="dropdown-item danger" (click)="confirmDelete(o)">{{ 'COMMON.DELETE' | translate }}</button>
                </div>
              </div>
            </td>
          </tr>
          <tr *ngIf="orphans.length===0"><td colspan="6" class="empty-cell">{{ 'ORPHANS.NO_DATA' | translate }}</td></tr>
        </tbody>
      </table>
    </div>
    <app-confirm-dialog [visible]="showDelete" type="danger"
      [title]="'ORPHANS.DELETE_TITLE' | translate"
      [message]="'ORPHANS.DELETE_MSG' | translate"
      [confirmLabel]="'COMMON.DELETE' | translate" iconName="delete"
      (confirmed)="deleteConfirmed()" (cancelled)="showDelete=false"></app-confirm-dialog>
  `,
  styles: [`
    .search-bar { margin-bottom: 12px; }
    .search-input { width: 100%; max-width: 400px; padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; box-sizing: border-box; }
    .search-input:focus { border-color: #2E7D32; }
    .alert-bar { background: #FFF8E1; color: #F57F17; border: 1px solid #FFE082; border-radius: 8px; padding: 10px 16px; margin-bottom: 14px; font-size: 13px; font-weight: 500; }
    .filter-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
    .chip { display: flex; align-items: center; gap: 6px; padding: 7px 16px; border-radius: 20px; border: 1.5px solid; cursor: pointer; font-size: 13px; font-weight: 600; background: transparent; transition: all .15s; font-family: inherit; }
    .chip-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
    .chip-default   { border-color: #9E9E9E; color: #757575; }
    .chip-default:hover, .chip-default.active   { background: #757575; color: #fff; border-color: #757575; }
    .chip-success   { border-color: #2E7D32; color: #2E7D32; }
    .chip-success:hover, .chip-success.active   { background: #2E7D32; color: #fff; }
    .chip-secondary { border-color: #9E9E9E; color: #616161; }
    .chip-secondary:hover, .chip-secondary.active { background: #616161; color: #fff; border-color: #616161; }
    .chip-orange  { border-color: #E65100; color: #E65100; }
    .chip-orange:hover, .chip-orange.active   { background: #E65100; color: #fff; }
    .chip-danger  { border-color: #C62828; color: #C62828; }
    .chip-danger:hover, .chip-danger.active   { background: #C62828; color: #fff; }
    .chip-blue    { border-color: #1565C0; color: #1565C0; }
    .chip-blue:hover, .chip-blue.active       { background: #1565C0; color: #fff; }
    .chip-pink    { border-color: #C2185B; color: #C2185B; }
    .chip-pink:hover, .chip-pink.active       { background: #C2185B; color: #fff; }
    .btn-export { background: #fff; border: 1.5px solid #C62828; color: #C62828; border-radius: 8px; padding: 9px 16px; cursor: pointer; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px; font-family: inherit; transition: all .15s; }
    .btn-export:hover { background: #FFEBEE; }
    .export-wrap { position: relative; display: inline-block; }
    .export-dropdown { position: absolute; top: calc(100% + 4px); right: 0; background: #fff; border: 1px solid #E0E0E0; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.12); z-index: 100; min-width: 230px; overflow: hidden; }
    :host-context(body.rtl) .export-dropdown { right: auto; left: 0; }
    .export-opt { display: block; width: 100%; padding: 10px 14px; font-size: 13px; color: #212121; border: none; background: none; cursor: pointer; text-align: left; font-family: inherit; white-space: nowrap; }
    .export-opt:hover { background: #F5F5F5; }
    :host-context(body.rtl) .export-opt { text-align: right; }
    .ms-icon { font-family: 'Material Symbols Outlined'; font-style: normal; font-weight: normal; font-variation-settings: 'FILL' 1,'wght' 400; display: inline-block; line-height: 1; }
    .orphan-cell { display: flex; align-items: center; gap: 10px; }
    .o-avatar { width: 32px; height: 32px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
    .o-initials { width: 32px; height: 32px; border-radius: 8px; background: #E64A19; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; flex-shrink: 0; }
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
export class OrphansListComponent implements OnInit {
  orphans: Orphan[] = [];
  loading = false;
  search = '';
  activeFilter = '';
  genderFilter = '';
  showDelete = false;
  selectedId: number | null = null;
  openMenu: number | null = null;
  showExportMenu = false;
  private debounce: any;

  readonly filters: FilterChip[] = [
    { key: '',           labelKey: 'ORPHANS.FILTER_ALL',      color: 'default'   },
    { key: 'active',     labelKey: 'ORPHANS.FILTER_ACTIVE',   color: 'success'   },
    { key: 'inactive',   labelKey: 'ORPHANS.FILTER_INACTIVE', color: 'secondary' },
    { key: 'near_adult', labelKey: 'ORPHANS.FILTER_NEAR_18',  color: 'orange'    },
    { key: 'aged_out',   labelKey: 'ORPHANS.FILTER_AGED_OUT', color: 'danger'    },
  ];

  get near18Count(): number { return this.orphans.filter(o => !o.is_adult && (o.months_until_18 || 99) <= 6).length; }

  constructor(private svc: OrphanService, private router: Router, private translate: TranslateService) {}

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
    if (this.activeFilter) p.status = this.activeFilter;
    if (this.genderFilter) p.gender = this.genderFilter;
    this.svc.getAll(p).subscribe({
      next: res => { this.orphans = res.data; this.loading = false; },
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
      : t('ORPHANS.FILTER_ALL');
    if (mode === 'simple') {
      const names = this.orphans.map(o => o.full_name);
      this.generateSimplePdf(names, t('ORPHANS.TITLE'), filterLabel, '#E64A19', `orphelins_simple_${date.replace(/\//g,'-')}.pdf`, dir);
      return;
    }
    const thAlign = isAr ? 'right' : 'left';

    const headers = [
      t('ORPHANS.TITLE'), t('ORPHANS.AGE'), t('ORPHANS.GENDER'),
      t('ORPHANS.GUARDIAN'), t('ORPHANS.GUARDIAN_PHONE'), t('COMMON.STATUS'),
    ];

    const container = document.createElement('div');
    container.style.cssText = [
      'position:fixed', 'top:-99999px', 'left:-99999px', 'width:1122px',
      'background:#fff', 'padding:24px 28px',
      `font-family:'Cairo',Arial,sans-serif`, 'font-size:12px', 'color:#212121', `direction:${dir}`,
    ].join(';');

    container.innerHTML = `
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
      <h1 style="color:#E64A19;font-size:18px;margin-bottom:4px">${t('ORPHANS.TITLE')}</h1>
      <div style="color:#757575;font-size:11px;margin-bottom:16px">
        ${t('COMMON.DATE')}: ${date} &nbsp;|&nbsp; ${t('COMMON.FILTER')}: ${filterLabel} &nbsp;|&nbsp; ${this.orphans.length} ${t('COMMON.TOTAL')}
      </div>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr>${headers.map(h => `<th style="background:#E64A19;color:#fff;padding:8px 10px;text-align:${thAlign};font-weight:600;font-size:11px">${h}</th>`).join('')}</tr>
        </thead>
        <tbody>${this.orphans.map((o, i) => {
          const genderLabel = o.gender === 'male' ? t('ORPHANS.MALE') : t('ORPHANS.FEMALE');
          const statusLabel = o.is_active ? t('ORPHANS.STATUS_ACTIVE') : t('ORPHANS.STATUS_INACTIVE');
          const statusColor = o.is_active ? '#2E7D32' : '#757575';
          const ageSuffix = o.is_adult
            ? `<span style="color:#C62828;font-size:10px">(${t('ORPHANS.AGED_OUT')})</span>`
            : (o.months_until_18 || 99) <= 6
              ? `<span style="color:#E65100;font-size:10px">(${o.months_until_18} ${t('COMMON.MONTHS')})</span>`
              : '';
          return `<tr style="background:${i % 2 === 0 ? '#fff' : '#fff8f5'}">
            <td style="padding:6px 10px"><strong>${o.full_name}</strong></td>
            <td style="padding:6px 10px">${o.age} ${t('COMMON.YEARS')} ${ageSuffix}</td>
            <td style="padding:6px 10px">${genderLabel}</td>
            <td style="padding:6px 10px">${o.guardian_name || '—'}</td>
            <td style="padding:6px 10px">${o.guardian_phone || '—'}</td>
            <td style="padding:6px 10px;color:${statusColor};font-weight:600">${statusLabel}</td>
          </tr>`;
        }).join('')}</tbody>
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
        pdf.save(`orphelins_${new Date().toISOString().slice(0, 10)}.pdf`);
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
  goDetail(id: number): void { this.router.navigate(['/orphans', id]); }
  confirmDelete(o: Orphan): void { this.selectedId = o.id; this.showDelete = true; this.openMenu = null; }
  deleteConfirmed(): void {
    if (!this.selectedId) return;
    this.svc.delete(this.selectedId).subscribe({
      next: () => { this.showDelete = false; this.load(); },
      error: () => { this.showDelete = false; }
    });
  }
}
