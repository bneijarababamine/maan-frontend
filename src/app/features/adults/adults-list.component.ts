import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OrphanService } from '../../core/services/orphan.service';
import { Orphan } from '../../core/models/orphan.model';

@Component({
  selector: 'app-adults-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule],
  template: `
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:10px">
        <h1 class="page-title">{{ 'ADULTS.TITLE' | translate }}</h1>
        <span class="count-badge">{{ adults.length }}</span>
      </div>
    </div>

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
          <th>#</th>
          <th>{{ 'ORPHANS.FULL_NAME'   | translate }}</th>
          <th>{{ 'ORPHANS.GENDER'      | translate }}</th>
          <th>{{ 'ORPHANS.FATHER_NAME' | translate }}</th>
          <th>{{ 'ORPHANS.GUARDIAN'    | translate }}</th>
          <th>{{ 'ORPHANS.AGE'         | translate }}</th>
          <th></th>
        </tr></thead>
        <tbody>
          <tr *ngFor="let o of filtered; let i = index" class="clickable-row" (click)="goDetail(o.id)">
            <td class="td-num">{{ i + 1 }}</td>
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
                <button [routerLink]="['/orphans', o.id]" class="btn-icon-sm" title="Voir">👁️</button>
                <button [routerLink]="['/orphans', o.id, 'edit']" class="btn-icon-sm" title="Modifier">✏️</button>
              </div>
            </td>
          </tr>
          <tr *ngIf="filtered.length === 0">
            <td colspan="7" class="empty-cell">{{ 'ADULTS.NO_DATA' | translate }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .page-title { font-size: 22px; font-weight: 700; color: #1a1a1a; margin: 0; }
    .count-badge { background: #E8F5E9; color: #2E7D32; padding: 3px 10px; border-radius: 12px; font-size: 13px; font-weight: 700; }
    .filter-row { display: flex; align-items: center; gap: 16px; margin-bottom: 18px; flex-wrap: wrap; }
    .search-input { padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; min-width: 280px; }
    .search-input:focus { border-color: #2E7D32; }
    .gender-chips { display: flex; gap: 8px; }
    .chip { display: flex; align-items: center; gap: 5px; padding: 6px 14px; border-radius: 20px; border: 1.5px solid; cursor: pointer; font-size: 13px; font-weight: 600; background: transparent; font-family: inherit; }
    .chip-default { border-color: #9E9E9E; color: #757575; }
    .chip-default:hover, .chip-default.active { background: #757575; color: #fff; border-color: #757575; }
    .chip-blue { border-color: #1565C0; color: #1565C0; }
    .chip-blue:hover, .chip-blue.active { background: #1565C0; color: #fff; }
    .chip-pink { border-color: #C2185B; color: #C2185B; }
    .chip-pink:hover, .chip-pink.active { background: #C2185B; color: #fff; }
    .table-card { background: #fff; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,.08); overflow: hidden; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: .5px; border-bottom: 1px solid #f0f0f0; background: #fafafa; }
    .data-table td { padding: 13px 16px; border-bottom: 1px solid #f8f8f8; font-size: 14px; color: #333; vertical-align: middle; }
    .clickable-row { cursor: pointer; transition: background .12s; }
    .clickable-row:hover { background: #f9fbe7; }
    .td-num { color: #bbb; font-size: 12px; width: 36px; }
    .orphan-cell { display: flex; align-items: center; gap: 10px; }
    .o-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
    .o-initials { width: 32px; height: 32px; border-radius: 50%; background: #E8F5E9; color: #2E7D32; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
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
  `]
})
export class AdultsListComponent implements OnInit {
  adults: Orphan[] = [];
  filtered: Orphan[] = [];
  loading = true;
  search = '';
  genderFilter = '';

  constructor(
    private svc: OrphanService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
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
}
