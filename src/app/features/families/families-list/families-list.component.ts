import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FamilyService } from '../../../core/services/family.service';
import { Family } from '../../../core/models/family.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface FilterChip {
  key: string;
  labelKey: string;
  color: 'default' | 'success' | 'secondary';
}

@Component({
  selector: 'app-families-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule, ConfirmDialogComponent],
  template: `
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:10px">
        <h1 class="page-title">{{ 'FAMILIES.TITLE' | translate }}</h1>
        <span class="count-badge">{{ families.length }}</span>
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
        <button class="btn btn-primary" routerLink="/families/new">+ {{ 'FAMILIES.ADD' | translate }}</button>
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

    <div *ngIf="loading" class="loading-state"><div class="spinner-lg"></div></div>
    <div class="table-card" *ngIf="!loading">
      <table class="data-table">
        <thead><tr>
          <th>{{ 'FAMILIES.NAME' | translate }}</th>
          <th>{{ 'FAMILIES.REPRESENTATIVE' | translate }}</th>
          <th>{{ 'FAMILIES.PHONE' | translate }}</th>
          <th>{{ 'FAMILIES.ADDRESS' | translate }}</th>
          <th>{{ 'FAMILIES.MEMBERS_COUNT' | translate }}</th>
          <th>{{ 'COMMON.STATUS' | translate }}</th>
          <th></th>
        </tr></thead>
        <tbody>
          <tr *ngFor="let f of families" class="clickable-row" [class.inactive-row]="!f.is_active" (click)="goDetail(f.id)">
            <td class="fw-600">{{ f.name || '—' }}</td>
            <td>{{ f.representative_name }}</td>
            <td>{{ f.phone }}</td>
            <td class="text-muted">{{ f.address }}</td>
            <td>{{ f.members_count }} {{ 'FAMILIES.PERSONS' | translate }}</td>
            <td><span class="badge" [class]="f.is_active?'success':'secondary'">{{ (f.is_active?'COMMON.ACTIVE':'COMMON.INACTIVE')|translate }}</span></td>
            <td (click)="$event.stopPropagation()">
              <div class="action-menu" (click)="toggleMenu(f.id)">
                <button class="btn-dots">⋮</button>
                <div class="dropdown" *ngIf="openMenu===f.id" (click)="$event.stopPropagation()">
                  <a class="dropdown-item" [routerLink]="['/families', f.id]">{{ 'COMMON.VIEW' | translate }}</a>
                  <a class="dropdown-item" [routerLink]="['/families', f.id, 'edit']">{{ 'COMMON.EDIT' | translate }}</a>
                  <button class="dropdown-item danger" (click)="confirmDelete(f)">{{ 'COMMON.DELETE' | translate }}</button>
                </div>
              </div>
            </td>
          </tr>
          <tr *ngIf="families.length===0"><td colspan="7" class="empty-cell">{{ 'FAMILIES.NO_DATA' | translate }}</td></tr>
        </tbody>
      </table>
    </div>
    <app-confirm-dialog [visible]="showDelete" type="danger"
      [title]="'FAMILIES.DELETE_TITLE' | translate"
      [message]="'FAMILIES.DELETE_MSG' | translate"
      [confirmLabel]="'COMMON.DELETE' | translate" iconName="delete"
      (confirmed)="deleteConfirmed()" (cancelled)="showDelete=false"></app-confirm-dialog>
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
    .inactive-row td { opacity: .6; }
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
export class FamiliesListComponent implements OnInit {
  families: Family[] = [];
  loading = false;
  search = '';
  activeFilter = '';
  showDelete = false;
  selectedId: number | null = null;
  openMenu: number | null = null;
  showExportMenu = false;
  private debounce: any;

  readonly filters: FilterChip[] = [
    { key: '',         labelKey: 'FAMILIES.FILTER_ALL',      color: 'default'   },
    { key: 'active',   labelKey: 'FAMILIES.FILTER_ACTIVE',   color: 'success'   },
    { key: 'inactive', labelKey: 'FAMILIES.FILTER_INACTIVE', color: 'secondary' },
  ];

  constructor(private service: FamilyService, private router: Router, private translate: TranslateService) {}

  ngOnInit(): void {
    this.load();
    document.addEventListener('click', () => { this.openMenu = null; this.showExportMenu = false; });
  }

  setFilter(key: string): void { this.activeFilter = key; this.load(); }

  load(): void {
    this.loading = true;
    const p: any = {};
    if (this.search) p.search = this.search;
    if (this.activeFilter === 'active')   p.is_active = true;
    if (this.activeFilter === 'inactive') p.is_active = false;
    this.service.getAll(p).subscribe({
      next: res => { this.families = res.data; this.loading = false; },
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
      : t('FAMILIES.FILTER_ALL');
    if (mode === 'simple') {
      const names = this.families.map(f => f.name || f.representative_name);
      this.generateSimplePdf(names, t('FAMILIES.TITLE'), filterLabel, '#1565C0', `familles_simple_${date.replace(/\//g,'-')}.pdf`, dir);
      return;
    }
    const thAlign = isAr ? 'right' : 'left';

    const headers = [
      t('FAMILIES.NAME'), t('FAMILIES.REPRESENTATIVE'), t('FAMILIES.PHONE'),
      t('FAMILIES.ADDRESS'), t('FAMILIES.MEMBERS_COUNT'), t('COMMON.STATUS'),
    ];

    const container = document.createElement('div');
    container.style.cssText = [
      'position:fixed', 'top:-99999px', 'left:-99999px', 'width:1122px',
      'background:#fff', 'padding:24px 28px',
      `font-family:'Cairo',Arial,sans-serif`, 'font-size:12px', 'color:#212121', `direction:${dir}`,
    ].join(';');

    container.innerHTML = `
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
      <h1 style="color:#1565C0;font-size:18px;margin-bottom:4px">${t('FAMILIES.TITLE')}</h1>
      <div style="color:#757575;font-size:11px;margin-bottom:16px">
        ${t('COMMON.DATE')}: ${date} &nbsp;|&nbsp; ${t('COMMON.FILTER')}: ${filterLabel} &nbsp;|&nbsp; ${this.families.length} ${t('COMMON.TOTAL')}
      </div>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr>${headers.map(h => `<th style="background:#1565C0;color:#fff;padding:8px 10px;text-align:${thAlign};font-weight:600;font-size:11px">${h}</th>`).join('')}</tr>
        </thead>
        <tbody>${this.families.map((f, i) => {
          const statusLabel = f.is_active ? t('COMMON.ACTIVE') : t('COMMON.INACTIVE');
          const statusColor = f.is_active ? '#2E7D32' : '#757575';
          return `<tr style="background:${i % 2 === 0 ? '#fff' : '#f0f4ff'}">
            <td style="padding:6px 10px"><strong>${f.name || '—'}</strong></td>
            <td style="padding:6px 10px">${f.representative_name || '—'}</td>
            <td style="padding:6px 10px">${f.phone || '—'}</td>
            <td style="padding:6px 10px;color:#888">${f.address || '—'}</td>
            <td style="padding:6px 10px;text-align:center">${f.members_count} ${t('FAMILIES.PERSONS')}</td>
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
        pdf.save(`familles_${new Date().toISOString().slice(0, 10)}.pdf`);
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
  goDetail(id: number): void { this.router.navigate(['/families', id]); }
  confirmDelete(f: Family): void { this.selectedId = f.id; this.showDelete = true; this.openMenu = null; }
  deleteConfirmed(): void {
    if (!this.selectedId) return;
    this.service.delete(this.selectedId).subscribe({
      next: () => { this.showDelete = false; this.load(); },
      error: () => { this.showDelete = false; }
    });
  }
}
