import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OrphanService } from '../../../core/services/orphan.service';
import { GuardianService } from '../../../core/services/guardian.service';
import { Orphan } from '../../../core/models/orphan.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-orphan-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, PageHeaderComponent],
  template: `
    <app-page-header [title]="orphan?.display_name || orphan?.full_name || ''" backLink="/orphans">
      <button class="btn btn-edit" [routerLink]="['/orphans', orphan?.id, 'edit']">✏️ {{ 'COMMON.EDIT' | translate }}</button>
    </app-page-header>

    <div *ngIf="loading" class="loading-state"><div class="spinner-lg"></div></div>

    <div *ngIf="!loading && orphan" class="detail-layout">
      <!-- Left: Info + Photo -->
      <div class="left-col">
        <!-- Photo -->
        <div class="photo-card">
          <img *ngIf="orphan.photo_url" [src]="orphan.photo_url" [alt]="orphan.full_name" class="orphan-photo">
          <div *ngIf="!orphan.photo_url" class="photo-placeholder">
            {{ orphan.full_name.charAt(0) }}
          </div>
          <div class="age-banner" [class.danger]="orphan.is_adult" [class.warning]="!orphan.is_adult && (orphan.months_until_18 || 99) <= 6" [class.success]="!orphan.is_adult && (orphan.months_until_18 || 99) > 6">
            <span *ngIf="orphan.is_adult">🔴 {{ 'ORPHANS.AGED_OUT' | translate }}</span>
            <span *ngIf="!orphan.is_adult">
              {{ orphan.age }} {{ 'COMMON.YEARS' | translate }}
              · {{ orphan.months_until_18 }} {{ 'ORPHANS.MONTHS_UNTIL_18' | translate }}
            </span>
          </div>
        </div>

        <!-- Info -->
        <div class="card">
          <h3 class="card-title">ℹ️ {{ 'ORPHANS.TITLE' | translate }}</h3>
          <div class="info-list">
            <div class="info-row">
              <span class="info-key">{{ 'ORPHANS.BIRTH_DATE' | translate }}</span>
              <span>{{ orphan.birth_year }}</span>
            </div>
            <div class="info-row">
              <span class="info-key">{{ 'ORPHANS.GENDER' | translate }}</span>
              <span class="gender" [class.male]="orphan.gender === 'male'" [class.female]="orphan.gender === 'female'">
                {{ (orphan.gender === 'male' ? 'ORPHANS.MALE' : 'ORPHANS.FEMALE') | translate }}
              </span>
            </div>
            <div class="info-row" *ngIf="orphan.school_name">
              <span class="info-key">{{ 'ORPHANS.SCHOOL' | translate }}</span>
              <span>{{ orphan.school_name }}</span>
            </div>
            <div class="info-row" *ngIf="orphan.grade">
              <span class="info-key">{{ 'ORPHANS.GRADE' | translate }}</span>
              <span>{{ orphan.grade }}</span>
            </div>
            <div class="info-row" *ngIf="orphan.guardian">
              <span class="info-key">{{ 'ORPHANS.GUARDIAN' | translate }}</span>
              <a [routerLink]="['/guardians', orphan.guardian!.id]" class="guardian-link">{{ orphan.guardian!.name }}</a>
            </div>
            <div class="info-row" *ngIf="orphan.guardian?.father_name">
              <span class="info-key">{{ 'ORPHANS.FATHER_NAME' | translate }}</span>
              <span>{{ orphan.guardian!.father_name }}</span>
            </div>
            <div class="info-row" *ngIf="orphan.guardian?.phone">
              <span class="info-key">{{ 'ORPHANS.GUARDIAN_PHONE' | translate }}</span>
              <span>📞 {{ orphan.guardian!.phone }}</span>
            </div>
            <div class="info-row" *ngIf="orphan.guardian?.whatsapp">
              <span class="info-key">WhatsApp</span>
              <span>📱 {{ orphan.guardian!.whatsapp }}</span>
            </div>
            <div class="info-row">
              <span class="info-key">{{ 'MEMBERS.STATUS' | translate }}</span>
              <span class="badge" [class]="orphan.is_active ? 'success' : 'secondary'">
                {{ (orphan.is_active ? 'ORPHANS.STATUS_ACTIVE' : 'ORPHANS.STATUS_INACTIVE') | translate }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Siblings + Benefits -->
      <div class="right-col">

        <!-- Benefits (what we gave) -->
        <div class="card">
          <h3 class="card-title">⬇ {{ 'SEARCH.RECEIVED_FROM_US' | translate }} ({{ benefits.length }})</h3>
          <div *ngIf="benefitsLoading" class="loading-state"><div class="spinner-sm"></div></div>
          <div *ngIf="!benefitsLoading && benefits.length === 0" class="empty-state">
            {{ 'COMMON.NO_DATA' | translate }}
          </div>
          <a *ngFor="let b of benefits"
             [routerLink]="['/activities', b.activity_id]"
             class="benefit-row">
            <span class="benefit-dot" [style.background]="activityColor(b.activity_type)"></span>
            <div class="benefit-info">
              <strong>{{ isAr ? (b.activity_title_ar || b.activity_title_fr) : (b.activity_title_fr || b.activity_title_ar) }}</strong>
              <span class="benefit-date">{{ b.activity_date | date:'dd/MM/yyyy' }}</span>
            </div>
            <span *ngIf="b.payment_type === 'financial' && b.value_received" class="benefit-amount">
              {{ b.value_received | number:'1.0-0' }} {{ 'COMMON.MRU' | translate }}
            </span>
          </a>
        </div>

        <!-- Siblings -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">{{ 'ORPHANS.SIBLINGS' | translate }} ({{ siblings.length }})</h3>
            <a *ngIf="orphan.guardian"
               [routerLink]="['/guardians', orphan.guardian!.id, 'orphans', 'new']"
               class="btn-add-sibling">
              + {{ 'ORPHANS.ADD_SIBLING' | translate }}
            </a>
          </div>

          <div *ngIf="siblings.length === 0" class="empty-state">
            {{ 'COMMON.NO_DATA' | translate }}
          </div>

          <a *ngFor="let s of siblings"
             [routerLink]="['/orphans', s.id]"
             class="sibling-card">
            <div class="sibling-avatar" [class.male-av]="s.gender==='male'" [class.female-av]="s.gender==='female'">
              {{ s.full_name.charAt(0) }}
            </div>
            <div class="sibling-info">
              <strong>{{ s.display_name || s.full_name }}</strong>
              <span class="sibling-age">{{ s.age }} {{ 'COMMON.YEARS' | translate }}</span>
            </div>
            <span class="badge" [class]="s.is_adult ? 'danger' : 'success'">
              {{ s.is_adult ? ('ORPHANS.AGED_OUT' | translate) : (s.age + ' ans') }}
            </span>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .detail-layout { display: grid; grid-template-columns: 1fr 2fr; gap: 20px; padding: 0; }
    @media (max-width: 768px) { .detail-layout { grid-template-columns: 1fr; } }
    .left-col, .right-col { display: flex; flex-direction: column; gap: 20px; }
    .card { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .card-title { margin: 0; font-size: 16px; font-weight: 700; color: #333; }
    .photo-card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .orphan-photo { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; }
    .photo-placeholder {
      width: 100%; aspect-ratio: 1;
      background: linear-gradient(135deg, #2E7D32, #1565C0);
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-size: 64px; font-weight: 800;
    }
    .age-banner { padding: 12px 16px; text-align: center; font-weight: 600; font-size: 14px; }
    .age-banner.danger  { background: #FFEBEE; color: #C62828; }
    .age-banner.warning { background: #FFF8E1; color: #F57F17; }
    .age-banner.success { background: #E8F5E9; color: #2E7D32; }
    .info-list { display: flex; flex-direction: column; gap: 12px; }
    .info-row { display: flex; justify-content: space-between; font-size: 14px; padding-bottom: 8px; border-bottom: 1px solid #f5f5f5; }
    .info-key { color: #999; font-weight: 500; }
    .gender.male   { color: #1565C0; }
    .gender.female { color: #AD1457; }
    .badge { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; display: inline-block; }
    .badge.success   { background: #E8F5E9; color: #2E7D32; }
    .badge.danger    { background: #FFEBEE; color: #C62828; }
    .badge.secondary { background: #eee;    color: #666;    }
    .btn-add-sibling {
      background: none; border: 1px dashed #2E7D32; color: #2E7D32;
      border-radius: 8px; padding: 6px 12px; font-size: 13px; font-weight: 600;
      text-decoration: none; white-space: nowrap;
    }
    .btn-add-sibling:hover { background: #E8F5E9; }
    .sibling-card {
      display: flex; align-items: center; gap: 12px;
      padding: 12px; border-radius: 10px; background: #fafafa; margin-bottom: 8px;
      text-decoration: none; color: inherit; transition: background 0.15s;
    }
    .sibling-card:hover { background: #f0f0f0; }
    .sibling-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 16px; flex-shrink: 0;
    }
    .sibling-avatar.male-av   { background: linear-gradient(135deg, #1565C0, #42A5F5); }
    .sibling-avatar.female-av { background: linear-gradient(135deg, #AD1457, #F06292); }
    .sibling-info { flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .sibling-info strong { font-size: 14px; color: #222; }
    .sibling-age { font-size: 12px; color: #999; }
    .btn-edit { background: #1565C0; color: #fff; border: none; border-radius: 8px; padding: 10px 18px; cursor: pointer; font-size: 14px; font-weight: 500; }
    .guardian-link { color: #1565C0; text-decoration: none; font-weight: 500; }
    .guardian-link:hover { text-decoration: underline; }
    .empty-state { text-align: center; color: #aaa; padding: 20px 0; font-size: 14px; }
    .loading-state { display: flex; justify-content: center; padding: 60px; }
    .spinner-lg { width: 40px; height: 40px; border: 4px solid #eee; border-top-color: #2E7D32; border-radius: 50%; animation: spin 0.8s linear infinite; }
    .spinner-sm { width: 24px; height: 24px; border: 3px solid #eee; border-top-color: #2E7D32; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 12px auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .benefit-row {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 0; border-bottom: 1px solid #f5f5f5;
      text-decoration: none; color: inherit; transition: background 0.12s;
      border-radius: 6px; padding-inline: 4px;
    }
    .benefit-row:last-child { border-bottom: none; }
    .benefit-row:hover { background: #f0f4ff; }
    .benefit-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .benefit-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .benefit-info strong { font-size: 13px; color: #222; }
    .benefit-date { font-size: 11px; color: #999; }
    .benefit-amount { font-weight: 700; font-size: 13px; color: #1565C0; white-space: nowrap; }
  `]
})
export class OrphanDetailComponent implements OnInit {
  orphan: Orphan | null = null;
  siblings: any[] = [];
  benefits: any[] = [];
  loading = true;
  benefitsLoading = false;

