import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ChronicPatientService, ChronicPatient } from '../../../core/services/chronic-patient.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { collectRowBreaks, renderCanvasToPdf } from '../../../shared/utils/pdf.utils';

@Component({
  selector: 'app-chronic-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule, PageHeaderComponent, ConfirmDialogComponent],
  template: `
    <app-page-header [title]="'CHRONIC.TITLE' | translate">
      <button class="btn-pdf" (click)="exportPdf()" [disabled]="pdfLoading">
        <span *ngIf="pdfLoading" class="spinner-sm"></span>
        <span *ngIf="!pdfLoading" class="material-symbols-outlined" style="font-size:16px;vertical-align:-3px">picture_as_pdf</span>
        {{ 'COMMON.EXPORT_PDF' | translate }}
      </button>
      <button class="btn btn-primary" routerLink="/chronic/new">+ {{ 'CHRONIC.ADD' | translate }}</button>
    </app-page-header>

    <!-- Search + filter -->
    <div class="toolbar">
      <input class="search-input" [(ngModel)]="search" (ngModelChange)="onSearch()"
             [placeholder]="'CHRONIC.SEARCH_PLACEHOLDER' | translate">
      <select class="filter-select" [(ngModel)]="statusFilter" (ngModelChange)="load()">
        <option value="">{{ 'COMMON.ALL' | translate }}</option>
        <option value="active">{{ 'COMMON.ACTIVE' | translate }}</option>
        <option value="inactive">{{ 'COMMON.INACTIVE' | translate }}</option>
      </select>
    </div>

    <!-- Loading -->
    <div *ngIf="loading" class="loading-state"><div class="spinner"></div></div>

    <!-- Empty -->
    <div *ngIf="!loading && patients.length === 0" class="empty-state">
      {{ 'COMMON.NO_DATA' | translate }}
    </div>

    <!-- List -->
    <div *ngIf="!loading" class="patients-grid">
      <a *ngFor="let p of patients" [routerLink]="['/chronic', p.id]" class="patient-card">
        <div class="patient-avatar" [class.male-av]="p.gender==='male'" [class.female-av]="p.gender==='female'" [class.no-gender]="!p.gender">
          {{ p.full_name.charAt(0) }}
        </div>
        <div class="patient-body">
          <div class="patient-name">{{ p.full_name }}</div>
          <div class="disease-badge">💊 {{ p.disease_name }}</div>
          <div *ngIf="p.phone" class="patient-phone">📞 {{ p.phone }}</div>
        </div>
        <div class="patient-right">
          <span class="status-badge" [class.active]="p.is_active" [class.inactive]="!p.is_active">
            {{ (p.is_active ? 'COMMON.ACTIVE' : 'COMMON.INACTIVE') | translate }}
          </span>
          <button class="btn-del" (click)="$event.preventDefault(); $event.stopPropagation(); askDelete(p)">🗑️</button>
        </div>
      </a>
    </div>

    <app-confirm-dialog [visible]="showDelete" type="danger"
      [title]="'CHRONIC.DELETE_TITLE' | translate"
      [message]="'CHRONIC.DELETE_MSG' | translate"
      [confirmLabel]="'COMMON.DELETE' | translate"
      iconName="delete"
      (confirmed)="confirmDelete()" (cancelled)="showDelete=false">
    </app-confirm-dialog>
  `,
  styles: [`
    .toolbar { display:flex; gap:12px; margin-bottom:20px; }
    .search-input { flex:1; padding:10px 14px; border:1px solid #ddd; border-radius:10px; font-size:14px; font-family:inherit; outline:none; }
    .search-input:focus { border-color:#2E7D32; }
    .filter-select { padding:10px 14px; border:1px solid #ddd; border-radius:10px; font-size:14px; font-family:inherit; background:#fff; outline:none; }
    .loading-state { display:flex; justify-content:center; padding:48px; }
    .spinner { width:32px; height:32px; border:3px solid #eee; border-top-color:#2E7D32; border-radius:50%; animation:spin 0.8s linear infinite; }
    .spinner-sm { width:14px; height:14px; border:2px solid #ddd; border-top-color:#6A1B9A; border-radius:50%; animation:spin 0.8s linear infinite; display:inline-block; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .empty-state { text-align:center; color:#aaa; padding:48px; font-size:14px; }
    .patients-grid { display:flex; flex-direction:column; gap:10px; }
    .patient-card {
      display:flex; align-items:center; gap:14px;
      background:#fff; border-radius:14px; padding:14px 18px;
      box-shadow:0 2px 10px rgba(0,0,0,0.07); text-decoration:none; color:inherit;
      transition:box-shadow 0.15s;
    }
    .patient-card:hover { box-shadow:0 4px 18px rgba(0,0,0,0.12); }
    .patient-avatar {
      width:44px; height:44px; border-radius:50%; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
      font-weight:700; font-size:18px; color:#fff;
    }
    .male-av   { background:linear-gradient(135deg,#1565C0,#42A5F5); }
    .female-av { background:linear-gradient(135deg,#AD1457,#F06292); }
    .no-gender { background:linear-gradient(135deg,#546E7A,#90A4AE); }
    .patient-body { flex:1; display:flex; flex-direction:column; gap:4px; }
    .patient-name { font-weight:700; font-size:15px; color:#222; }
    .disease-badge { font-size:12px; color:#6A1B9A; background:#F3E5F5; border-radius:8px; padding:2px 8px; display:inline-block; }
    .patient-phone { font-size:12px; color:#777; }
    .patient-right { display:flex; flex-direction:column; align-items:flex-end; gap:8px; }
    .status-badge { padding:3px 10px; border-radius:10px; font-size:11px; font-weight:600; }
    .status-badge.active   { background:#E8F5E9; color:#2E7D32; }
    .status-badge.inactive { background:#eee; color:#666; }
    .btn-del { background:none; border:none; cursor:pointer; font-size:16px; padding:4px; opacity:0.6; }
    .btn-del:hover { opacity:1; }
    .btn-primary { background:#6A1B9A; color:#fff; border:none; border-radius:8px; padding:10px 18px; cursor:pointer; font-size:14px; font-family:inherit; font-weight:600; }
    .btn-pdf { padding:9px 16px; background:#fff; border:1.5px solid #6A1B9A; color:#6A1B9A; border-radius:8px; cursor:pointer; font-size:14px; font-weight:600; display:flex; align-items:center; gap:6px; font-family:inherit; }
    .btn-pdf:hover { background:#F3E5F5; }
    .btn-pdf:disabled { opacity:0.6; cursor:not-allowed; }
  `]
})
export class ChronicListComponent implements OnInit {
  patients: ChronicPatient[] = [];
  loading = false;
  pdfLoading = false;
  search = '';
  statusFilter = '';
  showDelete = false;
  deleteTarget: ChronicPatient | null = null;
  private searchTimer: any;

