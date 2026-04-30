import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ContributionService } from '../../../core/services/contribution.service';
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
          <tr *ngFor="let c of contributions" class="clickable-row" (click)="goDetail(c.id)">
            <td>
              <a class="table-name" [routerLink]="['/members', c.member_id]">{{ c.member?.full_name || '—' }}</a>
              <div class="text-sm text-muted">{{ c.member?.phone }}</div>
            </td>
            <td>{{ c.months_count }} mois</td>
            <td class="text-green fw-600">{{ c.total_amount | number:'1.0-0' }} {{ 'COMMON.MRU' | translate }}</td>
            <td>
              <span class="badge" [ngClass]="{
                'success': c.payment_method === 'cash',
                'blue':    c.payment_method === 'bankily',
                'orange':  c.payment_method === 'sadad',
                'purple':  c.payment_method === 'masrafi'
              }">{{ c.payment_method | titlecase }}</span>
            </td>
            <td class="text-muted text-sm">{{ c.paid_at | date:'dd/MM/yyyy' }}</td>
            <td (click)="$event.stopPropagation()">
              <div class="action-menu" (click)="toggleMenu(c.id)">
                <button class="btn-dots">⋮</button>
                <div class="dropdown" *ngIf="openMenu === c.id" (click)="$event.stopPropagation()">
                  <a class="dropdown-item" [routerLink]="['/members', c.member_id]">{{ 'COMMON.VIEW' | translate }}</a>
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
    .clickable-row { cursor: pointer; transition: background .12s; }
    .clickable-row:hover { background: #f9fafb; }
    .action-menu { position: relative; display: inline-block; }
    .dropdown {
      position: absolute; right: 0; top: 100%;
      background: #fff; border: 1px solid #E0E0E0;
      border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      z-index: 50; min-width: 130px; overflow: hidden;
    }
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
  loading = false;
  searchTerm = '';
  showDelete = false;
  selectedId: number | null = null;
  openMenu: number | null = null;
  private t: any;

  constructor(private service: ContributionService, private router: Router) {}
  ngOnInit(): void {
    this.load();
    document.addEventListener('click', () => { this.openMenu = null; });
  }

  load(): void {
    this.loading = true;
    this.service.getAll(this.searchTerm ? { search: this.searchTerm } : {}).subscribe({
      next: res => { this.contributions = res.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onSearch(): void { clearTimeout(this.t); this.t = setTimeout(() => this.load(), 400); }
  goDetail(id: number): void { this.router.navigate(['/contributions', id]); }
  goMember(id: number): void { this.router.navigate(['/members', id]); }
  toggleMenu(id: number): void { this.openMenu = this.openMenu === id ? null : id; }
  confirmDelete(c: Contribution): void { this.selectedId = c.id; this.showDelete = true; this.openMenu = null; }
  deleteConfirmed(): void {
    if (!this.selectedId) return;
    this.service.delete(this.selectedId).subscribe({
      next: () => { this.showDelete = false; this.load(); },
      error: () => { this.showDelete = false; }
    });
  }
}