  private activityColors: Record<string, string> = {
    school_fees: '#1565C0', eid_help: '#F57F17', food_basket: '#2E7D32',
    winter_clothes: '#6A1B9A', ramadan: '#E64A19', other: '#757575',
  };

  get isAr(): boolean { return this.translate.currentLang === 'ar'; }

  constructor(
    private route: ActivatedRoute,
    private service: OrphanService,
    private guardianService: GuardianService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.service.getById(id).subscribe({
      next: res => {
        this.orphan = res.data;
        this.loading = false;
        if (this.orphan?.guardian?.id) {
          this.loadSiblings(this.orphan.guardian.id, id);
        }
        this.loadBenefits(id);
      },
      error: () => { this.loading = false; }
    });
  }

  private loadSiblings(guardianId: number, currentId: number): void {
    this.guardianService.getOrphans(guardianId).subscribe({
      next: orphans => this.siblings = orphans.filter((o: any) => o.id !== currentId),
      error: () => {}
    });
  }

  private loadBenefits(id: number): void {
    this.benefitsLoading = true;
    this.service.getBenefits(id).subscribe({
      next: (res: any) => { this.benefits = Array.isArray(res) ? res : (res.data ?? []); this.benefitsLoading = false; },
      error: () => { this.benefitsLoading = false; }
    });
  }

  activityColor(type: string): string { return this.activityColors[type] ?? '#757575'; }
}
