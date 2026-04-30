import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MemberService } from '../../../core/services/member.service';
import { Member } from '../../../core/models/member.model';
import { Contribution } from '../../../core/models/contribution.model';

const MONTH_FR = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
interface YearGrid { year: number; months: { month: number; label: string; paid: boolean }[] }

@Component({
  selector: 'app-member-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div class="page-header">
      <button class="btn-back" routerLink="/members"><span class="ms-icon">arrow_back</span></button>
      <div style="flex:1">
        <h1 class="page-title">{{ member?.full_name }}</h1>
        <div class="text-muted text-sm">{{ member?.phone }}{{ member?.profession ? ' · ' + member?.profession : '' }}</div>
      </div>
      <a class="btn btn-outline" [routerLink]="['/members', member?.id, 'edit']">{{ 'COMMON.EDIT' | translate }}</a>
      <a class="btn btn-primary" [routerLink]="['/contributions/new']" [queryParams]="{ member_id: member?.id }">+ {{ 'CONTRIBUTIONS.ADD' | translate }}</a>
    </div>

    <div *ngIf="loading" class="loading-state"><div class="spinner-lg"></div></div>

    <div *ngIf="!loading && member" class="layout">
      <!-- Left col: info + totals -->
      <div class="left-col">
        <div class="info-card">
          <div class="member-avatar">{{ member.full_name.charAt(0) }}</div>
          <div class="info-rows">
            <div class="info-row" *ngIf="member.gender">
              <span class="info-key">{{ 'MEMBERS.GENDER' | translate }}</span>
              <span class="badge" [class]="member.gender === 'male' ? 'blue' : 'pink'">
                {{ member.gender === 'male' ? ('MEMBERS.MALE' | translate) : ('MEMBERS.FEMALE' | translate) }}
              </span>
            </div>
            <div class="info-row"><span class="info-key">{{ 'MEMBERS.ADDRESS' | translate }}</span><span>{{ member.address || '—' }}</span></div>
            <div class="info-row"><span class="info-key">{{ 'MEMBERS.WHATSAPP' | translate }}</span><span>{{ member.whatsapp || '—' }}</span></div>
            <div class="info-row"><span class="info-key">{{ 'MEMBERS.JOIN_DATE' | translate }}</span><span>{{ member.join_date | date:'dd/MM/yyyy' }}</span></div>
            <div class="info-row"><span class="info-key">{{ 'MEMBERS.MONTHLY_AMOUNT' | translate }}</span><span class="amount-chip">{{ member.monthly_amount | number:'1.0-0' }} {{ 'COMMON.MRU' | translate }}</span></div>
            <div class="info-row">
              <span class="info-key">{{ 'COMMON.STATUS' | translate }}</span>
              <span class="badge" [class]="member.is_active?'success':'secondary'">{{ (member.is_active?'COMMON.ACTIVE':'COMMON.INACTIVE')|translate }}</span>
            </div>
          </div>
          <div class="totals-row">
            <div class="total-box green">
              <div class="total-val">{{ totalPaid | number:'1.0-0' }}</div>
              <div class="total-lbl">{{ 'MEMBERS.TOTAL_PAID' | translate }} ({{ 'COMMON.MRU' | translate }})</div>
            </div>
            <div class="total-box blue">
              <div class="total-val">{{ paidMonthsCount }}</div>
              <div class="total-lbl">{{ 'MEMBERS.MONTHS_PAID' | translate }}</div>
            </div>
            <div class="total-box red">
              <div class="total-val">{{ unpaidMonthsCount }}</div>
              <div class="total-lbl">{{ 'MEMBERS.MONTHS_UNPAID' | translate }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right col: yearly grids -->
      <div class="right-col">
        <div class="years-card">
          <h3 class="card-title">{{ 'MEMBERS.PAYMENT_HISTORY' | translate }}</h3>
          <div *ngIf="yearGrids.length === 0" class="empty-cell">{{ 'CONTRIBUTIONS.NO_DATA' | translate }}</div>
          <div *ngFor="let yg of yearGrids" class="year-block">
            <div class="year-label">{{ yg.year }}</div>
            <div class="months-grid">
              <div *ngFor="let m of yg.months" class="month-cell" [class.paid]="m.paid" [class.unpaid]="!m.paid">
                <span class="month-icon ms-icon">{{ m.paid ? 'check_circle' : 'cancel' }}</span>
                <span class="month-name">{{ m.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    .btn-back { background: #f5f5f5; border: none; border-radius: 8px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #555; flex-shrink: 0; }
    .btn-back:hover { background: #ebebeb; }
    .ms-icon { font-family: 'Material Symbols Outlined'; font-style: normal; font-weight: normal; font-variation-settings: 'FILL' 1, 'wght' 400; font-size: 18px; line-height: 1; display: inline-block; }
    .btn-outline { padding: 9px 18px; border-radius: 8px; border: 1px solid #2E7D32; background: #fff; color: #2E7D32; font-size: 13px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
    .layout { display: grid; grid-template-columns: 300px 1fr; gap: 20px; }
    @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }
    .info-card { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,.07); display: flex; flex-direction: column; gap: 18px; }
    .member-avatar { width: 56px; height: 56px; border-radius: 14px; background: #2D5A27; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700; }
    .info-rows { display: flex; flex-direction: column; gap: 0; }
    .info-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; padding: 10px 0; border-bottom: 1px solid #f5f5f5; }
    .info-row:last-child { border-bottom: none; }
    .info-key { color: #999; font-size: 12px; }
    .badge { padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; }
    .badge.success { background: #E8F5E9; color: #2E7D32; }
    .badge.secondary { background: #F5F5F5; color: #757575; }
    .badge.blue { background: #E3F2FD; color: #1565C0; }
    .badge.pink { background: #FCE4EC; color: #C2185B; }
    .amount-chip { background: #E8F5E9; color: #2E7D32; padding: 3px 10px; border-radius: 8px; font-weight: 700; }
    .totals-row { display: flex; gap: 8px; }
    .total-box { flex: 1; border-radius: 10px; padding: 10px 6px; text-align: center; }
    .total-box.green { background: #E8F5E9; } .total-box.blue { background: #E3F2FD; } .total-box.red { background: #FFEBEE; }
    .total-val { font-size: 18px; font-weight: 800; }
    .total-box.green .total-val { color: #2E7D32; } .total-box.blue .total-val { color: #1565C0; } .total-box.red .total-val { color: #C62828; }
    .total-lbl { font-size: 10px; color: #777; margin-top: 2px; line-height: 1.3; }
    .years-card { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,.07); }
    .card-title { margin: 0 0 20px; font-size: 15px; font-weight: 700; color: #212121; }
    .year-block { margin-bottom: 24px; }
    .year-label { font-size: 13px; font-weight: 700; color: #555; margin-bottom: 10px; padding: 3px 12px; background: #F5F5F5; border-radius: 6px; display: inline-block; }
    .months-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
    @media (max-width: 600px) { .months-grid { grid-template-columns: repeat(4, 1fr); } }
    .month-cell { border-radius: 10px; padding: 10px 4px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .month-cell.paid { background: #E8F5E9; } .month-cell.unpaid { background: #FFEBEE; }
    .month-icon { font-size: 18px; }
    .month-cell.paid .month-icon { color: #2E7D32; } .month-cell.unpaid .month-icon { color: #C62828; }
    .month-name { font-size: 11px; font-weight: 600; }
    .month-cell.paid .month-name { color: #2E7D32; } .month-cell.unpaid .month-name { color: #C62828; }
    .empty-cell { text-align: center; color: #BDBDBD; padding: 40px; }
    .loading-state { display: flex; justify-content: center; padding: 80px; }
    .spinner-lg { width: 40px; height: 40px; border: 4px solid #eee; border-top-color: #2E7D32; border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class MemberDetailComponent implements OnInit {
  member: Member | null = null;
  contributions: Contribution[] = [];
  loading = true;
  yearGrids: YearGrid[] = [];

  get totalPaid(): number { return this.contributions.reduce((s, c) => s + c.total_amount, 0); }
  get paidMonthsCount(): number { return this.contributions.reduce((s, c) => s + (c.months?.length || c.months_count), 0); }
  get unpaidMonthsCount(): number { return this.member?.unpaid_months?.length || 0; }

  constructor(private route: ActivatedRoute, private svc: MemberService) {}

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.svc.getById(id).subscribe({
      next: res => { this.member = res.data; this.loading = false; this.loadContributions(id); },
      error: () => { this.loading = false; }
    });
  }

  private loadContributions(id: number): void {
    this.svc.getMemberContributions(id).subscribe({
      next: res => { this.contributions = res.data; this.buildGrids(); }
    });
  }

  private buildGrids(): void {
    if (!this.member) return;
    const paidSet = new Set<string>();
    for (const c of this.contributions)
      for (const m of (c.months || []))
        paidSet.add(`${m.year}-${m.month}`);

    const joinDate  = new Date(this.member.join_date || this.member.created_at || '2026-01-01');
    const joinYear  = Math.max(joinDate.getFullYear(), 2026);
    const joinMonth = joinDate.getFullYear() >= 2026 ? joinDate.getMonth() + 1 : 1;
    const now = new Date();
    const grids: YearGrid[] = [];

    for (let year = now.getFullYear(); year >= joinYear; year--) {
      const start = year === joinYear ? joinMonth : 1;
      const end   = year === now.getFullYear() ? now.getMonth() + 1 : 12;
      const months = [];
      for (let m = start; m <= end; m++)
        months.push({ month: m, label: MONTH_FR[m - 1], paid: paidSet.has(`${year}-${m}`) });
      grids.push({ year, months });
    }
    this.yearGrids = grids;
  }
}