  constructor(private service: ChronicPatientService, private translate: TranslateService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.service.getAll({ search: this.search, status: this.statusFilter }).subscribe({
      next: res => { this.patients = res.data ?? []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onSearch(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.load(), 350);
  }

  exportPdf(): void {
    this.pdfLoading = true;
    this.service.getAll({ with_medications: true }).subscribe({
      next: res => {
        this.pdfLoading = false;
        this.generatePdf(res.data ?? []);
      },
      error: () => { this.pdfLoading = false; }
    });
  }

  private generatePdf(patients: ChronicPatient[]): void {
    const t       = (key: string) => this.translate.instant(key);
    const lang    = this.translate.currentLang || 'fr';
    const isAr    = lang === 'ar';
    const dir     = isAr ? 'rtl' : 'ltr';
    const thAlign = isAr ? 'right' : 'left';

    const today      = new Date().toLocaleDateString(isAr ? 'ar-MA' : 'fr-FR');
    const grandTotal = patients.reduce((s, p) => s + ((p as any).total_spent ?? 0), 0);
    const fmtNum     = (n: number) => n.toLocaleString(isAr ? 'ar-MA' : 'fr-FR');
    const fmtDate    = (d: string) => d ? new Date(d).toLocaleDateString(isAr ? 'ar-MA' : 'fr-FR') : '—';

    const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';

    const remainingHtml = (days: number) => {
      if (days < 0)  return `<span style="color:#607D8B">${t('CHRONIC.EXPIRED')}</span>`;
      if (days === 0) return `<span style="color:#C62828;font-weight:700">${t('CHRONIC.EXPIRES_TODAY')}</span>`;
      const color = days <= 7 ? '#C62828' : days <= 14 ? '#E65100' : '#2E7D32';
      return `<span style="color:${color};font-weight:700">${days} ${t('CHRONIC.DAYS_LEFT')}</span>`;
    };

    const durationLabel = (val: number, unit: string) => {
      const u = unit === 'weeks' ? t('CHRONIC.WEEKS') : unit === 'months' ? t('CHRONIC.MONTHS') : t('CHRONIC.DAYS');
      return `${val} ${u}`;
    };

    let patientsHtml = '';
    for (const p of patients) {
      const meds: any[]      = (p as any).medications ?? [];
      const totalSpent: number = (p as any).total_spent ?? 0;

      const statusColor = p.is_active ? '#2E7D32' : '#757575';
      const statusLabel = p.is_active ? t('COMMON.ACTIVE') : t('COMMON.INACTIVE');
      const genderLabel = p.gender === 'male' ? t('ORPHANS.MALE') : p.gender === 'female' ? t('ORPHANS.FEMALE') : '—';
      const avColor = p.gender === 'male'
        ? 'background:linear-gradient(135deg,#1565C0,#42A5F5)'
        : p.gender === 'female'
        ? 'background:linear-gradient(135deg,#AD1457,#F06292)'
        : 'background:linear-gradient(135deg,#546E7A,#90A4AE)';

      const medsRows = meds.map((m, i) => `
        <tr style="background:${i % 2 === 0 ? '#fff' : '#fdf6ff'}">
          <td style="padding:5px 8px;text-align:center;color:#999;font-size:10px">${i + 1}</td>
          <td style="padding:5px 8px;font-weight:600;color:#222">${m.name}</td>
          <td style="padding:5px 8px;text-align:center;color:#555;font-size:10px">${fmtDate(m.start_date)}</td>
          <td style="padding:5px 8px;text-align:center;color:#7B1FA2;font-weight:600;font-size:10px">${durationLabel(m.duration_value, m.duration_unit)}</td>
          <td style="padding:5px 8px;text-align:center;color:#555;font-size:10px">${fmtDate(m.end_date)}</td>
          <td style="padding:5px 8px;text-align:center;font-size:10px">${remainingHtml(m.days_remaining)}</td>
          <td style="padding:5px 8px;text-align:center;color:#555;font-size:10px">${fmtNum(m.price)}</td>
          <td style="padding:5px 8px;text-align:center;color:#555;font-size:10px">${m.quantity}</td>
          <td style="padding:5px 8px;text-align:center;font-weight:700;color:#6A1B9A;font-size:10px">${fmtNum(m.total)} ${t('COMMON.MRU')}</td>
          <td style="padding:5px 8px;text-align:center;color:#3949AB;font-size:10px">${capitalize(m.payment_method)}</td>
        </tr>`).join('');

      patientsHtml += `
        <div style="margin-bottom:20px">
          <div style="display:flex;align-items:center;gap:12px;background:#F3E5F5;border-radius:8px;padding:10px 14px;margin-bottom:6px">
            <div style="width:38px;height:38px;border-radius:50%;${avColor};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:16px;flex-shrink:0">
              ${p.full_name.charAt(0)}
            </div>
            <div style="flex:1">
              <div style="font-size:14px;font-weight:700;color:#1a1a2e">${p.full_name}</div>
              <div style="display:flex;gap:8px;align-items:center;margin-top:3px;flex-wrap:wrap">
                <span style="background:#fff;color:#6A1B9A;border-radius:6px;padding:1px 8px;font-size:11px;font-weight:600">💊 ${p.disease_name}</span>
                ${p.phone ? `<span style="font-size:11px;color:#555">📞 ${p.phone}</span>` : ''}
                ${p.gender ? `<span style="font-size:11px;color:#555">${genderLabel}</span>` : ''}
              </div>
            </div>
            <span style="background:${p.is_active ? '#E8F5E9' : '#eeeeee'};color:${statusColor};border-radius:10px;padding:3px 10px;font-size:11px;font-weight:600;flex-shrink:0">${statusLabel}</span>
          </div>

          ${meds.length === 0
            ? `<p style="color:#aaa;font-size:12px;padding:6px 14px;margin:0">${t('COMMON.NO_DATA')}</p>`
            : `<table style="width:100%;border-collapse:collapse;font-size:11px">
                <thead>
                  <tr style="background:#6A1B9A;color:#fff">
                    <th style="padding:5px 8px;text-align:center;width:24px">#</th>
                    <th style="padding:5px 8px;text-align:${thAlign}">${t('CHRONIC.MED_NAME')}</th>
                    <th style="padding:5px 8px;text-align:center;width:72px">${t('CHRONIC.MED_START_DATE')}</th>
                    <th style="padding:5px 8px;text-align:center;width:72px">${t('CHRONIC.MED_DURATION')}</th>
                    <th style="padding:5px 8px;text-align:center;width:72px">${t('COMMON.END_DATE')}</th>
                    <th style="padding:5px 8px;text-align:center;width:90px">${t('CHRONIC.DAYS_LEFT')}</th>
                    <th style="padding:5px 8px;text-align:center;width:60px">${t('CHRONIC.MED_PRICE')}</th>
                    <th style="padding:5px 8px;text-align:center;width:36px">${t('CHRONIC.MED_QTY')}</th>
                    <th style="padding:5px 8px;text-align:center;width:80px">${t('COMMON.TOTAL')}</th>
                    <th style="padding:5px 8px;text-align:center;width:70px">${t('CONTRIBUTIONS.PAYMENT_METHOD')}</th>
                  </tr>
                </thead>
                <tbody>${medsRows}</tbody>
              </table>
              <div style="text-align:${isAr ? 'left' : 'right'};padding:5px 14px;color:#6A1B9A;font-weight:700;font-size:12px;border-top:1px dashed #E1BEE7">
                ${t('CHRONIC.TOTAL_SPENT')} : ${fmtNum(totalSpent)} ${t('COMMON.MRU')}
              </div>`
          }
        </div>`;
    }

    const container = document.createElement('div');
    container.style.cssText = `position:fixed;top:-99999px;left:-99999px;width:794px;background:#fff;padding:28px 32px;font-family:'Cairo',Arial,sans-serif;font-size:12px;color:#212121;direction:${dir}`;
    container.innerHTML = `
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
      <div style="display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,#6A1B9A,#9C27B0);color:#fff;padding:18px 22px;border-radius:10px;margin-bottom:22px">
        <h1 style="margin:0;font-size:20px;font-weight:700">${t('CHRONIC.TITLE')}</h1>
        <div style="text-align:${isAr ? 'left' : 'right'};font-size:11px;opacity:0.85;line-height:1.8">
          <div>${today}</div>
          <div>${patients.length} ${t('COMMON.TOTAL').toLowerCase()}</div>
        </div>
      </div>

      ${patientsHtml}

      <div style="margin-top:16px;padding-top:12px;border-top:2.5px solid #6A1B9A;display:flex;justify-content:space-between;align-items:center">
        <span style="color:#6A1B9A;font-weight:700;font-size:14px">${t('COMMON.TOTAL')}</span>
        <span style="color:#6A1B9A;font-weight:700;font-size:18px">${fmtNum(grandTotal)} ${t('COMMON.MRU')}</span>
      </div>`;

    document.body.appendChild(container);
    document.fonts.load('600 12px Cairo').then(() => {
      const safeBreaks = collectRowBreaks(container);
      html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(canvas => {
        document.body.removeChild(container);
        const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
        renderCanvasToPdf(canvas, pdf, safeBreaks);
        pdf.save(`maladies-chroniques-${new Date().toISOString().slice(0, 10)}.pdf`);
      });
    });
  }

  askDelete(p: ChronicPatient): void { this.deleteTarget = p; this.showDelete = true; }

  confirmDelete(): void {
    if (!this.deleteTarget) return;
    this.service.delete(this.deleteTarget.id).subscribe({
      next: () => { this.showDelete = false; this.deleteTarget = null; this.load(); },
      error: () => { this.showDelete = false; }
    });
  }
}
