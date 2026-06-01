import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SearchService, SearchResult } from '../../core/services/search.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, PageHeaderComponent],
  template: `
    <app-page-header [title]="'SEARCH.TITLE' | translate"></app-page-header>

    <!-- Search bar -->
    <div class="search-bar-wrap">
      <span class="search-icon">search</span>
      <input
        class="search-input"
        type="text"
        [(ngModel)]="query"
        (ngModelChange)="onQuery($event)"
        [placeholder]="'SEARCH.PLACEHOLDER' | translate"
        autocomplete="off">
      <button *ngIf="query" class="clear-btn" (click)="clear()">close</button>
    </div>

    <!-- Loading -->
    <div *ngIf="loading" class="loading-state"><div class="spinner"></div></div>

    <!-- Empty state -->
    <div *ngIf="!loading && searched && totalCount === 0" class="empty-state">
      <span class="empty-icon">search_off</span>
      <p>{{ 'SEARCH.NO_RESULTS' | translate }}</p>
    </div>

    <!-- Results -->
    <div *ngIf="!loading && result" class="results-wrap">

      <!-- Guardians -->
      <div *ngIf="result.guardians.length" class="section">
        <div class="section-header guardian-color">
          <span class="mat-icon">supervisor_account</span>
          {{ 'MENU.GUARDIANS' | translate }} ({{ result.guardians.length }})
        </div>
        <div *ngFor="let p of result.guardians" class="person-card">
          <div class="person-header">
            <div class="avatar guardian-av">{{ p.name.charAt(0) }}</div>
            <div class="person-info">
              <a [routerLink]="['/guardians', p.id]" class="person-name">{{ p.name }}</a>
              <span *ngIf="p.father_name" class="person-sub">{{ 'ORPHANS.FATHER_NAME' | translate }}: {{ p.father_name }}</span>
              <span *ngIf="p.phone" class="person-phone">📞 {{ p.phone }}</span>
            </div>
            <span class="badge" [class]="p.is_active ? 'success' : 'secondary'">
              {{ (p.is_active ? 'COMMON.ACTIVE' : 'COMMON.INACTIVE') | translate }}
            </span>
          </div>
          <ng-container *ngTemplateOutlet="benefitsBlock; context: { $implicit: p }"></ng-container>
        </div>
      </div>

      <!-- Orphans -->
      <div *ngIf="result.orphans.length" class="section">
        <div class="section-header orphan-color">
          <span class="mat-icon">child_care</span>
          {{ 'MENU.ORPHANS' | translate }} ({{ result.orphans.length }})
        </div>
        <div *ngFor="let p of result.orphans" class="person-card">
          <div class="person-header">
            <div class="avatar" [class]="p.gender === 'male' ? 'male-av' : 'female-av'">{{ p.name.charAt(0) }}</div>
            <div class="person-info">
              <a [routerLink]="['/orphans', p.id]" class="person-name">{{ p.name }}</a>
              <span *ngIf="p.guardian_name" class="person-sub">{{ 'ORPHANS.GUARDIAN' | translate }}: {{ p.guardian_name }}</span>
              <span class="person-phone">{{ p.age }} {{ 'COMMON.YEARS' | translate }}</span>
            </div>
            <span class="badge" [class]="p.is_active ? 'success' : 'secondary'">
              {{ (p.is_active ? 'ORPHANS.STATUS_ACTIVE' : 'ORPHANS.STATUS_INACTIVE') | translate }}
            </span>
          </div>
          <ng-container *ngTemplateOutlet="benefitsBlock; context: { $implicit: p }"></ng-container>
        </div>
      </div>

      <!-- Members -->
      <div *ngIf="result.members.length" class="section">
        <div class="section-header member-color">
          <span class="mat-icon">people</span>
          {{ 'MENU.MEMBERS' | translate }} ({{ result.members.length }})
        </div>
        <div *ngFor="let p of result.members" class="person-card">
          <div class="person-header">
            <div class="avatar member-av">{{ p.name.charAt(0) }}</div>
            <div class="person-info">
              <a [routerLink]="['/members', p.id]" class="person-name">{{ p.name }}</a>
              <span *ngIf="p.phone" class="person-phone">📞 {{ p.phone }}</span>
            </div>
            <span class="badge" [class]="p.is_active ? 'success' : 'secondary'">
              {{ (p.is_active ? 'COMMON.ACTIVE' : 'COMMON.INACTIVE') | translate }}
            </span>
          </div>
          <!-- Contributions -->
          <div *ngIf="p.contributions?.length" class="tx-section">
            <div class="tx-label given-color">⬆ {{ 'SEARCH.GIVEN_TO_US' | translate }}</div>
            <div *ngFor="let c of p.contributions" class="tx-row">
              <span class="tx-type">{{ 'MENU.CONTRIBUTIONS' | translate }}</span>
              <span class="tx-date">{{ c.paid_at | date:'dd/MM/yyyy' }}</span>
              <span class="tx-amount given-color">+{{ c.total_amount | number:'1.0-0' }} {{ 'COMMON.MRU' | translate }}</span>
            </div>
          </div>
          <!-- Donations -->
          <div *ngIf="p.donations?.length" class="tx-section">
            <div class="tx-label given-color">⬆ {{ 'SEARCH.DONATIONS_GIVEN' | translate }}</div>
            <div *ngFor="let d of p.donations" class="tx-row">
              <span class="tx-type">{{ 'MENU.DONATIONS' | translate }}</span>
              <span class="tx-date">{{ d.donated_at | date:'dd/MM/yyyy' }}</span>
              <span class="tx-amount given-color">+{{ d.amount | number:'1.0-0' }} {{ 'COMMON.MRU' | translate }}</span>
            </div>
          </div>
          <ng-container *ngTemplateOutlet="benefitsBlock; context: { $implicit: p }"></ng-container>
        </div>
      </div>

      <!-- Donors -->
      <div *ngIf="result.donors.length" class="section">
        <div class="section-header donor-color">
          <span class="mat-icon">volunteer_activism</span>
          {{ 'MENU.DONORS' | translate }} ({{ result.donors.length }})
        </div>
        <div *ngFor="let p of result.donors" class="person-card">
          <div class="person-header">
            <div class="avatar donor-av">{{ p.name.charAt(0) }}</div>
            <div class="person-info">
              <a [routerLink]="['/donors', p.id]" class="person-name">{{ p.name }}</a>
              <span *ngIf="p.phone" class="person-phone">📞 {{ p.phone }}</span>
            </div>
          </div>
          <div *ngIf="p.donations?.length" class="tx-section">
            <div class="tx-label given-color">⬆ {{ 'SEARCH.DONATIONS_GIVEN' | translate }}</div>
            <div *ngFor="let d of p.donations" class="tx-row">
              <span class="tx-type">{{ 'MENU.DONATIONS' | translate }}</span>
              <span class="tx-date">{{ d.donated_at | date:'dd/MM/yyyy' }}</span>
              <span class="tx-amount given-color">+{{ d.amount | number:'1.0-0' }} {{ 'COMMON.MRU' | translate }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Families -->
      <div *ngIf="result.families.length" class="section">
        <div class="section-header family-color">
          <span class="mat-icon">family_restroom</span>
          {{ 'MENU.FAMILIES' | translate }} ({{ result.families.length }})
        </div>
        <div *ngFor="let p of result.families" class="person-card">
          <div class="person-header">
            <div class="avatar family-av">{{ p.name.charAt(0) }}</div>
            <div class="person-info">
              <a [routerLink]="['/families', p.id]" class="person-name">{{ p.name }}</a>
              <span *ngIf="p.head_of_family && p.head_of_family !== p.name" class="person-sub">{{ p.head_of_family }}</span>
              <span *ngIf="p.phone" class="person-phone">📞 {{ p.phone }}</span>
            </div>
            <span class="badge" [class]="p.is_active ? 'success' : 'secondary'">
              {{ (p.is_active ? 'COMMON.ACTIVE' : 'COMMON.INACTIVE') | translate }}
            </span>
          </div>
          <ng-container *ngTemplateOutlet="benefitsBlock; context: { $implicit: p }"></ng-container>
        </div>
      </div>

    </div>

    <!-- Shared template: activity benefits (received from us) -->
    <ng-template #benefitsBlock let-p>
      <div *ngIf="p.activity_benefits?.length" class="tx-section">
        <div class="tx-label received-color">⬇ {{ 'SEARCH.RECEIVED_FROM_US' | translate }}</div>
        <div *ngFor="let b of p.activity_benefits" class="tx-row activity-row"
             (click)="goToActivity(b.activity_id)" style="cursor:pointer">
          <span class="activity-dot" [style.background]="activityColor(b.activity_type)"></span>
          <span class="tx-type">{{ b.activity_title }}</span>
          <span class="tx-date">{{ b.activity_date | date:'dd/MM/yyyy' }}</span>
          <span *ngIf="b.payment_type === 'financial' && (b.value_received || b.total_received)"
                class="tx-amount received-color">
            {{ (b.total_received ?? b.value_received) | number:'1.0-0' }} {{ 'COMMON.MRU' | translate }}
          </span>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    .search-bar-wrap {
      display: flex; align-items: center; gap: 10px;
      background: #fff; border-radius: 12px; padding: 10px 16px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.08); margin-bottom: 24px;
    }
    .search-icon { font-family: 'Material Symbols Outlined'; font-size: 22px; color: #aaa; }
    .search-input {
      flex: 1; border: none; outline: none; font-size: 15px;
      font-family: 'Cairo', Arial, sans-serif; background: transparent;
    }
    .clear-btn {
      font-family: 'Material Symbols Outlined'; font-size: 20px; color: #aaa;
      border: none; background: none; cursor: pointer; padding: 0; line-height: 1;
    }
    .loading-state { display: flex; justify-content: center; padding: 40px; }
    .spinner { width: 32px; height: 32px; border: 3px solid #eee; border-top-color: #2E7D32; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { text-align: center; color: #aaa; padding: 48px 20px; }
    .empty-icon { font-family: 'Material Symbols Outlined'; font-size: 48px; display: block; margin-bottom: 12px; }
    .results-wrap { display: flex; flex-direction: column; gap: 20px; }
    .section { background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.07); }
    .section-header {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 16px; font-size: 14px; font-weight: 700;
    }
    .mat-icon { font-family: 'Material Symbols Outlined'; font-size: 18px; }
    .guardian-color { background: #E8F5E9; color: #2E7D32; }
    .orphan-color   { background: #FFF3E0; color: #E64A19; }
    .member-color   { background: #E3F2FD; color: #1565C0; }
    .donor-color    { background: #F3E5F5; color: #6A1B9A; }
    .family-color   { background: #E0F2F1; color: #00695C; }
    .person-card { padding: 12px 16px; border-bottom: 1px solid #f5f5f5; }
    .person-card:last-child { border-bottom: none; }
    .person-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
    .avatar {
      width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 15px; color: #fff;
    }
    .guardian-av { background: linear-gradient(135deg, #2E7D32, #66BB6A); }
    .male-av     { background: linear-gradient(135deg, #1565C0, #42A5F5); }
    .female-av   { background: linear-gradient(135deg, #AD1457, #F06292); }
    .member-av   { background: linear-gradient(135deg, #1565C0, #64B5F6); }
    .donor-av    { background: linear-gradient(135deg, #6A1B9A, #CE93D8); }
    .family-av   { background: linear-gradient(135deg, #00695C, #4DB6AC); }
    .person-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .person-name { font-weight: 700; font-size: 14px; color: #1565C0; text-decoration: none; }
    .person-name:hover { text-decoration: underline; }
    .person-sub  { font-size: 12px; color: #777; }
    .person-phone { font-size: 12px; color: #555; }
    .badge { padding: 3px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .badge.success   { background: #E8F5E9; color: #2E7D32; }
    .badge.secondary { background: #eee; color: #666; }
    .tx-section { margin-top: 8px; border-radius: 8px; overflow: hidden; }
    .tx-label {
      font-size: 11px; font-weight: 700; padding: 4px 10px;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .given-color    { background: #E8F5E9; color: #2E7D32; }
    .received-color { background: #E3F2FD; color: #1565C0; }
    .tx-row {
      display: flex; align-items: center; gap: 8px;
      padding: 5px 10px; font-size: 12px;
      border-bottom: 1px solid #f5f5f5; background: #fafafa;
    }
    .tx-row:last-child { border-bottom: none; }
    .activity-row:hover { background: #f0f4ff; }
    .activity-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .tx-type { flex: 1; color: #333; font-weight: 500; }
    .tx-date { color: #999; font-size: 11px; white-space: nowrap; }
    .tx-amount { font-weight: 700; white-space: nowrap; }
  `]
})
export class SearchComponent implements OnInit, OnDestroy {
  query = '';
  loading = false;
  searched = false;
  result: SearchResult | null = null;

  private query$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  private activityColors: Record<string, string> = {
    school_fees:   '#1565C0',
    eid_help:      '#F57F17',
    food_basket:   '#2E7D32',
    winter_clothes:'#6A1B9A',
    ramadan:       '#E64A19',
    other:         '#757575',
  };

  constructor(private searchService: SearchService) {}

  ngOnInit(): void {
    this.query$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(q => {
        if (q.length < 2) {
          this.result = null; this.searched = false; this.loading = false;
          return of(null);
        }
        this.loading = true;
        return this.searchService.search(q);
      }),
      takeUntil(this.destroy$),
    ).subscribe({
      next: res => {
        this.loading = false;
        this.searched = true;
        this.result = res?.data ?? null;
      },
      error: () => { this.loading = false; }
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  onQuery(val: string): void { this.query$.next(val); }

  clear(): void { this.query = ''; this.result = null; this.searched = false; }

  get totalCount(): number {
    if (!this.result) return 0;
    return this.result.guardians.length + this.result.orphans.length +
           this.result.members.length + this.result.donors.length +
           this.result.families.length;
  }

  activityColor(type: string): string { return this.activityColors[type] ?? '#757575'; }

  goToActivity(id: number): void {
    window.location.href = `/activities/${id}`;
  }
}
