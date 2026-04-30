import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DonorService } from '../../../core/services/donor.service';
import { Donor } from '../../../core/models/donor.model';
import { Donation } from '../../../core/models/donation.model';

@Component({
  selector: 'app-donor-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div class="page-header">
      <button class="btn-back" routerLink="/donors">
        <span class="ms-icon">arrow_back</span>
      </button>
      <div style="flex:1">
        <h1 class="page-title">{{ donor?.full_name }}</h1>
        <div class="text-muted text-sm">{{ donor?.phone }}</div>
      </div>
      <a class="btn btn-primary" [routerLink]="['/donors', donor?.id, 'edit']">{{ 'COMMON.EDIT' | translate }}</a>
    </div>

    <div *ngIf="loading" class="loading-state"><div class="spinner-lg"></div></div>

    <div *ngIf="!loading && donor" class="donor-layout">

      <!-- Summary card -->
      <div class="summary-card">
        <div class="summary-avatar">{{ donor.full_name.charAt(0) }}</div>
        <div class="summary-info">
          <div class="summary-name">{{ donor.full_name }}</div>
          <div class="summary-sub">{{ donor.phone }}{{ donor.address ? ' · ' + donor.address : '' }}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
            <span class="badge" [class]="donor.is_member ? 'blue' : 'secondary'">
              {{ donor.is_member ? ('DONORS.IS_MEMBER' | translate) : ('DONORS.NOT_MEMBER' | translate) }}
            </span>
            <span *ngIf="donor.gender" class="badge" [class]="donor.gender === 'male' ? 'blue' : 'pink'">
              {{ donor.gender === 'male' ? ('DONORS.MALE' | translate) : ('DONORS.FEMALE' | translate) }}
            </span>
          </div>
        </div>
        <div class="total-box">
          <div class="total-label">{{ 'DONORS.TOTAL_DONATIONS' | translate }}</div>
          <div class="total-amount">{{ totalDonated | number:'1.0-0' }} <span class="mru">{{ 'COMMON.MRU' | translate }}</span></div>
          <div class="total-count">{{ donations.length }} {{ 'DONATIONS.TITLE' | translate }}</div>
        </div>
      </div>

      <!-- Donations list -->
      <div class="table-card">
        <div class="card-header-row">
          <h3 class="card-title">{{ 'DONATIONS.TITLE' | translate }}</h3>
          <a class="btn btn-primary btn-sm" [routerLink]="['/donations/new']" [queryParams]="{ donor_id: donor?.id }">+ {{ 'DONATIONS.ADD' | translate }}</a>
        </div>

        <div *ngIf="donations.length === 0" class="empty-cell">{{ 'DONATIONS.NO_DATA' | translate }}</div>

        <table class="data-table" *ngIf="donations.length > 0">
          <thead><tr>
            <th>{{ 'DONATIONS.PAID_AT' | translate }}</th>
            <th>{{ 'COMMON.AMOUNT' | translate }}</th>
            <th>{{ 'CONTRIBUTIONS.PAYMENT_METHOD' | translate }}</th>
            <th>{{ 'CONTRIBUTIONS.TRANSACTION_REF' | translate }}</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let d of donations">
              <td class="text-muted text-sm">{{ d.donated_at | date:'dd/MM/yyyy' }}</td>
              <td class="text-green fw-600">{{ d.amount | number:'1.0-0' }} {{ 'COMMON.MRU' | translate }}</td>
              <td>
                <span class="badge" [ngClass]="{
                  'success': d.payment_method === 'cash',
                  'blue':    d.payment_method === 'bankily',
                  'orange':  d.payment_method === 'sadad',
                  'purple':  d.payment_method === 'masrafi'
                }">{{ d.payment_method || '—' }}</span>
              </td>
              <td class="text-muted text-sm">{{ d.transaction_ref || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
    .btn-back { background: #f5f5f5; border: none; border-radius: 8px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #555; }
    .btn-back:hover { background: #ebebeb; }
    .ms-icon { font-family: 'Material Symbols Outlined'; font-style: normal; font-weight: normal; font-variation-settings: 'FILL' 0, 'wght' 400; font-size: 20px; line-height: 1; }
    .donor-layout { display: flex; flex-direction: column; gap: 20px; }
    .summary-card { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,.07); display: flex; align-items: center; gap: 20px; }
    .summary-avatar { width: 56px; height: 56px; border-radius: 14px; background: #2D5A27; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700; flex-shrink: 0; }
    .summary-info { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .summary-name { font-size: 18px; font-weight: 700; color: #212121; }
    .summary-sub { font-size: 13px; color: #757575; }
    .badge { padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; }
    .badge.blue { background: #E3F2FD; color: #1565C0; }
    .badge.secondary { background: #F5F5F5; color: #757575; }
    .badge.pink { background: #FCE4EC; color: #C2185B; }
    .badge.success { background: #E8F5E9; color: #2E7D32; }
    .badge.orange { background: #FFF3E0; color: #E65100; }
    .badge.purple { background: #F3E5F5; color: #7B1FA2; }
    .total-box { text-align: right; }
    .total-label { font-size: 12px; color: #999; margin-bottom: 4px; }
    .total-amount { font-size: 26px; font-weight: 800; color: #2E7D32; line-height: 1; }
    .total-amount .mru { font-size: 14px; font-weight: 500; }
    .total-count { font-size: 12px; color: #999; margin-top: 4px; }
    .card-header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .card-title { margin: 0; font-size: 15px; font-weight: 700; color: #212121; }
    .btn-sm { padding: 7px 14px; font-size: 13px; }
    .empty-cell { text-align: center; color: #BDBDBD; padding: 40px; }
    .loading-state { display: flex; justify-content: center; padding: 80px; }
    .spinner-lg { width: 40px; height: 40px; border: 4px solid #eee; border-top-color: #2E7D32; border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class DonorDetailComponent implements OnInit {
  donor: Donor | null = null;
  donations: Donation[] = [];
  loading = true;

  get totalDonated(): number {
    return this.donations.reduce((s, d) => s + d.amount, 0);
  }

  constructor(private route: ActivatedRoute, private service: DonorService) {}

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.service.getById(id).subscribe({
      next: res => {
        this.donor = res.data;
        this.loading = false;
        this.service.getDonations(id).subscribe({ next: list => this.donations = list });
      },
      error: () => { this.loading = false; }
    });
  }
}
