import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GuardianService, Guardian } from '../../../core/services/guardian.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-guardians-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, PageHeaderComponent, FormsModule],
  template: `
    <app-page-header [title]="'MENU.GUARDIANS' | translate">
      <div style="display:flex;gap:8px;align-items:center">
        <button class="btn-pdf" (click)="exportPdf()" [disabled]="pdfLoading">
          <span *ngIf="pdfLoading" class="spinner-sm"></span>
          <span *ngIf="!pdfLoading">PDF</span>
        </button>
        <button routerLink="/guardians/new" class="btn-add">+ {{ 'GUARDIANS.ADD' | translate }}</button>
      </div>
    </app-page-header>

    <div class="list-container">
      <div class="filters-section">
        <div class="search-box">
          <input
            type="text"
            class="search-input"
            [placeholder]="'GUARDIANS.SEARCH_PLACEHOLDER' | translate"
            [(ngModel)]="searchText"
            (input)="onSearch()">
          <span class="search-icon">🔍</span>
        </div>
        <div class="filter-status">
          <button [class.active]="statusFilter === null"       (click)="setStatus(null)"       class="status-btn">{{ 'COMMON.ALL'      | translate }}</button>
          <button [class.active]="statusFilter === 'active'"   (click)="setStatus('active')"   class="status-btn">{{ 'COMMON.ACTIVE'   | translate }}</button>
          <button [class.active]="statusFilter === 'inactive'" (click)="setStatus('inactive')" class="status-btn">{{ 'COMMON.INACTIVE' | translate }}</button>
        </div>
      </div>

      <div class="guardians-list">
        <div *ngFor="let guardian of guardians" class="guardian-card" [class.inactive]="!guardian.is_active">

          <div class="guardian-header" (click)="toggleGuardian(guardian.id)">
            <div class="guardian-left">
              <div class="guardian-avatar">{{ guardian.name.charAt(0) }}</div>
              <div class="guardian-info">
                <div class="guardian-name">{{ guardian.name }}</div>
                <div class="guardian-meta">
                  <span *ngIf="guardian.father_name" class="meta-item">👴 {{ guardian.father_name }}</span>
                  <span class="meta-item">📞 {{ guardian.phone }}</span>
                  <span *ngIf="guardian.whatsapp" class="meta-item">📱 {{ guardian.whatsapp }}</span>
                </div>
              </div>
            </div>
            <div class="guardian-right">
              <span class="orphans-badge">{{ guardian.orphans_count || 0 }} {{ 'GUARDIANS.ORPHANS_COUNT' | translate }}</span>
              <span [class.status-active]="guardian.is_active" [class.status-inactive]="!guardian.is_active" class="status-badge">
                {{ (guardian.is_active ? 'COMMON.ACTIVE' : 'COMMON.INACTIVE') | translate }}
              </span>
              <div class="actions">
                <button [routerLink]="['/guardians', guardian.id, 'edit']" class="btn-icon" (click)="$event.stopPropagation()">✏️</button>
                <button (click)="$event.stopPropagation(); askDelete(guardian)" class="btn-icon btn-del">🗑️</button>
              </div>
              <span class="expand-icon">{{ expandedId === guardian.id ? '▲' : '▼' }}</span>
            </div>
          </div>

          <div class="orphans-sublist" *ngIf="expandedId === guardian.id">
            <div class="sublist-header">
              <span>{{ 'GUARDIANS.CHILDREN_OF' | translate:{name: guardian.name} }}</span>
              <a [routerLink]="['/guardians', guardian.id]" [queryParams]="{ tab: 'add' }" class="btn-add-orphan">
                {{ 'GUARDIANS.ADD_CHILD_BTN' | translate }}
              </a>
            </div>

            <div *ngIf="!guardian.orphans || guardian.orphans.length === 0" class="no-orphans">
              {{ 'ORPHANS.NO_CHILDREN' | translate }}
            </div>

            <table *ngIf="guardian.orphans && guardian.orphans.length > 0" class="orphans-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{{ 'ORPHANS.FULL_NAME'  | translate }}</th>
                  <th>{{ 'ORPHANS.GENDER'     | translate }}</th>
                  <th>{{ 'ORPHANS.BIRTH_YEAR' | translate }}</th>
                  <th>{{ 'ORPHANS.AGE'        | translate }}</th>
                  <th>{{ 'ORPHANS.SCHOOL'     | translate }}</th>
                  <th>{{ 'COMMON.STATUS'      | translate }}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let o of guardian.orphans; let i = index" [class.row-inactive]="!o.is_active">
                  <td class="td-num">{{ i + 1 }}</td>
                  <td class="td-name">{{ o.display_name }}</td>
                  <td class="td-gender">
                    <span class="gender-badge" [class.male]="o.gender === 'male'" [class.female]="o.gender === 'female'">
                      {{ (o.gender === 'male' ? 'ORPHANS.MALE' : 'ORPHANS.FEMALE') | translate }}
                    </span>
                  </td>
                  <td class="td-year">{{ o.birth_year }}</td>
                  <td class="td-age">{{ o.age }} {{ 'COMMON.YEARS' | translate }}</td>
                  <td class="td-school">{{ o.school_name || '—' }}</td>
                  <td class="td-status">
                    <span class="dot" [class.dot-active]="o.is_active" [class.dot-inactive]="!o.is_active"></span>
                    {{ (o.is_active ? 'ORPHANS.STATUS_ACTIVE' : 'ORPHANS.STATUS_INACTIVE') | translate }}
                  </td>
                  <td class="td-actions">
                    <button [routerLink]="['/orphans', o.id]" class="btn-icon">👁️</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div *ngIf="guardians.length === 0" class="empty-state">
          <div class="empty-icon">👤</div>
          <p>{{ 'GUARDIANS.NO_DATA' | translate }}</p>
        </div>
      </div>
    </div>

    <!-- Modal suppression -->
    <div class="modal-overlay" *ngIf="showDeleteModal" (click)="showDeleteModal = false">
      <div class="modal-box" (click)="$event.stopPropagation()">
        <div class="modal-icon">🗑️</div>
        <h3>{{ 'COMMON.CONFIRM_DELETE' | translate }}</h3>
        <p>{{ 'GUARDIANS.DELETE_MSG' | translate:{name: deleteTarget?.name} }}</p>
        <div class="modal-actions">
          <button class="btn-cancel" (click)="showDeleteModal = false">{{ 'COMMON.CANCEL' | translate }}</button>
          <button class="btn-delete" (click)="confirmDelete()">{{ 'COMMON.DELETE' | translate }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .btn-add { padding: 10px 20px; background: #2E7D32; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; }
    .btn-add:hover { background: #1B5E20; }
    .btn-pdf { padding: 9px 18px; background: #fff; border: 1.5px solid #2E7D32; color: #2E7D32; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; display:flex;align-items:center;gap:6px; }
    .btn-pdf:hover { background: #E8F5E9; }
    .btn-pdf:disabled { opacity: 0.6; cursor: not-allowed; }
    .spinner-sm { width: 14px; height: 14px; border: 2px solid #c8e6c9; border-top-color: #2E7D32; border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .list-container { padding: 24px; }

    .filters-section { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; }
    .search-box { position: relative; flex: 1; min-width: 250px; }
    .search-input { width: 100%; padding: 10px 16px 10px 40px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; box-sizing: border-box; }
    .search-input:focus { border-color: #2E7D32; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #999; }
    .filter-status { display: flex; gap: 8px; }
    .status-btn { padding: 8px 16px; border: 2px solid #ddd; background: #fff; border-radius: 20px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; }
    .status-btn.active { background: #2E7D32; color: #fff; border-color: #2E7D32; }

    .guardians-list { display: flex; flex-direction: column; gap: 12px; }

    .guardian-card { background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); overflow: hidden; border: 1px solid #eee; transition: box-shadow 0.2s; }
    .guardian-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.11); }
    .guardian-card.inactive { opacity: 0.7; }

    .guardian-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; cursor: pointer; user-select: none; gap: 16px; }
    .guardian-header:hover { background: #fafafa; }
    .guardian-left { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }
    .guardian-avatar { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #2E7D32, #66BB6A); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; flex-shrink: 0; }
    .guardian-info { min-width: 0; }
    .guardian-name { font-size: 15px; font-weight: 700; color: #222; }
    .guardian-meta { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 3px; }
    .meta-item { font-size: 12px; color: #666; }

    .guardian-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
    .orphans-badge { background: #E3F2FD; color: #1565C0; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap; }
    .status-badge { padding: 4px 10px; border-radius: 10px; font-size: 12px; font-weight: 600; white-space: nowrap; }
    .status-badge.status-active { background: #E8F5E9; color: #2E7D32; }
    .status-badge.status-inactive { background: #FFEBEE; color: #C62828; }
    .actions { display: flex; gap: 6px; }
    .btn-icon { width: 30px; height: 30px; border: 1px solid #eee; background: #fff; border-radius: 6px; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; transition: background 0.15s; }
    .btn-icon:hover { background: #f5f5f5; }
    .btn-icon.btn-del:hover { background: #FFEBEE; }
    .expand-icon { color: #999; font-size: 12px; width: 16px; text-align: center; }

    .orphans-sublist { border-top: 1px solid #f0f0f0; background: #FAFAFA; padding: 16px 20px; }
    .sublist-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 13px; font-weight: 600; color: #555; }
    .btn-add-orphan { background: #2E7D32; color: #fff; padding: 6px 14px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 600; }
    .btn-add-orphan:hover { background: #1B5E20; }
    .no-orphans { color: #aaa; font-size: 13px; padding: 12px 0; font-style: italic; }

    .orphans-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .orphans-table th { padding: 8px 10px; text-align: left; color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #eee; }
    .orphans-table td { padding: 10px 10px; border-bottom: 1px solid #f5f5f5; color: #333; }
    .orphans-table tr:last-child td { border-bottom: none; }
    .orphans-table tr.row-inactive td { color: #bbb; }
    .td-num { color: #bbb; width: 30px; }
    .td-name { font-weight: 600; color: #1a1a2e; }
    .td-year { font-family: monospace; }
    .td-age { white-space: nowrap; }
    .td-school { color: #666; }
    .gender-badge { padding: 3px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .gender-badge.male   { background: #E3F2FD; color: #1565C0; }
    .gender-badge.female { background: #FCE4EC; color: #AD1457; }
    .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 5px; }
    .dot-active   { background: #4CAF50; }
    .dot-inactive { background: #F44336; }
    .td-actions { text-align: right; }

    .empty-state { text-align: center; padding: 60px 20px; color: #bbb; }
    .empty-icon { font-size: 48px; margin-bottom: 12px; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-box { background: #fff; border-radius: 16px; padding: 32px 28px; max-width: 380px; width: 90%; text-align: center; box-shadow: 0 8px 40px rgba(0,0,0,0.2); }
    .modal-icon { font-size: 40px; margin-bottom: 12px; }
    .modal-box h3 { margin: 0 0 10px; font-size: 17px; color: #333; }
    .modal-box p { margin: 0 0 24px; font-size: 14px; color: #666; line-height: 1.5; }
    .modal-actions { display: flex; gap: 12px; }
    .btn-cancel { flex: 1; padding: 10px; background: #eee; color: #555; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-delete { flex: 1; padding: 10px; background: #C62828; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }

    @media (max-width: 768px) {
      .guardian-right { flex-wrap: wrap; gap: 8px; }
      .orphans-table { font-size: 11px; }
      .guardian-meta { display: none; }
    }
  `]
})
export class GuardiansListComponent implements OnInit {
  guardians: Guardian[] = [];
  searchText   = '';
  statusFilter: string | null = null;
  expandedId: number | null   = null;
  showDeleteModal = false;
  deleteTarget: Guardian | null = null;
  pdfLoading = false;

