import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DashboardService, DashboardStats, RevenueData } from '../../core/services/dashboard.service';
import { BankService } from '../../core/services/bank.service';
import { Bank } from '../../core/models/bank.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div class="dashboard">

      <!-- Page Title -->
      <div class="pg-header">
        <h1 class="pg-title">{{ 'DASHBOARD.TITLE' | translate }}</h1>
        <span class="pg-date">{{ today | date:'EEEE d MMMM yyyy' }}</span>
      </div>

      <!-- Stat Cards -->
      <div class="stats-row">

        <div class="stat-card" routerLink="/dashboard" (click)="toggleTreasury()" style="cursor:pointer">
          <div class="stat-icon" style="background:#2E7D32">
            <span class="ms-icon">account_balance_wallet</span>
          </div>
          <div class="stat-info">
            <div class="stat-num">{{ banksTotal | number:'1.0-0' }} <small>{{ 'COMMON.MRU' | translate }}</small></div>
            <div class="stat-lbl">{{ 'DASHBOARD.TREASURY' | translate }}</div>
            <div class="stat-sub" *ngIf="!showTreasury">
              <span class="ms-icon" style="font-size:13px">expand_more</span> {{ 'DASHBOARD.SHOW_DETAILS' | translate }}
            </div>
            <div class="stat-sub" *ngIf="showTreasury">
              <span class="ms-icon" style="font-size:13px">expand_less</span> {{ 'DASHBOARD.HIDE_DETAILS' | translate }}
            </div>
          </div>
        </div>

        <div class="stat-card" routerLink="/members">
          <div class="stat-icon" style="background:#1565C0">
            <span class="ms-icon">people</span>
          </div>
          <div class="stat-info">
            <div class="stat-num">{{ stats?.active_members || 0 }}</div>
            <div class="stat-lbl">{{ 'DASHBOARD.TOTAL_MEMBERS' | translate }}</div>
            <div class="stat-sub trend">+{{ stats?.total_members || 0 }} {{ 'DASHBOARD.TOTAL_LABEL' | translate }}</div>
          </div>
        </div>

        <div class="stat-card" routerLink="/orphans">
          <div class="stat-icon" style="background:#E64A19">
            <span class="ms-icon">child_care</span>
          </div>
          <div class="stat-info">
            <div class="stat-num">{{ stats?.active_orphans || 0 }}</div>
            <div class="stat-lbl">{{ 'DASHBOARD.ACTIVE_ORPHANS' | translate }}</div>
            <div class="stat-sub warn" *ngIf="stats?.near_18_orphans">
              ⚠ {{ stats?.near_18_orphans }} {{ 'DASHBOARD.NEAR_18_ALERT_SHORT' | translate }}
            </div>
            <div class="stat-sub trend" *ngIf="!stats?.near_18_orphans">
              {{ stats?.total_orphans || 0 }} {{ 'DASHBOARD.TOTAL_LABEL' | translate }}
            </div>
          </div>
        </div>

        <div class="stat-card" routerLink="/families">
          <div class="stat-icon" style="background:#6A1B9A">
            <span class="ms-icon">family_restroom</span>
          </div>
          <div class="stat-info">
            <div class="stat-num">{{ stats?.active_families || 0 }}</div>
            <div class="stat-lbl">{{ 'DASHBOARD.FAMILIES' | translate }}</div>
            <div class="stat-sub trend">{{ stats?.total_families || 0 }} {{ 'DASHBOARD.TOTAL_LABEL' | translate }}</div>
          </div>
        </div>


      </div>

      <!-- Treasury breakdown (inline, no dropdown) -->
      <div class="treasury-panel" *ngIf="showTreasury && banks.length > 0">
        <div class="tp-title">{{ 'DASHBOARD.TREASURY_BREAKDOWN' | translate }}</div>

        <!-- Bank balance cards -->
        <div class="bank-cards-grid">
          <div class="bank-bal-card" *ngFor="let b of banks; let i = index" [style.borderLeftColor]="bankColor(i)">
            <div class="bbc-logo">
              <img *ngIf="b.logo" [src]="'assets/images/' + b.logo" [alt]="b.name_fr" class="bbc-img">
              <span *ngIf="!b.logo" class="bbc-emoji">💵</span>
            </div>
            <div class="bbc-info">
              <span class="bbc-name">{{ lang === 'ar' ? b.name_ar : b.name_fr }}</span>
              <span class="bbc-name-ar">{{ lang === 'ar' ? b.name_fr : b.name_ar }}</span>
              <span class="bbc-balance" [style.color]="bankColor(i)">{{ b.balance | number:'1.0-0' }}<small> {{ 'COMMON.MRU' | translate }}</small></span>
            </div>
            <div class="bbc-status" [class.active]="b.is_active" [class.inactive]="!b.is_active"></div>
          </div>
        </div>

      </div>

      <!-- Charts Row -->
      <div class="charts-row">

        <!-- Bar Chart -->
        <div class="chart-card">
          <div class="chart-head">
            <h3 class="chart-title">{{ 'DASHBOARD.REVENUE_CHART' | translate }}</h3>
            <div class="chart-legend">
              <span class="leg-dot" style="background:#2E7D32"></span>
              {{ 'DASHBOARD.CONTRIBUTIONS_LABEL' | translate }}
              <span class="leg-dot" style="background:#1565C0; margin-left:12px"></span>
              {{ 'DASHBOARD.DONATIONS_LABEL' | translate }}
            </div>
          </div>

          <div class="bar-chart" *ngIf="revenueData.length > 0">
            <!-- Y axis + grid -->
            <div class="y-axis">
              <span *ngFor="let t of yTicks" class="y-tick">{{ formatYLabel(t) }}</span>
            </div>
            <div class="chart-body">
              <div class="grid-lines">
                <div class="grid-line" *ngFor="let t of yTicks"></div>
              </div>
              <div class="bars-wrap">
                <div class="bar-group" *ngFor="let r of revenueData">
                  <div class="bar-pair">
                    <div class="bar c-bar" [style.height.%]="pctH(r.contributions)"
                         [title]="r.contributions + ' ' + mruLabel"></div>
                    <div class="bar d-bar" [style.height.%]="pctH(r.donations)"
                         [title]="r.donations + ' ' + mruLabel"></div>
                  </div>
                  <div class="bar-label">{{ r.month }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="no-data-state" *ngIf="revenueData.length === 0">
            <span class="ms-icon" style="font-size:40px;color:#E0E0E0">bar_chart</span>
            <p>{{ 'COMMON.NO_DATA' | translate }}</p>
          </div>
        </div>

        <!-- Donut Chart (Treasury) -->
        <div class="chart-card">
          <div class="chart-head">
            <h3 class="chart-title">{{ 'DASHBOARD.TREASURY_BREAKDOWN' | translate }}</h3>
          </div>

          <div class="donut-wrap" *ngIf="banksTotal > 0">
            <svg viewBox="0 0 200 200" width="180" height="180" class="donut-svg">
              <circle cx="100" cy="100" r="70" fill="none" stroke="#F5F5F5" stroke-width="30"/>
              <circle *ngFor="let seg of donutSegments"
                      cx="100" cy="100" r="70"
                      fill="none"
                      [attr.stroke]="seg.color"
                      stroke-width="30"
                      [attr.stroke-dasharray]="seg.dash + ' ' + (440 - seg.dash)"
                      [attr.stroke-dashoffset]="seg.offset"
                      transform="rotate(-90 100 100)"/>
              <text x="100" y="96" text-anchor="middle" font-size="14" font-weight="700" fill="#212121">
                {{ (banksTotal | number:'1.0-0') }}
              </text>
              <text x="100" y="114" text-anchor="middle" font-size="10" fill="#9E9E9E">{{ 'COMMON.MRU' | translate }}</text>
            </svg>
            <div class="donut-legend">
              <div class="donut-leg-item" *ngFor="let m of methods">
                <span class="leg-dot" [style.background]="m.color"></span>
                <span class="donut-leg-lbl">{{ m.label }}</span>
                <span class="donut-leg-val">{{ getPercent(m.value) }}%</span>
              </div>
            </div>
          </div>

          <div class="no-data-state" *ngIf="banksTotal === 0">
            <span class="ms-icon" style="font-size:40px;color:#E0E0E0">donut_large</span>
            <p>{{ 'COMMON.NO_DATA' | translate }}</p>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .dashboard { padding: 0; }

    /* Page header */
    .pg-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .pg-title  { margin: 0; font-size: 22px; font-weight: 700; color: #212121; }
    .pg-date   { font-size: 13px; color: #9E9E9E; }

    /* Material Symbols */
    .ms-icon {
      font-family: 'Material Symbols Outlined';
      font-style: normal; font-weight: normal;
      font-variation-settings: 'FILL' 1, 'wght' 400;
      display: inline-block; line-height: 1;
    }

    /* Stat Cards */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      margin-bottom: 14px;
    }
    @media (max-width: 1100px) { .stats-row { grid-template-columns: repeat(2,1fr); } }
    @media (max-width: 680px)  { .stats-row { grid-template-columns: repeat(2,1fr); } }

    .stat-card {
      background: #fff;
      border-radius: 10px;
      padding: 16px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.09);
      display: flex;
      align-items: flex-start;
      gap: 14px;
      text-decoration: none;
      color: inherit;
      transition: box-shadow 0.15s;
      cursor: pointer;
    }
    .stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.13); }

    .stat-icon {
      width: 46px; height: 46px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .stat-icon .ms-icon { font-size: 24px; color: #fff; }

    .stat-info { flex: 1; min-width: 0; }
    .stat-num  {
      font-size: 22px; font-weight: 700; color: #212121;
      line-height: 1.2; display: flex; align-items: baseline; gap: 3px;
    }
    .stat-num small { font-size: 12px; font-weight: 400; color: #9E9E9E; }
    .stat-lbl  { font-size: 12px; color: #757575; margin-top: 2px; }
    .stat-sub  { font-size: 11px; color: #9E9E9E; margin-top: 3px; display: flex; align-items: center; gap: 3px; }
    .stat-sub.trend { color: #2E7D32; }
    .stat-sub.warn  { color: #E64A19; }

    /* Bank balance cards */
    .bank-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
    }
    .bank-bal-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px 22px;
      background: #F9FBF9;
      border-radius: 14px;
      border: 1px solid #E8F5E9;
      position: relative;
      overflow: hidden;
    }
    .bank-bal-card::before {
      content: '';
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 4px;
      background: #2E7D32;
      border-radius: 4px 0 0 4px;
    }
    .bbc-logo {
      width: 56px; height: 56px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.10);
    }
    .bbc-img   { width: 44px; height: 44px; object-fit: contain; border-radius: 8px; }
    .bbc-emoji { font-size: 30px; }
    .bbc-info  { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .bbc-name  { font-size: 15px; font-weight: 700; color: #212121; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .bbc-name-ar { font-size: 12px; color: #9E9E9E; direction: rtl; }
    .bbc-balance { font-size: 20px; font-weight: 700; color: #1565C0; margin-top: 4px; }
    .bbc-balance small { font-size: 12px; font-weight: 400; color: #9E9E9E; }
    .bbc-status { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; align-self: flex-start; margin-top: 4px; }
    .bbc-status.active   { background: #4CAF50; }
    .bbc-status.inactive { background: #BDBDBD; }

    /* Treasury panel */
    .treasury-panel {
      background: #fff;
      border-radius: 10px;
      padding: 18px 20px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.09);
      margin-bottom: 14px;
      animation: fadeUp 0.2s ease;
    }
    .tp-title { font-size: 13px; font-weight: 600; color: #424242; margin-bottom: 16px; }

    /* Charts row */
    .charts-row {
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: 14px;
    }
    @media (max-width: 900px) { .charts-row { grid-template-columns: 1fr; } }

    .chart-card {
      background: #fff;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.09);
    }
    .chart-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
    .chart-title { margin: 0; font-size: 14px; font-weight: 600; color: #212121; }
    .chart-legend { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #757575; }
    .leg-dot { display: inline-block; width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }

    /* Bar chart */
    .bar-chart { display: flex; gap: 8px; height: 200px; }
    .y-axis {
      display: flex;
      flex-direction: column-reverse;
      justify-content: space-between;
      padding-bottom: 22px;
      min-width: 52px;
    }
    .y-tick { font-size: 10px; color: #BDBDBD; text-align: right; }
    .chart-body { flex: 1; position: relative; }
    .grid-lines {
      position: absolute; inset: 0;
      display: flex; flex-direction: column; justify-content: space-between;
      pointer-events: none;
      padding-bottom: 22px;
    }
    .grid-line {
      border-top: 1px dashed #F0F0F0;
    }
    .bars-wrap {
      position: absolute; inset: 0;
      display: flex; align-items: flex-end;
      gap: 4px;
      padding-bottom: 22px;
    }
    .bar-group { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; }
    .bar-pair  { flex: 1; width: 100%; display: flex; align-items: flex-end; gap: 2px; }
    .bar       { flex: 1; border-radius: 3px 3px 0 0; min-height: 2px; transition: height 0.5s ease; }
    .c-bar     { background: #2E7D32; }
    .d-bar     { background: #1565C0; }
    .bar-label { font-size: 10px; color: #BDBDBD; white-space: nowrap; }

    /* Donut */
    .donut-wrap  { display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .donut-svg   { overflow: visible; }
    .donut-legend { display: flex; flex-direction: column; gap: 8px; width: 100%; }
    .donut-leg-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
    .donut-leg-lbl  { flex: 1; color: #424242; }
    .donut-leg-val  { font-weight: 600; color: #212121; font-size: 12px; }

    .no-data-state { text-align: center; padding: 40px 0; color: #BDBDBD; }
    .no-data-state p { margin: 8px 0 0; font-size: 13px; }

    @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  `]
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  revenueData: RevenueData[] = [];
  banks: Bank[] = [];
  showTreasury = false;
  maxRevenue = 1;
  yTicks: number[] = [];
  today = new Date();

  private readonly BANK_COLORS = ['#2E7D32', '#1565C0', '#E64A19', '#6A1B9A', '#F57C00', '#00838F', '#C2185B'];

  get banksTotal(): number {
    return this.banks.reduce((sum, b) => sum + b.balance, 0);
  }

  get methods() {
    const lang = this.translate.currentLang || 'fr';
    return this.banks
      .filter(b => b.balance > 0)
      .map((b, i) => ({
        label: lang === 'ar' ? b.name_ar : b.name_fr,
        value: b.balance,
        color: this.BANK_COLORS[i % this.BANK_COLORS.length]
      }));
  }

  get donutSegments() {
    if (this.banksTotal === 0) return [];
    const C = 440;
    let offset = 0;
    return this.methods.map(m => {
      const dash = (m.value / this.banksTotal) * C;
      const seg = { color: m.color, dash, offset: -offset };
      offset += dash;
      return seg;
    });
  }

  get mruLabel(): string { return this.translate.instant('COMMON.MRU'); }
  get lang(): string { return this.translate.currentLang || 'fr'; }
  bankColor(i: number): string { return this.BANK_COLORS[i % this.BANK_COLORS.length]; }

  constructor(private svc: DashboardService, private bankService: BankService, private translate: TranslateService) {}

  ngOnInit(): void {
    this.svc.getStats().subscribe({ next: r => { this.stats = r.data; } });
    this.svc.getRevenueChart().subscribe({
      next: r => {
        this.revenueData = r.data;
        this.maxRevenue = Math.max(...r.data.map(d => Math.max(d.contributions, d.donations)), 1);
        this.buildYTicks();
      }
    });
    this.bankService.getAll().subscribe({ next: r => { this.banks = r.data.filter(b => b.is_active); } });
  }

  toggleTreasury(): void { this.showTreasury = !this.showTreasury; }

  private buildYTicks(): void {
    const step = this.niceStep(this.maxRevenue / 5);
    this.yTicks = [];
    for (let v = 0; v <= this.maxRevenue + step; v += step) {
      this.yTicks.push(v);
    }
  }

  private niceStep(raw: number): number {
    const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
    const f = raw / magnitude;
    if (f < 1.5) return magnitude;
    if (f < 3)   return 2 * magnitude;
    if (f < 7)   return 5 * magnitude;
    return 10 * magnitude;
  }

  formatYLabel(v: number): string {
    if (v >= 1000) return (v / 1000).toFixed(0) + 'k';
    return v.toString();
  }

  pctH(value: number): number {
    const maxTick = this.yTicks[this.yTicks.length - 1] || this.maxRevenue;
    return Math.max((value / maxTick) * 100, 0);
  }

  getPercent(value: number): number {
    if (!this.banksTotal) return 0;
    return Math.round((value / this.banksTotal) * 100);
  }
}
