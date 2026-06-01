import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OrphanService } from '../../core/services/orphan.service';
import { GuardianService, Guardian } from '../../core/services/guardian.service';
import { SettingsService } from '../../core/services/settings.service';
import { Orphan } from '../../core/models/orphan.model';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-adults-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule],
  template: `
    <!-- En-tête -->
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:10px">
        <h1 class="page-title">
          {{ (activeTab === 'list' ? 'ADULTS.TITLE' : 'ORPHANS.TAB_BY_GUARDIAN') | translate }}
        </h1>
        <span class="count-badge">{{ activeTab === 'list' ? adults.length : guardians.length }}</span>
      </div>
      <div *ngIf="activeTab === 'guardians'" style="display:flex;gap:8px;align-items:center">
        <button class="btn-export-g" (click)="exportGuardianPdf()" [disabled]="pdfGuardianLoading">
          <span *ngIf="pdfGuardianLoading" class="spinner-sm-g"></span>
          <span *ngIf="!pdfGuardianLoading">📄</span>
          <span *ngIf="!pdfGuardianLoading">{{ 'COMMON.EXPORT_PDF' | translate }}</span>
        </button>
      </div>
    </div>

    <!-- Onglets -->
    <div class="tabs-bar">
      <button class="tab-btn" [class.active]="activeTab === 'list'"     (click)="switchTab('list')">
        <span class="ms-icon">school</span> {{ 'ADULTS.TITLE' | translate }}
      </button>
      <button class="tab-btn" [class.active]="activeTab === 'guardians'" (click)="switchTab('guardians')">
        <span class="ms-icon">supervisor_account</span> {{ 'ORPHANS.TAB_BY_GUARDIAN' | translate }}
      </button>
    </div>

    <!-- ===== ONGLET LISTE ===== -->
    <ng-container *ngIf="activeTab === 'list'">
      <div class="filter-row">
        <input class="search-input" [(ngModel)]="search" (input)="applyFilter()"
               [placeholder]="'COMMON.SEARCH' | translate">
        <div class="gender-chips">
          <button class="chip chip-default" [class.active]="genderFilter===''"       (click)="setGender('')">{{ 'ORPHANS.FILTER_ALL'  | translate }}</button>
          <button class="chip chip-blue"    [class.active]="genderFilter==='male'"   (click)="setGender('male')">♂ {{ 'ORPHANS.MALE' | translate }}</button>
          <button class="chip chip-pink"    [class.active]="genderFilter==='female'" (click)="setGender('female')">♀ {{ 'ORPHANS.FEMALE' | translate }}</button>
        </div>
      </div>

      <div *ngIf="loading" class="loading-state"><div class="spinner-lg"></div></div>

      <div class="table-card" *ngIf="!loading">
        <table class="data-table">
          <thead><tr>
            <th>{{ 'ORPHANS.FULL_NAME'   | translate }}</th>
            <th>{{ 'ORPHANS.GENDER'      | translate }}</th>
            <th>{{ 'ORPHANS.FATHER_NAME' | translate }}</th>
            <th>{{ 'ORPHANS.GUARDIAN'    | translate }}</th>
            <th>{{ 'ORPHANS.AGE'         | translate }}</th>
            <th></th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let o of filtered" class="clickable-row" (click)="goDetail(o.id)">
              <td>
                <div class="orphan-cell">
                  <img *ngIf="o.photo_url" [src]="o.photo_url" class="o-avatar" [alt]="o.full_name">
                  <span *ngIf="!o.photo_url" class="o-initials">{{ o.full_name.charAt(0) }}</span>
                  <span class="fw-600">{{ o.display_name }}</span>
                </div>
              </td>
              <td><span class="badge" [class]="o.gender==='male'?'blue':'purple'">{{ (o.gender==='male'?'ORPHANS.MALE':'ORPHANS.FEMALE')|translate }}</span></td>
              <td>{{ o.guardian?.father_name || '—' }}</td>
              <td>{{ o.guardian?.name || '—' }}</td>
              <td>{{ o.age }} {{ 'COMMON.YEARS' | translate }}</td>
              <td (click)="$event.stopPropagation()">
                <div style="display:flex;gap:4px">
                  <button [routerLink]="['/orphans', o.id]" class="btn-icon-sm">👁️</button>
                  <button [routerLink]="['/orphans', o.id, 'edit']" class="btn-icon-sm">✏️</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filtered.length === 0">
              <td colspan="6" class="empty-cell">{{ 'ADULTS.NO_DATA' | translate }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </ng-container>

    <!-- ===== ONGLET PAR TUTEUR ===== -->
    <ng-container *ngIf="activeTab === 'guardians'">
      <div class="search-bar">
        <input class="search-input" [(ngModel)]="guardianSearch" (input)="onGuardianSearch()"
               [placeholder]="'COMMON.SEARCH' | translate">
      </div>

      <div *ngIf="guardianLoading" class="loading-state"><div class="spinner-lg"></div></div>

      <div class="guardians-list" *ngIf="!guardianLoading">
        <div *ngFor="let g of guardians" class="guardian-card">
          <!-- En-tête tuteur -->
          <div class="guardian-header" (click)="toggleGuardian(g.id)">
            <div class="g-left">
              <div class="g-avatar">{{ g.name.charAt(0) }}</div>
              <div class="g-info">
                <div class="g-name">{{ g.name }}</div>
                <div class="g-meta">
                  <span *ngIf="g.father_name" class="meta-tag"><strong>{{ g.father_name }}</strong></span>
                  <span class="meta-tag">📞 {{ g.phone }}</span>
                  <span *ngIf="g.whatsapp" class="meta-tag">📱 {{ g.whatsapp }}</span>
                  <span *ngIf="g.address" class="meta-tag">📍 {{ g.address }}</span>
                </div>
              </div>
            </div>
            <div class="g-right">
              <span class="count-chip">{{ adultChildrenCount(g) }} {{ 'ADULTS.ADULTS_COUNT' | translate }}</span>
              <span class="expand-arrow">{{ expandedGuardianId === g.id ? '▲' : '▼' }}</span>
            </div>
          </div>

          <!-- Sous-liste des adultes -->
          <div class="children-list" *ngIf="expandedGuardianId === g.id">
            <div *ngIf="!g.orphans" class="no-children">
              <div class="spinner-lg" style="width:18px;height:18px;border-width:2px"></div>
            </div>
            <ng-container *ngIf="g.orphans">
              <div *ngIf="adultOrphans(g.orphans).length === 0" class="no-children">
                {{ 'ADULTS.NO_DATA' | translate }}
              </div>
              <table *ngIf="adultOrphans(g.orphans).length > 0" class="children-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{{ 'ORPHANS.FULL_NAME' | translate }}</th>
                    <th>{{ 'ORPHANS.GENDER' | translate }}</th>
                    <th>{{ 'ORPHANS.BIRTH_YEAR' | translate }}</th>
                    <th>{{ 'ORPHANS.AGE' | translate }}</th>
                    <th>{{ 'ORPHANS.SCHOOL' | translate }}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let o of adultOrphans(g.orphans); let i = index">
                    <td class="td-num">{{ i + 1 }}</td>
                    <td class="td-name">{{ o.display_name }}</td>
                    <td>
                      <span class="gender-chip" [class.male]="o.gender==='male'" [class.female]="o.gender==='female'">
                        {{ (o.gender === 'male' ? 'ORPHANS.MALE' : 'ORPHANS.FEMALE') | translate }}
                      </span>
                    </td>
                    <td class="mono">{{ o.birth_year }}</td>
                    <td>{{ o.age }} {{ 'COMMON.YEARS' | translate }}</td>
                    <td>{{ o.school_name || '—' }}</td>
                    <td class="td-acts">
                      <button [routerLink]="['/orphans', o.id]" class="btn-icon-sm">👁️</button>
                      <button [routerLink]="['/orphans', o.id, 'edit']" class="btn-icon-sm">✏️</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </ng-container>
          </div>
        </div>

        <div *ngIf="guardians.length === 0" class="empty-state">
          <div style="font-size:48px;margin-bottom:12px">👤</div>
          <p>{{ 'ORPHANS.NO_GUARDIANS' | translate }}</p>
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .page-title { font-size: 22px; font-weight: 700; color: #1a1a1a; margin: 0; }
    .count-badge { background: #E8F5E9; color: #2E7D32; padding: 3px 10px; border-radius: 12px; font-size: 13px; font-weight: 700; }
    .tabs-bar { display: flex; gap: 4px; margin-bottom: 20px; border-bottom: 2px solid #f0f0f0; }
    .tab-btn { padding: 10px 20px; border: none; background: none; cursor: pointer; font-size: 14px; font-weight: 600; color: #999; display: flex; align-items: center; gap: 6px; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.15s; font-family: inherit; }
    .tab-btn.active { color: #2E7D32; border-bottom-color: #2E7D32; }
    .tab-btn:hover { color: #2E7D32; }
    .ms-icon { font-family: 'Material Symbols Outlined'; font-size: 18px; font-style: normal; font-weight: normal; font-variation-settings: 'FILL' 0,'wght' 300; }
    .tab-btn.active .ms-icon { font-variation-settings: 'FILL' 1,'wght' 400; }

    .filter-row { display: flex; align-items: center; gap: 16px; margin-bottom: 18px; flex-wrap: wrap; }
    .search-bar { margin-bottom: 12px; }
    .search-input { padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; width: 100%; max-width: 420px; box-sizing: border-box; }
    .search-input:focus { border-color: #2E7D32; }
    .gender-chips { display: flex; gap: 8px; }
    .chip { display: flex; align-items: center; gap: 5px; padding: 6px 14px; border-radius: 20px; border: 1.5px solid; cursor: pointer; font-size: 13px; font-weight: 600; background: transparent; font-family: inherit; }
    .chip-default { border-color: #9E9E9E; color: #757575; }
    .chip-default:hover, .chip-default.active { background: #757575; color: #fff; border-color: #757575; }
    .chip-blue { border-color: #1565C0; color: #1565C0; }
    .chip-blue:hover, .chip-blue.active { background: #1565C0; color: #fff; }
    .chip-pink { border-color: #C2185B; color: #C2185B; }
    .chip-pink:hover, .chip-pink.active { background: #C2185B; color: #fff; }

    .btn-export-g { background: #fff; border: 1.5px solid #2E7D32; color: #2E7D32; border-radius: 8px; padding: 9px 16px; cursor: pointer; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px; font-family: inherit; }
    .btn-export-g:hover { background: #E8F5E9; }
    .btn-export-g:disabled { opacity: 0.6; cursor: not-allowed; }
    .spinner-sm-g { width: 14px; height: 14px; border: 2px solid #c8e6c9; border-top-color: #2E7D32; border-radius: 50%; animation: spin .7s linear infinite; }

    .table-card { background: #fff; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,.08); overflow: hidden; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: .5px; border-bottom: 1px solid #f0f0f0; background: #fafafa; }
    .data-table td { padding: 13px 16px; border-bottom: 1px solid #f8f8f8; font-size: 14px; color: #333; vertical-align: middle; }
    .clickable-row { cursor: pointer; transition: background .12s; }
    .clickable-row:hover { background: #f9fbe7; }
    .orphan-cell { display: flex; align-items: center; gap: 10px; }
    .o-avatar { width: 32px; height: 32px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
    .o-initials { width: 32px; height: 32px; border-radius: 8px; background: #E64A19; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; flex-shrink: 0; }
    .fw-600 { font-weight: 600; }
    .badge { display: inline-block; padding: 3px 9px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .badge.blue { background: #E3F2FD; color: #1565C0; }
    .badge.purple { background: #F3E5F5; color: #7B1FA2; }
    .empty-cell { text-align: center; color: #bbb; padding: 40px; font-size: 14px; }
    .loading-state { display: flex; justify-content: center; align-items: center; padding: 60px; }
    .spinner-lg { width: 36px; height: 36px; border: 3px solid #e0e0e0; border-top-color: #2E7D32; border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .btn-icon-sm { width: 28px; height: 28px; border: 1px solid #eee; background: #fff; border-radius: 6px; cursor: pointer; font-size: 12px; display: inline-flex; align-items: center; justify-content: center; }
    .btn-icon-sm:hover { background: #f5f5f5; }

    .guardians-list { display: flex; flex-direction: column; gap: 12px; }
    .guardian-card { background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); overflow: hidden; border: 1px solid #eee; }
    .guardian-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; cursor: pointer; gap: 12px; }
    .guardian-header:hover { background: #fafafa; }
    .g-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
    .g-avatar { width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg,#2E7D32,#66BB6A); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 700; flex-shrink: 0; }
    .g-info { min-width: 0; }
    .g-name { font-size: 15px; font-weight: 700; color: #1a1a2e; }
    .g-meta { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 3px; }
    .meta-tag { font-size: 12px; color: #666; }
    .g-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .count-chip { background: #FFF3E0; color: #E65100; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap; }
    .expand-arrow { color: #bbb; font-size: 11px; width: 14px; text-align: center; }
    .children-list { border-top: 1px solid #f0f0f0; background: #FAFAFA; padding: 14px 18px; }
    .no-children { color: #aaa; font-size: 13px; font-style: italic; display: flex; align-items: center; gap: 12px; }
    .children-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .children-table th { padding: 8px 10px; text-align: left; color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #eee; }
    .children-table td { padding: 10px; border-bottom: 1px solid #f5f5f5; }
    .children-table tr:last-child td { border-bottom: none; }
    .td-num { color: #bbb; width: 28px; }
    .td-name { font-weight: 600; color: #1a1a2e; }
    .mono { font-family: monospace; }
    .gender-chip { padding: 3px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .gender-chip.male   { background: #E3F2FD; color: #1565C0; }
    .gender-chip.female { background: #FCE4EC; color: #AD1457; }
    .td-acts { display: flex; gap: 4px; }
    .empty-state { text-align: center; padding: 60px 20px; color: #bbb; }
  `]
})
export class AdultsListComponent implements OnInit {
  activeTab: 'list' | 'guardians' = 'list';

