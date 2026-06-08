import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChronicPatientService, ChronicPatient } from '../../../core/services/chronic-patient.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-chronic-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule, PageHeaderComponent, ConfirmDialogComponent],
  template: `
    <app-page-header [title]="'CHRONIC.TITLE' | translate">
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
  `]
})
export class ChronicListComponent implements OnInit {
  patients: ChronicPatient[] = [];
  loading = false;
  search = '';
  statusFilter = '';
  showDelete = false;
  deleteTarget: ChronicPatient | null = null;
  private searchTimer: any;

  constructor(private service: ChronicPatientService) {}

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

  askDelete(p: ChronicPatient): void { this.deleteTarget = p; this.showDelete = true; }

  confirmDelete(): void {
    if (!this.deleteTarget) return;
    this.service.delete(this.deleteTarget.id).subscribe({
      next: () => { this.showDelete = false; this.deleteTarget = null; this.load(); },
      error: () => { this.showDelete = false; }
    });
  }
}
