import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DonationService } from '../../../core/services/donation.service';
import { Donation } from '../../../core/models/donation.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-donations-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule, ConfirmDialogComponent],
  template: `
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:10px">
        <h1 class="page-title">{{ 'DONATIONS.TITLE' | translate }}</h1>
        <span class="count-badge">{{ donations.length }}</span>
      </div>
      <button class="btn btn-primary" routerLink="/donations/new">+ {{ 'DONATIONS.ADD' | translate }}</button>
    </div>
    <div *ngIf="loading" class="loading-state"><div class="spinner-lg"></div></div>
    <div class="table-card" *ngIf="!loading">
      <table class="data-table">
        <thead><tr>
          <th>{{ 'DONATIONS.DONOR' | translate }}</th>
          <th>{{ 'COMMON.AMOUNT' | translate }}</th>
          <th>{{ 'CONTRIBUTIONS.PAYMENT_METHOD' | translate }}</th>
          <th>{{ 'DONATIONS.PAID_AT' | translate }}</th>
          <th></th>
        </tr></thead>
        <tbody>
          <tr *ngFor="let d of donations" class="clickable-row" (click)="goDetail(d.id)">
            <td class="fw-600">{{ d.donor?.full_name || '—' }}</td>
            <td class="text-green fw-600">{{ d.amount | number:'1.0-0' }} {{ 'COMMON.MRU' | translate }}</td>
            <td>
              <span class="badge" [ngClass]="{
                'success': d.payment_method === 'cash',
                'blue':    d.payment_method === 'bankily',
                'orange':  d.payment_method === 'sadad',
                'purple':  d.payment_method === 'masrafi'
              }">{{ d.payment_method || '—' }}</span>
            </td>
            <td class="text-muted text-sm">{{ d.donated_at | date:'dd/MM/yyyy' }}</td>
            <td (click)="$event.stopPropagation()">
              <div class="action-menu" (click)="toggleMenu(d.id)">
                <button class="btn-dots">⋮</button>
                <div class="dropdown" *ngIf="openMenu===d.id" (click)="$event.stopPropagation()">
                  <a *ngIf="d.screenshot_url" [href]="d.screenshot_url" target="_blank" class="dropdown-item">{{ 'CONTRIBUTIONS.VIEW_RECEIPT' | translate }}</a>
                  <button class="dropdown-item danger" (click)="confirmDelete(d)">{{ 'COMMON.DELETE' | translate }}</button>
                </div>
              </div>
            </td>
          </tr>
          <tr *ngIf="donations.length===0"><td colspan="5" class="empty-cell">{{ 'DONATIONS.NO_DATA' | translate }}</td></tr>
        </tbody>
      </table>
    </div>
    <app-confirm-dialog [visible]="showDelete" type="danger"
      [title]="'DONATIONS.DELETE_TITLE' | translate"
      [message]="'DONATIONS.DELETE_MSG' | translate"
      [confirmLabel]="'COMMON.DELETE' | translate" iconName="delete"
      (confirmed)="deleteConfirmed()" (cancelled)="showDelete=false"></app-confirm-dialog>
  `,
  styles: [`
    .clickable-row { cursor: pointer; transition: background .12s; }
    .clickable-row:hover { background: #f9fafb; }
    .action-menu { position: relative; display: inline-block; }
    .dropdown { position: absolute; right: 0; top: 100%; background: #fff; border: 1px solid #E0E0E0; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.12); z-index: 50; min-width: 130px; overflow: hidden; }
    :host-context(body.rtl) .dropdown { right: auto; left: 0; }
    .dropdown-item { display: block; width: 100%; padding: 9px 14px; font-size: 13px; color: #212121; text-decoration: none; border: none; background: none; cursor: pointer; text-align: left; font-family: inherit; }
    .dropdown-item:hover { background: #F5F5F5; }
    .dropdown-item.danger { color: #C62828; }
    .dropdown-item.danger:hover { background: #FFEBEE; }
    .empty-cell { text-align: center; color: #BDBDBD; padding: 40px; }
  `]
})
export class DonationsListComponent implements OnInit {
  donations: Donation[] = []; loading=false; showDelete=false; selectedId: number|null=null; openMenu: number|null=null;
  constructor(private service: DonationService, private router: Router) {}
  ngOnInit(): void { this.load(); document.addEventListener('click',()=>{this.openMenu=null;}); }
  load(): void { this.loading=true; this.service.getAll().subscribe({next:res=>{this.donations=res.data;this.loading=false;},error:()=>{this.loading=false;}}); }
  goDetail(id: number): void { this.router.navigate(['/donations', id]); }
  goDonor(id: number): void { this.router.navigate(['/donors', id]); }
  toggleMenu(id:number): void { this.openMenu=this.openMenu===id?null:id; }
  confirmDelete(d:Donation): void { this.selectedId=d.id; this.showDelete=true; this.openMenu=null; }
  deleteConfirmed(): void { if(!this.selectedId) return; this.service.delete(this.selectedId).subscribe({next:()=>{this.showDelete=false;this.load();},error:()=>{this.showDelete=false;}}); }
}
