import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FamilyService } from '../../../core/services/family.service';
import { Family } from '../../../core/models/family.model';

@Component({
  selector: 'app-family-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div class="page-header">
      <button class="btn-back" routerLink="/families"><span class="ms-icon">arrow_back</span></button>
      <div style="flex:1">
        <h1 class="page-title">{{ family?.representative_name }}</h1>
        <div class="text-muted text-sm">{{ family?.phone }}</div>
      </div>
      <a class="btn btn-outline" [routerLink]="['/families', family?.id, 'edit']">{{ 'COMMON.EDIT' | translate }}</a>
    </div>

    <div *ngIf="loading" class="loading-state"><div class="spinner-lg"></div></div>

    <div *ngIf="!loading && family" class="detail-card">
      <div class="avatar-row">
        <div class="family-avatar">{{ family.representative_name.charAt(0) }}</div>
        <div>
          <div class="detail-name">{{ family.representative_name }}</div>
          <span class="badge" [class]="family.is_active ? 'success' : 'secondary'">
            {{ (family.is_active ? 'COMMON.ACTIVE' : 'COMMON.INACTIVE') | translate }}
          </span>
        </div>
      </div>

      <div class="info-rows">
        <div class="info-row">
          <span class="info-key">{{ 'FAMILIES.PHONE' | translate }}</span>
          <span>{{ family.phone }}</span>
        </div>
        <div class="info-row">
          <span class="info-key">{{ 'FAMILIES.ADDRESS' | translate }}</span>
          <span>{{ family.address || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="info-key">{{ 'FAMILIES.MEMBERS_COUNT' | translate }}</span>
          <span class="count-chip">{{ family.members_count }} {{ 'FAMILIES.PERSONS' | translate }}</span>
        </div>
        <div class="info-row" *ngIf="family.notes">
          <span class="info-key">{{ 'COMMON.NOTES' | translate }}</span>
          <span class="notes-text">{{ family.notes }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    .btn-back { background: #f5f5f5; border: none; border-radius: 8px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #555; }
    .btn-back:hover { background: #ebebeb; }
    .ms-icon { font-family: 'Material Symbols Outlined'; font-style: normal; font-weight: normal; font-variation-settings: 'FILL' 0,'wght' 400; font-size: 20px; line-height: 1; }
    .btn-outline { padding: 9px 18px; border-radius: 8px; border: 1px solid #E65100; background: #fff; color: #E65100; font-size: 13px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
    .detail-card { background: #fff; border-radius: 16px; padding: 28px; box-shadow: 0 2px 12px rgba(0,0,0,.07); max-width: 560px; }
    .avatar-row { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .family-avatar { width: 52px; height: 52px; border-radius: 14px; background: #E65100; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; flex-shrink: 0; }
    .detail-name { font-size: 18px; font-weight: 700; color: #212121; margin-bottom: 6px; }
    .info-rows { display: flex; flex-direction: column; }
    .info-row { display: flex; justify-content: space-between; align-items: flex-start; font-size: 14px; padding: 12px 0; border-bottom: 1px solid #f5f5f5; }
    .info-row:last-child { border-bottom: none; }
    .info-key { color: #999; font-size: 12px; min-width: 130px; }
    .count-chip { background: #FFF3E0; color: #E65100; padding: 3px 10px; border-radius: 8px; font-weight: 700; }
    .notes-text { color: #555; max-width: 300px; text-align: right; }
    .loading-state { display: flex; justify-content: center; padding: 80px; }
    .spinner-lg { width: 40px; height: 40px; border: 4px solid #eee; border-top-color: #E65100; border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class FamilyDetailComponent implements OnInit {
  family: Family | null = null;
  loading = true;

  constructor(private route: ActivatedRoute, private svc: FamilyService) {}

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.svc.getById(id).subscribe({
      next: res => { this.family = res.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}