  constructor(private guardianService: GuardianService, private translate: TranslateService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    const params: any = {};
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.searchText)   params.search = this.searchText;

    this.guardianService.getAll(params).subscribe({
      next: res => this.guardians = res.data,
      error: err => console.error(err),
    });
  }

  onSearch(): void { this.load(); }
  setStatus(s: string | null): void { this.statusFilter = s; this.load(); }

  toggleGuardian(id: number): void {
    if (this.expandedId === id) {
      this.expandedId = null;
      return;
    }
    this.expandedId = id;
    // Charger les orphelins si pas encore chargés
    const g = this.guardians.find(x => x.id === id);
    if (g && !g.orphans) {
      this.guardianService.getOrphans(id).subscribe({
        next: orphans => g.orphans = orphans,
      });
    }
  }

  exportPdf(): void {
    const withOrphans = this.guardians.filter(g => (g.orphans_count ?? 0) > 0);
    const toLoad      = withOrphans.filter(g => !g.orphans);

    if (toLoad.length === 0) { this.generatePdf(); return; }

    this.pdfLoading = true;
    const requests = toLoad.map(g =>
      this.guardianService.getOrphans(g.id).pipe(map(orphans => ({ id: g.id, orphans })))
    );
    forkJoin(requests).subscribe({
      next: results => {
        results.forEach(r => { const g = this.guardians.find(x => x.id === r.id); if (g) g.orphans = r.orphans; });
        this.pdfLoading = false;
        this.generatePdf();
      },
      error: () => { this.pdfLoading = false; }
    });
  }

  private generatePdf(): void {
    const t    = (key: string) => this.translate.instant(key);
    const lang = this.translate.currentLang || 'fr';
    const isAr = lang === 'ar';
    const dir  = isAr ? 'rtl' : 'ltr';
    const thAlign = isAr ? 'right' : 'left';

    let totalOrphans = 0;
    let guardiansHtml = '';

    for (const guardian of this.guardians) {
      const orphans = (guardian.orphans ?? []).filter((o: any) => true);
      if (orphans.length === 0) continue;
      totalOrphans += orphans.length;

      const rowsHtml = orphans.map((o: any, i: number) => {
        const gColor = o.gender === 'male' ? '#1565C0' : '#AD1457';
        const gLabel = o.gender === 'male' ? t('ORPHANS.MALE') : t('ORPHANS.FEMALE');
        const sColor = o.is_active ? '#2E7D32' : '#C62828';
        const sLabel = o.is_active ? t('ORPHANS.STATUS_ACTIVE') : t('ORPHANS.STATUS_INACTIVE');
        return `<tr style="background:${i % 2 === 0 ? '#fff' : '#F8FCF8'}">
          <td style="padding:5px 8px;text-align:center;color:#bbb;font-size:11px">${i + 1}</td>
          <td style="padding:5px 8px;font-weight:600;color:#1a1a2e">${o.display_name || o.full_name || '—'}</td>
          <td style="padding:5px 8px;text-align:center;color:${gColor};font-weight:700">${gLabel}</td>
          <td style="padding:5px 8px;text-align:center;color:#555">${o.birth_year || '—'}</td>
          <td style="padding:5px 8px;text-align:center;color:#555">${o.age != null ? o.age + ' ' + t('COMMON.YEARS') : '—'}</td>
          <td style="padding:5px 8px;color:#555">${o.school_name || '—'}</td>
          <td style="padding:5px 8px;text-align:center;color:${sColor};font-weight:600">${sLabel}</td>
        </tr>`;
      }).join('');

      guardiansHtml += `
        <div style="margin-bottom:18px">
          <div style="background:#E8F5E9;border-radius:6px;padding:10px 14px;margin-bottom:6px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <strong style="color:#1B5E20;font-size:14px">${guardian.name}</strong>
              <span style="color:#666;font-size:12px">📞 ${guardian.phone}</span>
            </div>
            ${guardian.father_name ? `<div style="color:#666;font-size:12px;margin-top:3px">${t('ORPHANS.FATHER_NAME')} : ${guardian.father_name}</div>` : ''}
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:11px">
            <thead><tr>
              <th style="background:#2E7D32;color:#fff;padding:6px 8px;text-align:center;width:28px">#</th>
              <th style="background:#2E7D32;color:#fff;padding:6px 8px;text-align:${thAlign}">${t('ORPHANS.FULL_NAME')}</th>
              <th style="background:#2E7D32;color:#fff;padding:6px 8px;text-align:center;width:65px">${t('ORPHANS.GENDER')}</th>
              <th style="background:#2E7D32;color:#fff;padding:6px 8px;text-align:center;width:70px">${t('ORPHANS.BIRTH_YEAR')}</th>
              <th style="background:#2E7D32;color:#fff;padding:6px 8px;text-align:center;width:50px">${t('ORPHANS.AGE')}</th>
              <th style="background:#2E7D32;color:#fff;padding:6px 8px;text-align:${thAlign}">${t('ORPHANS.SCHOOL')}</th>
              <th style="background:#2E7D32;color:#fff;padding:6px 8px;text-align:center;width:65px">${t('COMMON.STATUS')}</th>
            </tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>`;
    }

    const container = document.createElement('div');
    container.style.cssText = `position:fixed;top:-99999px;left:-99999px;width:794px;background:#fff;padding:28px 32px;font-family:'Cairo',Arial,sans-serif;font-size:12px;color:#212121;direction:${dir}`;
    container.innerHTML = `
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
        <h1 style="color:#2E7D32;font-size:18px;margin:0;font-weight:700">${t('ORPHANS.EXPORT_BY_GUARDIAN')}</h1>
        <span style="color:#999;font-size:11px">${new Date().toLocaleDateString('fr-FR')}</span>
      </div>
      ${guardiansHtml || `<p style="color:#aaa;text-align:center">${t('ORPHANS.NO_DATA')}</p>`}
      <div style="margin-top:14px;padding-top:12px;border-top:2px solid #2E7D32;color:#2E7D32;font-weight:700;font-size:14px">
        ${t('COMMON.TOTAL')} : ${totalOrphans} ${t('ORPHANS.TITLE')}
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
        pdf.save(`orphelins-par-tuteur-${new Date().toISOString().slice(0, 10)}.pdf`);
      });
    });
  }

  askDelete(g: Guardian): void {
    this.deleteTarget   = g;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.deleteTarget) return;
    this.guardianService.delete(this.deleteTarget.id).subscribe({
      next: () => { this.showDeleteModal = false; this.deleteTarget = null; this.load(); },
      error: () => { this.showDeleteModal = false; },
    });
  }
}
