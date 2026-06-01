import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { GuardianService, Guardian } from '../../../core/services/guardian.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { Orphan } from '../../../core/models/orphan.model';

@Component({
  selector: 'app-guardian-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, PageHeaderComponent],
  template: `
    <app-page-header [title]="guardian?.name || ('MENU.GUARDIANS' | translate)" backLink="/guardians">
      <button [routerLink]="addOrphanLink" class="btn-add-orphan" *ngIf="guardian">
        {{ 'GUARDIANS.ADD_CHILD_BTN' | translate }}
      </button>
    </app-page-header>

    <div class="detail-container" *ngIf="guardian">

      <div class="info-card">
        <div class="card-top">
          <div class="avatar">{{ guardian.name.charAt(0) }}</div>
          <div class="card-identity">
            <h2>{{ guardian.name }}</h2>
            <p class="father" *ngIf="guardian.father_name">
              <span class="label-small">{{ 'ORPHANS.FATHER_NAME' | translate }} :</span> <strong>{{ guardian.father_name }}</strong>
            </p>
            <span [class.badge-active]="guardian.is_active" [class.badge-inactive]="!guardian.is_active" class="status-badge">
              {{ (guardian.is_active ? 'COMMON.ACTIVE' : 'COMMON.INACTIVE') | translate }}
            </span>
          </div>
          <div class="card-actions">
            <button [routerLink]="['/guardians', guardian.id, 'edit']" [queryParams]="{returnUrl: '/guardians/' + guardian.id}" class="btn btn-edit">✏️ {{ 'COMMON.EDIT' | translate }}</button>
            <button (click)="askDelete()" class="btn btn-danger">🗑️ {{ 'COMMON.DELETE' | translate }}</button>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <label>{{ 'COMMON.PHONE' | translate }}</label>
            <div class="value phone-row">
              <span>{{ guardian.phone }}</span>
              <button class="copy-btn" (click)="copy(guardian.phone)">📋</button>
            </div>
          </div>
          <div class="info-item" *ngIf="guardian.whatsapp">
            <label>WhatsApp</label>
            <div class="value phone-row">
              <span>📱 {{ guardian.whatsapp }}</span>
              <button class="copy-btn" (click)="copy(guardian.whatsapp!)">📋</button>
            </div>
          </div>
          <div class="info-item" *ngIf="guardian.address">
            <label>{{ 'MEMBERS.ADDRESS' | translate }}</label>
            <div class="value">{{ guardian.address }}</div>
          </div>
          <div class="info-item" *ngIf="guardian.notes">
            <label>{{ 'COMMON.NOTES' | translate }}</label>
            <div class="value">{{ guardian.notes }}</div>
          </div>
        </div>
      </div>

      <div class="orphans-card">
        <div class="section-header">
          <h3>{{ 'GUARDIANS.CHILDREN' | translate }} ({{ orphans.length }})</h3>
          <a [routerLink]="addOrphanLink" class="btn-add-orphan">{{ 'GUARDIANS.ADD_CHILD_BTN' | translate }}</a>
        </div>

        <div *ngIf="orphans.length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <p>{{ 'ORPHANS.NO_CHILDREN' | translate }}</p>
          <a [routerLink]="addOrphanLink" class="btn-add-orphan big">{{ 'GUARDIANS.ADD_FIRST_CHILD_BTN' | translate }}</a>
        </div>

        <table *ngIf="orphans.length > 0" class="orphans-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{{ 'ORPHANS.FULL_NAME'  | translate }}</th>
              <th>{{ 'ORPHANS.GENDER'     | translate }}</th>
              <th>{{ 'ORPHANS.BIRTH_YEAR' | translate }}</th>
              <th>{{ 'ORPHANS.AGE'        | translate }}</th>
              <th>{{ 'ORPHANS.SCHOOL'     | translate }}</th>
              <th>{{ 'ORPHANS.GRADE'      | translate }}</th>
              <th>{{ 'COMMON.STATUS'      | translate }}</th>
              <th>{{ 'COMMON.ACTIONS'     | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let o of orphans; let i = index" [class.row-inactive]="!o.is_active">
              <td class="td-num">{{ i + 1 }}</td>
              <td class="td-name">{{ o.display_name }}</td>
              <td>
                <span class="gender-badge" [class.male]="o.gender === 'male'" [class.female]="o.gender === 'female'">
                  {{ (o.gender === 'male' ? 'ORPHANS.MALE' : 'ORPHANS.FEMALE') | translate }}
                </span>
              </td>
              <td class="td-year">{{ o.birth_year }}</td>
              <td>
                <span [class.near-18]="!o.is_adult && (o.months_until_18 ?? 99) <= 6">
                  {{ o.age }} {{ 'COMMON.YEARS' | translate }}
                </span>
                <span class="adult-tag" *ngIf="o.is_adult">18+</span>
              </td>
              <td>{{ o.school_name || '—' }}</td>
              <td>{{ o.grade || '—' }}</td>
              <td>
                <span class="dot" [class.dot-active]="o.is_active" [class.dot-inactive]="!o.is_active"></span>
                {{ (o.is_active ? 'ORPHANS.STATUS_ACTIVE' : 'ORPHANS.STATUS_INACTIVE') | translate }}
              </td>
              <td class="td-actions">
                <button [routerLink]="['/orphans', o.id]" class="btn-icon">👁️</button>
                <button [routerLink]="['/orphans', o.id, 'edit']" class="btn-icon">✏️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal suppression -->
    <div class="modal-overlay" *ngIf="showDeleteModal" (click)="showDeleteModal = false">
      <div class="modal-box" (click)="$event.stopPropagation()">
        <div class="modal-icon">⚠️</div>
        <h3>{{ 'COMMON.CONFIRM_DELETE' | translate }}</h3>
        <p *ngIf="orphans.length > 0">{{ 'GUARDIANS.DELETE_WITH_CHILDREN' | translate:{count: orphans.length} }}</p>
        <p *ngIf="orphans.length === 0">{{ 'GUARDIANS.DELETE_SIMPLE' | translate }}</p>
        <div class="modal-actions">
          <button class="btn-cancel" (click)="showDeleteModal = false">{{ 'COMMON.CANCEL' | translate }}</button>
          <button class="btn-delete" (click)="confirmDelete()">{{ 'COMMON.DELETE' | translate }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .btn-add-orphan { background: #2E7D32; color: #fff; padding: 9px 18px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; border: none; cursor: pointer; display: inline-block; }
    .btn-add-orphan:hover { background: #1B5E20; }
    .btn-add-orphan.big { padding: 12px 24px; font-size: 14px; margin-top: 16px; }

    .detail-container { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
    .info-card, .orphans-card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }

    .card-top { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    .avatar { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #2E7D32, #66BB6A); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700; flex-shrink: 0; }
    .card-identity { flex: 1; }
    .card-identity h2 { margin: 0 0 6px; font-size: 22px; color: #1a1a2e; }
    .father { margin: 4px 0; font-size: 13px; color: #555; }
    .label-small { color: #999; font-size: 12px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 10px; font-size: 12px; font-weight: 600; margin-top: 6px; }
    .badge-active   { background: #E8F5E9; color: #2E7D32; }
    .badge-inactive { background: #FFEBEE; color: #C62828; }
    .card-actions { display: flex; gap: 10px; flex-shrink: 0; }
    .btn { padding: 9px 18px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; }
    .btn-edit   { background: #E8F5E9; color: #2E7D32; }
    .btn-danger { background: #FFEBEE; color: #C62828; }
    .btn-edit:hover   { background: #C8E6C9; }
    .btn-danger:hover { background: #FFCDD2; }

    .info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
    .info-item label { display: block; font-size: 11px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .info-item .value { font-size: 14px; color: #333; }
    .phone-row { display: flex; align-items: center; gap: 8px; }
    .copy-btn { background: none; border: none; cursor: pointer; font-size: 14px; opacity: 0.5; }
    .copy-btn:hover { opacity: 1; }

    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .section-header h3 { margin: 0; font-size: 16px; color: #333; font-weight: 700; }
    .empty-state { text-align: center; padding: 40px 20px; color: #bbb; }
    .empty-icon { font-size: 40px; margin-bottom: 10px; }

    .orphans-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .orphans-table th { padding: 10px 12px; text-align: left; color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #f0f0f0; }
    .orphans-table td { padding: 12px; border-bottom: 1px solid #f5f5f5; }
    .orphans-table tr:last-child td { border-bottom: none; }
    .orphans-table tr.row-inactive td { color: #bbb; }
    .td-num { color: #bbb; width: 30px; }
    .td-name { font-weight: 600; color: #1a1a2e; }
    .td-year { font-family: monospace; }
    .gender-badge { padding: 3px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .gender-badge.male   { background: #E3F2FD; color: #1565C0; }
    .gender-badge.female { background: #FCE4EC; color: #AD1457; }
    .near-18 { color: #E65100; font-weight: 700; }
    .adult-tag { background: #FFEBEE; color: #C62828; border-radius: 6px; padding: 2px 6px; font-size: 10px; font-weight: 700; margin-left: 4px; }
    .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; }
    .dot-active { background: #4CAF50; }
    .dot-inactive { background: #F44336; }
    .td-actions { display: flex; gap: 6px; }
    .btn-icon { width: 28px; height: 28px; border: 1px solid #eee; background: #fff; border-radius: 6px; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; }
    .btn-icon:hover { background: #f5f5f5; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-box { background: #fff; border-radius: 16px; padding: 32px 28px; max-width: 380px; width: 90%; text-align: center; box-shadow: 0 8px 40px rgba(0,0,0,0.2); }
    .modal-icon { font-size: 40px; margin-bottom: 12px; }
    .modal-box h3 { margin: 0 0 10px; font-size: 17px; color: #333; }
    .modal-box p { margin: 0 0 24px; font-size: 14px; color: #666; line-height: 1.5; }
    .modal-actions { display: flex; gap: 12px; }
    .btn-cancel { flex: 1; padding: 10px; background: #eee; color: #555; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-delete { flex: 1; padding: 10px; background: #C62828; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }

    @media (max-width: 768px) {
      .detail-container { padding: 16px; }
      .card-top { flex-direction: column; }
      .card-actions { width: 100%; }
      .orphans-table { font-size: 11px; }
      .orphans-table th, .orphans-table td { padding: 8px 6px; }
    }
  `]
})
export class GuardianDetailComponent implements OnInit {
  guardian: Guardian | null = null;
  orphans: Orphan[] = [];
  showDeleteModal = false;

  get addOrphanLink(): any[] {
    return this.guardian
      ? ['/guardians', this.guardian.id, 'orphans', 'new']
      : ['/guardians'];
  }

  constructor(
    private guardianService: GuardianService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(+id);
  }

  load(id: number): void {
    this.guardianService.getById(id).subscribe({
      next: res => {
        this.guardian = res.data;
        this.orphans  = (res.data.orphans as Orphan[]) || [];
      },
    });
  }

  copy(text: string): void { navigator.clipboard.writeText(text); }
  askDelete(): void { this.showDeleteModal = true; }

  confirmDelete(): void {
    if (!this.guardian) return;
    this.guardianService.delete(this.guardian.id).subscribe({
      next: () => this.router.navigate(['/guardians']),
    });
  }
}