  // List tab
  adults: Orphan[] = [];
  filtered: Orphan[] = [];
  loading = true;
  search = '';
  genderFilter = '';

  // Guardian tab
  guardians: Guardian[] = [];
  guardianLoading = false;
  guardianSearch = '';
  expandedGuardianId: number | null = null;
  pdfGuardianLoading = false;
  private guardianDebounce: any;

  // Age limits (loaded from settings)
  ageLimitMale   = 18;
  ageLimitFemale = 21;

  constructor(
    private svc: OrphanService,
    private guardianSvc: GuardianService,
    private settingsSvc: SettingsService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadAdults();
    this.settingsSvc.getAll().subscribe({
      next: res => {
        const d = res.data ?? {};
        if (d['age_limit_male'])   this.ageLimitMale   = +d['age_limit_male'];
        if (d['age_limit_female']) this.ageLimitFemale = +d['age_limit_female'];
      }
    });
  }

  exceedsLimit(o: any): boolean {
    const limit = o.gender === 'male' ? this.ageLimitMale : this.ageLimitFemale;
    return o.age > limit;
  }

  adultOrphans(orphans: any[]): any[] {
    if (!orphans) return [];
    return orphans.filter(o => this.exceedsLimit(o));
  }

  adultChildrenCount(g: Guardian): number {
    if (!g.orphans) return 0;
    return this.adultOrphans(g.orphans).length;
  }

