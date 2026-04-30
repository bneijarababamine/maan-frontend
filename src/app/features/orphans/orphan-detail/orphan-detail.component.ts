import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { OrphanService } from '../../../core/services/orphan.service';
import { Orphan } from '../../../core/models/orphan.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-orphan-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule, PageHeaderComponent, ConfirmDialogComponent],
  template: `
    <app-page-header [title]="orphan?.full_name || ''" backLink="/orphans">
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
          <!-- Age Status Banner -->
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
            <div class="info-row"><span class="info-key">{{ 'ORPHANS.BIRTH_DATE' | translate }}</span><span>{{ orphan.birth_date | date:'dd/MM/yyyy' }}</span></div>
            <div class="info-row"><span class="info-key">{{ 'ORPHANS.GENDER' | translate }}</span>
              <span class="gender" [class.male]="orphan.gender === 'male'" [class.female]="orphan.gender === 'female'">
                {{ (orphan.gender === 'male' ? 'ORPHANS.MALE' : 'ORPHANS.FEMALE') | translate }}
              </span>
            </div>
            <div class="info-row" *ngIf="orphan.school_name"><span class="info-key">{{ 'ORPHANS.SCHOOL' | translate }}</span><span>{{ orphan.school_name }}</span></div>
            <div class="info-row" *ngIf="orphan.grade"><span class="info-key">{{ 'ORPHANS.GRADE' | translate }}</span><span>{{ orphan.grade }}</span></div>
            <div class="info-row"><span class="info-key">{{ 'ORPHANS.GUARDIAN' | translate }}</span><span>{{ orphan.guardian_name }}</span></div>
            <div class="info-row"><span class="info-key">{{ 'ORPHANS.GUARDIAN_PHONE' | translate }}</span><span>📞 {{ orphan.guardian_phone }}</span></div>
            <div class="info-row"><span class="info-key">{{ 'MEMBERS.ADDRESS' | translate }}</span><span>{{ orphan.address }}</span></div>
            <div class="info-row">
              <span class="info-key">{{ 'MEMBERS.STATUS' | translate }}</span>
              <span class="badge" [class]="orphan.is_active ? 'success' : 'secondary'">
                {{ (orphan.is_active ? 'ORPHANS.STATUS_ACTIVE' : 'ORPHANS.STATUS_INACTIVE') | translate }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Siblings -->
      <div class="right-col">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">👨‍👧‍👦 {{ 'ORPHANS.SIBLINGS' | translate }}</h3>
            <button class="btn-add-sibling" (click)="showAddSibling = !showAddSibling">
              + {{ 'ORPHANS.ADD_SIBLING' | translate }}
            </button>
          </div>

          <!-- Add sibling panel -->
          <div *ngIf="showAddSibling" class="add-sibling-panel">
            <select class="form-control" [(ngModel)]="siblingIdToAdd">
              <option value="">— {{ 'ORPHANS.ADD_SIBLING' | translate }} —</option>
              <option *ngFor="let o of availableOrphans" [value]="o.id">
                {{ o.full_name }} ({{ o.age }} {{ 'COMMON.YEARS' | translate }})
              </option>
            </select>
            <button class="btn btn-green" (click)="addSibling()" [disabled]="!siblingIdToAdd">
              + {{ 'COMMON.SAVE' | translate }}
            </button>
          </div>

          <!-- Siblings list -->
          <div *ngIf="(orphan.siblings?.length || 0) === 0" class="empty-state">
            {{ 'COMMON.NO_DATA' | translate }}
          </div>
          <div *ngFor="let s of orphan.siblings" class="sibling-card">
            <div class="sibling-avatar">{{ s.full_name.charAt(0) }}</div>
            <div class="sibling-info">
              <strong>{{ s.full_name }}</strong>
              <span class="sibling-age">{{ s.age }} {{ 'COMMON.YEARS' | translate }}</span>
              <span class="badge" [class]="s.is_adult ? 'danger' : 'success'">
                {{ s.is_adult ? ('ORPHANS.AGED_OUT' | translate) : (s.months_until_18 + ' ' + ('COMMON.MONTHS' | translate)) }}
              </span>
            </div>
            <button class="btn-remove-sibling" (click)="confirmRemoveSibling(s)" title="{{ 'COMMON.DELETE' | translate }}">✕</button>
          </div>
        </div>
      </div>
    </div>

    <app-confirm-dialog [visible]="showDeleteSibling"
      type="danger"
      [title]="'ORPHANS.REMOVE_SIBLING' | translate"
      [message]="'ORPHANS.REMOVE_SIBLING_MSG' | translate"
      [confirmLabel]="'ORPHANS.REMOVE' | translate"
      iconName="link_off"
      (confirmed)="removeSiblingConfirmed()" (cancelled)="showDeleteSibling = false">
    </app-confirm-dialog>
  `,
  styles: [`
    .detail-layout { display: grid; grid-template-columns: 1fr 2fr; gap: 20px; }
    @media (max-width: 768px) { .detail-layout { grid-template-columns: 1fr; } }
    .left-col, .right-col { display: flex; flex-direction: column; gap: 20px; }
    .card { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .card-title { margin: 0 0 16px; font-size: 16px; font-weight: 700; color: #333; }
    .photo-card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .orphan-photo { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; }
    .photo-placeholder {
      width: 100%; aspect-ratio: 1;
      background: linear-gradient(135deg, #2E7D32, #1565C0);
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-size: 64px; font-weight: 800;
    }
    .age-banner {
      padding: 12px 16px; text-align: center; font-weight: 600; font-size: 14px;
    }
    .age-banner.danger { background: #FFEBEE; color: #C62828; }
    .age-banner.warning { background: #FFF8E1; color: #F57F17; }
    .age-banner.success { background: #E8F5E9; color: #2E7D32; }
    .info-list { display: flex; flex-direction: column; gap: 12px; }
    .info-row { display: flex; justify-content: space-between; font-size: 14px; padding-bottom: 8px; border-bottom: 1px solid #f5f5f5; }
    .info-key { color: #999; font-weight: 500; }
    .gender.male { color: #1565C0; }
    .gender.female { color: #AD1457; }
    .badge { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; display: inline-block; }
    .badge.success { background: #E8F5E9; color: #2E7D32; }
    .badge.danger { background: #FFEBEE; color: #C62828; }
    .badge.secondary { background: #eee; color: #666; }
    .add-sibling-panel { display: flex; gap: 8px; margin-bottom: 16px; align-items: center; }
    .form-control { padding: 8px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; flex: 1; }
    .sibling-card {
      display: flex; align-items: center; gap: 12px;
      padding: 12px; border-radius: 10px; background: #fafafa; margin-bottom: 8px;
    }
    .sibling-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: linear-gradient(135deg, #43A047, #1E88E5);
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 16px; flex-shrink: 0;
    }
    .sibling-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .sibling-info strong { font-size: 14px; }
    .sibling-age { font-size: 12px; color: #999; }
    .btn-remove-sibling {
      background: none; border: none; color: #aaa; cursor: pointer; font-size: 14px; padding: 4px;
    }
    .btn-remove-sibling:hover { color: #C62828; }
    .btn-add-sibling {
      background: none; border: 1px dashed #2E7D32; color: #2E7D32;
      border-radius: 8px; padding: 6px 12px; cursor: pointer; font-size: 13px;
    }
    .btn { padding: 10px 16px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; font-weight: 500; }
    .btn-green { background: #2E7D32; color: #fff; }
    .btn-green:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-edit { background: #1565C0; color: #fff; border: none; border-radius: 8px; padding: 10px 18px; cursor: pointer; font-size: 14px; font-weight: 500; }
    .empty-state { text-align: center; color: #aaa; padding: 20px 0; font-size: 14px; }
    .loading-state { display: flex; justify-content: center; padding: 60px; }
    .spinner-lg { width: 40px; height: 40px; border: 4px solid #eee; border-top-color: #2E7D32; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class OrphanDetailComponent implements OnInit {
  orphan: Orphan | null = null;
  availableOrphans: Orphan[] = [];
  loading = true;
  showAddSibling = false;
  showDeleteSibling = false;
  siblingIdToAdd: number | '' = '';
  selectedSiblingId: number | null = null;

  constructor(private route: ActivatedRoute, private service: OrphanService) {}

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.loadOrphan(id);
    this.service.getAll({ status: 'active' }).subscribe({
      next: res => this.availableOrphans = res.data.filter(o => o.id !== id),
      error: () => {}
    });
  }

  private loadOrphan(id: number): void {
    this.service.getById(id).subscribe({
      next: res => { this.orphan = res.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  addSibling(): void {
    if (!this.orphan || !this.siblingIdToAdd) return;
    this.service.addSibling(this.orphan.id, +this.siblingIdToAdd).subscribe({
      next: () => {
        this.showAddSibling = false;
        this.siblingIdToAdd = '';
        this.loadOrphan(this.orphan!.id);
      },
      error: () => {}
    });
  }

  confirmRemoveSibling(s: Orphan): void {
    this.selectedSiblingId = s.id;
    this.showDeleteSibling = true;
  }

  removeSiblingConfirmed(): void {
    if (!this.orphan || !this.selectedSiblingId) return;
    this.service.removeSibling(this.orphan.id, this.selectedSiblingId).subscribe({
      next: () => { this.showDeleteSibling = false; this.loadOrphan(this.orphan!.id); },
      error: () => { this.showDeleteSibling = false; }
    });
  }
}
