import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ContributionService } from '../../../core/services/contribution.service';
import { BankService } from '../../../core/services/bank.service';
import { Bank } from '../../../core/models/bank.model';
import { Contribution } from '../../../core/models/contribution.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-contributions-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule, ConfirmDialogComponent],
  template: `
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:10px">
        <h1 class="page-title">{{ 'CONTRIBUTIONS.TITLE' | translate }}</h1>
        <span class="count-badge">{{ contributions.length }}</span>
      </div>
      <button class="btn btn-primary" routerLink="/contributions/new">
        + {{ 'CONTRIBUTIONS.ADD' | translate }}
      </button>
    </div>

    <div class="filters-bar">
      <input class="search-input" [(ngModel)]="searchTerm" (input)="onSearch()"
             [placeholder]="'COMMON.SEARCH' | translate">
      <select class="filter-select" [(ngModel)]="paymentFilter" (change)="load()">
        <option value="">{{ 'CONTRIBUTIONS.ALL_METHODS' | translate }}</option>
        <option *ngFor="let b of banks" [value]="b.value">{{ b.label }}</option>
      </select>
    </div>

    <div *ngIf="loading" class="loading-state"><div class="spinner-lg"></div></div>

    <div class="table-card" *ngIf="!loading">
      <table class="data-table">
        <thead>
          <tr>
            <th>{{ 'CONTRIBUTIONS.MEMBER' | translate }}</th>
            <th>{{ 'CONTRIBUTIONS.MONTHS_COUNT' | translate }}</th>
            <th>{{ 'CONTRIBUTIONS.TOTAL' | translate }}</th>
            <th>{{ 'CONTRIBUTIONS.PAYMENT_METHOD' | translate }}</th>
            <th>{{ 'CONTRIBUTIONS.PAID_AT' | translate }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let c of contributions; let i = index; let last = last"
              class="clickable-row" (click)="goDetail(c.id)">
            <td>
              <a class="table-name" [routerLink]="['/members', c.member_id]">{{ c.member?.full_name || '—' }}</a>
              <div class="text-sm text-muted">{{ c.member?.phone }}</div>
            </td>
            <td>{{ c.months_count }} mois</td>
            <td class="text-green fw-600">{{ c.total_amount | number:'1.0-0' }} {{ 'COMMON.MRU' | translate }}</td>
            <td>
              <span class="badge" [ngClass]="badgeClass(c.payment_method)">
                {{ c.payment_method | titlecase }}
              </span>
            </td>
            <td class="text-muted text-sm">{{ c.paid_at | date:'dd/MM/yyyy' }}</td>
            <td (click)="$event.stopPropagation()">
              <div class="action-menu">
                <button class="btn-dots" (click)="toggleMenu(c.id, $event)">⋮</button>
                <div class="dropdown" *ngIf="openMenu === c.id"
                     [class.drop-up]="dropUp"
                     (click)="$event.stopPropagation()">
                  <a class="dropdown-item" [routerLink]="['/contributions', c.id]">{{ 'COMMON.VIEW' | translate }}</a>
                  <a class="dropdown-item" [routerLink]="['/contributions', c.id, 'edit']">{{ 'COMMON.EDIT' | translate }}</a>
                  <a *ngIf="c.screenshot_url" [href]="c.screenshot_url" target="_blank" class="dropdown-item">{{ 'CONTRIBUTIONS.VIEW_RECEIPT' | translate }}</a>
                  <button class="dropdown-item danger" (click)="confirmDelete(c)">{{ 'COMMON.DELETE' | translate }}</button>
                </div>
              </div>
            </td>
          </tr>
          <tr *ngIf="contributions.length === 0">
            <td colspan="6" class="empty-cell">{{ 'CONTRIBUTIONS.NO_DATA' | translate }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <app-confirm-dialog [visible]="showDelete" type="danger"
      [title]="'CONTRIBUTIONS.DELETE_TITLE' | translate"
      [message]="'CONTRIBUTIONS.DELETE_MSG' | translate"
      [confirmLabel]="'COMMON.DELETE' | translate" iconName="delete"
      (confirmed)="deleteConfirmed()" (cancelled)="showDelete = false">
    </app-confirm-dialog>
  `,
  styles: [`
    .filters-bar { display: flex; gap: 12px; margin-bottom: 16px; align-items: center; }
    .search-input { flex: 1; padding: 9px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; }
    .search-input:focus { border-color: #2E7D32; }
    .filter-select { padding: 9px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; background: #fff; min-width: 160px; cursor: pointer; }
    .filter-select:focus { border-color: #2E7D32; }
    .clickable-row { cursor: pointer; transition: background .12s; }
    .clickable-row:hover { background: #f9fafb; }
    .action-menu { position: relative; display: inline-block; }
    .dropdown {
      position: absolute; right: 0; top: 100%;
      background: #fff; border: 1px solid #E0E0E0;
      border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      z-index: 100; min-width: 130px; overflow: hidden;
    }
    .dropdown.drop-up { top: auto; bottom: 100%; }
    :host-context(body.rtl) .dropdown { right: auto; left: 0; }
    .dropdown-item {
      display: block; width: 100%;
      padding: 9px 14px; font-size: 13px; color: #212121;
      text-decoration: none; border: none; background: none;
      cursor: pointer; text-align: left; font-family: inherit;
    }
    .dropdown-item:hover { background: #F5F5F5; }
    .dropdown-item.danger { color: #C62828; }
    .dropdown-item.danger:hover { background: #FFEBEE; }
    .empty-cell { text-align: center; color: #BDBDBD; padding: 40px; }
  `]
})
export class ContributionsListComponent implements OnInit {
  contributions: Contribution[] = [];
  banks: { value: string; label: string }[] = [];
  loading = false;
  searchTerm = '';
  paymentFilter = '';
  showDelete = false;
  selectedId: number | null = null;
  openMenu: number | null = null;
  dropUp = false;
  private t: any;

  constructor(
    private service: ContributionService,
    private bankService: BankService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.load();
    this.loadBanks();
    document.addEventListener('click', () => { this.openMenu = null; });
  }

  loadBanks(): void {
    this.bankService.getAll().subscribe({
      next: res => {
        this.banks = res.data
          .filter((b: Bank) => b.is_active)
          .map((b: Bank) => ({ value: b.name_fr.toLowerCase(), label: b.name_fr }));
      }
    });
  }

  load(): void {
    this.loading = true;
    const params: any = {};
    if (this.searchTerm) params.search = this.searchTerm;
    if (this.paymentFilter) params.payment_method = this.paymentFilter;
    this.service.getAll(params).subscribe({
      next: res => { this.contributions = res.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onSearch(): void { clearTimeout(this.t); this.t = setTimeout(() => this.load(), 400); }

  toggleMenu(id: number, event: MouseEvent): void {
    if (this.openMenu === id) { this.openMenu = null; return; }
    this.openMenu = id;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.dropUp = rect.bottom > window.innerHeight - 180;
    event.stopPropagation();
  }

  badgeClass(method: string): string {
    const m = (method || '').toLowerCase();
    if (m === 'cash') return 'success';
    if (m === 'bankily') return 'blue';
    return 'orange';
  }

  goDetail(id: number): void { this.router.navigate(['/contributions', id]); }
  confirmDelete(c: Contribution): void { this.selectedId = c.id; this.showDelete = true; this.openMenu = null; }
  deleteConfirmed(): void {
    if (!this.selectedId) return;
    this.service.delete(this.selectedId).subscribe({
      next: () => { this.showDelete = false; this.load(); },
      error: () => { this.showDelete = false; }
    });
  }
}