  // --- List tab ---
  loadAdults(): void {
    this.loading = true;
    this.svc.getAll({ status: 'exceeded_limit' }).subscribe({
      next: r => { this.adults = r.data; this.applyFilter(); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  applyFilter(): void {
    let result = this.adults;
    if (this.genderFilter) result = result.filter(o => o.gender === this.genderFilter);
    if (this.search) {
      const q = this.search.toLowerCase();
      result = result.filter(o =>
        o.full_name.toLowerCase().includes(q) ||
        (o.display_name || '').toLowerCase().includes(q) ||
        (o.guardian?.father_name || '').toLowerCase().includes(q) ||
        (o.guardian?.name || '').toLowerCase().includes(q)
      );
    }
    this.filtered = result;
  }

  setGender(g: string): void { this.genderFilter = g; this.applyFilter(); }
  goDetail(id: number): void { this.router.navigate(['/orphans', id]); }

  // --- Guardian tab ---
  switchTab(tab: 'list' | 'guardians'): void {
    this.activeTab = tab;
    if (tab === 'guardians' && this.guardians.length === 0) this.loadGuardians();
  }

  onGuardianSearch(): void {
    clearTimeout(this.guardianDebounce);
    this.guardianDebounce = setTimeout(() => this.loadGuardians(), 400);
  }

  loadGuardians(): void {
    this.guardianLoading = true;
    const p: any = {};
    if (this.guardianSearch) p.search = this.guardianSearch;
    this.guardianSvc.getAll(p).subscribe({
      next: res => {
        const allGuardians = res.data.filter(g => (g.orphans_count ?? 0) > 0);
        if (allGuardians.length === 0) {
          this.guardians = [];
          this.guardianLoading = false;
          return;
        }
        const requests = allGuardians.map(g =>
          this.guardianSvc.getOrphans(g.id).pipe(map(orphans => ({ id: g.id, orphans })))
        );
        forkJoin(requests).subscribe({
          next: results => {
            results.forEach(r => {
              const g = allGuardians.find(x => x.id === r.id);
              if (g) g.orphans = r.orphans;
            });
            this.guardians = allGuardians.filter(g => this.adultChildrenCount(g) > 0);
            this.guardianLoading = false;
          },
          error: () => { this.guardianLoading = false; }
        });
      },
      error: () => { this.guardianLoading = false; }
    });
  }

  toggleGuardian(id: number): void {
    if (this.expandedGuardianId === id) { this.expandedGuardianId = null; return; }
    this.expandedGuardianId = id;
  }

  exportGuardianPdf(): void {
    this.pdfGuardianLoading = true;
    this.generateGuardianPdf();
  }

  private generateGuardianPdf(): void {
    const lang = this.translate.currentLang || 'fr';
    const isAr = lang === 'ar';
    const dir = isAr ? 'rtl' : 'ltr';
    const t = (key: string) => this.translate.instant(key);
    const thAlign = isAr ? 'right' : 'left';

    let totalAdults = 0;
    let guardiansHtml = '';

    for (const guardian of this.guardians) {
      const adults = this.adultOrphans(guardian.orphans ?? []);
      if (adults.length === 0) continue;
      totalAdults += adults.length;

      const rowsHtml = adults.map((o: any, i: number) => {
        const gColor = o.gender === 'male' ? '#1565C0' : '#AD1457';
        return `<tr style="background:${i % 2 === 0 ? '#fff' : '#FFF8E1'}">
          <td style="padding:6px 8px;text-align:center;color:#999;font-size:11px">${i + 1}</td>
          <td style="padding:6px 8px;font-weight:600;color:#1a1a2e">${o.display_name || '—'}</td>
          <td style="padding:6px 8px;text-align:center;color:${gColor};font-weight:700">${o.gender === 'male' ? t('ORPHANS.MALE') : t('ORPHANS.FEMALE')}</td>
          <td style="padding:6px 8px;text-align:center;color:#555">${o.birth_year || '—'}</td>
          <td style="padding:6px 8px;text-align:center;color:#555">${o.age != null ? o.age + ' ' + t('COMMON.YEARS') : '—'}</td>
          <td style="padding:6px 8px;color:#555">${o.school_name || '—'}</td>
        </tr>`;
      }).join('');

      guardiansHtml += `
        <div style="margin-bottom:18px">
          <div style="background:#FFF8E1;border-radius:6px;padding:10px 14px;margin-bottom:6px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <strong style="color:#E65100;font-size:14px">${guardian.name}</strong>
              <span style="color:#666;font-size:12px">${guardian.phone}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">
              ${guardian.father_name ? `<span style="color:#666;font-size:12px">${t('ORPHANS.FATHER_NAME')} : ${guardian.father_name}</span>` : '<span></span>'}
              <span style="color:#E65100;font-size:12px;font-weight:600">${adults.length} ${t('ADULTS.ADULTS_COUNT')}</span>
            </div>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead><tr>
              <th style="background:#E65100;color:#fff;padding:7px 8px;text-align:center;font-size:11px;width:28px">#</th>
              <th style="background:#E65100;color:#fff;padding:7px 8px;text-align:${thAlign};font-size:11px">${t('ORPHANS.FULL_NAME')}</th>
              <th style="background:#E65100;color:#fff;padding:7px 8px;text-align:center;font-size:11px;width:70px">${t('ORPHANS.GENDER')}</th>
              <th style="background:#E65100;color:#fff;padding:7px 8px;text-align:center;font-size:11px;width:80px">${t('ORPHANS.BIRTH_YEAR')}</th>
              <th style="background:#E65100;color:#fff;padding:7px 8px;text-align:center;font-size:11px;width:55px">${t('ORPHANS.AGE')}</th>
              <th style="background:#E65100;color:#fff;padding:7px 8px;text-align:${thAlign};font-size:11px">${t('ORPHANS.SCHOOL')}</th>
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
        <h1 style="color:#E65100;font-size:18px;margin:0">${t('ADULTS.TITLE')} — ${t('ORPHANS.TAB_BY_GUARDIAN')}</h1>
        <span style="color:#999;font-size:11px">${new Date().toLocaleDateString('fr-FR')}</span>
      </div>
      ${guardiansHtml || `<p style="color:#aaa;text-align:center">${t('ADULTS.NO_DATA')}</p>`}
      <div style="margin-top:14px;padding-top:12px;border-top:2px solid #E65100;color:#E65100;font-weight:700;font-size:14px">
        ${t('COMMON.TOTAL')} : ${totalAdults} ${t('ADULTS.TITLE')}
      </div>`;

    document.body.appendChild(container);
    document.fonts.load('600 12px Cairo').then(() => {
      html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(canvas => {
        document.body.removeChild(container);
        const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const imgH = (canvas.height / canvas.width) * pageW;
        if (imgH <= pageH) {
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pageW, imgH);
        } else {
          let y = 0;
          const ratio = canvas.width / pageW;
          while (y < canvas.height) {
            const sliceH = Math.min(pageH * ratio, canvas.height - y);
            const sc = document.createElement('canvas');
            sc.width = canvas.width; sc.height = sliceH;
            sc.getContext('2d')!.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
            pdf.addImage(sc.toDataURL('image/png'), 'PNG', 0, 0, pageW, sc.height / ratio);
            y += sliceH;
            if (y < canvas.height) pdf.addPage();
          }
        }
        pdf.save(`adultes-par-tuteur-${new Date().toISOString().slice(0, 10)}.pdf`);
        this.pdfGuardianLoading = false;
      }).catch(() => { this.pdfGuardianLoading = false; });
    }).catch(() => { this.pdfGuardianLoading = false; });
  }
}
