import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivityService } from '../../../core/services/activity.service';
import { Activity, ActivityBeneficiary, ActivityItem } from '../../../core/models/activity.model';
import { OrphanService } from '../../../core/services/orphan.service';
import { FamilyService } from '../../../core/services/family.service';
import { BankService } from '../../../core/services/bank.service';
import { Orphan } from '../../../core/models/orphan.model';
import { Family } from '../../../core/models/family.model';
import { Bank } from '../../../core/models/bank.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { SearchableSelectComponent, SelectOption } from '../../../shared/components/searchable-select/searchable-select.component';
import { InsufficientBalanceModalComponent, InsufficientBalanceData } from '../../../shared/components/insufficient-balance-modal/insufficient-balance-modal.component';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-activity-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule, PageHeaderComponent, ConfirmDialogComponent, SearchableSelectComponent, InsufficientBalanceModalComponent],
  template: `
    <app-page-header [title]="activity?.title_fr || activity?.title_ar || ''" backLink="/activities">
      <button class="btn btn-print" (click)="printActivity()" *ngIf="activity">
        <span class="ms-icon-p">picture_as_pdf</span> {{ 'COMMON.EXPORT_PDF' | translate }}
      </button>
      <button class="btn btn-edit" [routerLink]="['/activities', activity?.id, 'edit']">✏️ {{ 'COMMON.EDIT' | translate }}</button>
    </app-page-header>

    <div *ngIf="loading" class="loading-state"><div class="spinner-lg"></div></div>

    <div *ngIf="!loading && activity" class="detail-layout">
      <!-- Left: Info + Photos + Items -->
      <div class="left-col">
        <div class="card info-card">
          <div class="activity-header">
            <span class="type-badge">{{ getTypeIcon(activity.activity_type) }} {{ activity.activity_type }}</span>
            <span class="date">📅 {{ activity.activity_date | date:'dd/MM/yyyy' }}</span>
          </div>
          <p *ngIf="activity.description_fr" class="desc">{{ activity.description_fr }}</p>
          <div class="cost-row">
            <div *ngIf="activity.total_cost" class="cost">
              💰 {{ activity.total_cost | number:'1.0-0' }} {{ 'COMMON.MRU' | translate }}
            </div>
            <div class="payment-badge" [class.in-kind]="activity.payment_type === 'in_kind'">
              {{ activity.payment_type === 'in_kind'
                  ? ('ACTIVITIES.PAYMENT_IN_KIND' | translate)
                  : ('ACTIVITIES.PAYMENT_FINANCIAL' | translate) }}
            </div>
          </div>
          <!-- Payment method for financial -->
          <div *ngIf="activity.payment_type === 'financial' && activity.payment_method" class="pay-method-row">
            <ng-container *ngFor="let b of banks">
              <ng-container *ngIf="b.name_fr.toLowerCase() === activity.payment_method">
                <img *ngIf="b.logo" [src]="'assets/images/' + b.logo" [alt]="b.name_fr" class="pay-logo">
                <span>{{ b.name_fr }}</span>
              </ng-container>
            </ng-container>
          </div>
        </div>

        <!-- In-kind items -->
        <div *ngIf="activity.payment_type === 'in_kind'" class="card">
          <div class="card-header">
            <h3 class="card-title">📦 {{ 'ACTIVITIES.ITEMS' | translate }}</h3>
            <button class="btn-add-photo" (click)="showItemForm = !showItemForm">+ {{ 'ACTIVITIES.ADD_ITEM' | translate }}</button>
          </div>

          <div *ngIf="showItemForm" class="item-form">
            <div class="field-group">
              <label class="field-label">{{ 'CONTRIBUTIONS.PAYMENT_METHOD' | translate }}</label>
              <app-searchable-select
                [options]="bankOptions"
                [value]="newItemPaymentMethod"
                [placeholder]="'TRANSFERS.DEBIT_ACCOUNT' | translate"
                (valueChange)="newItemPaymentMethod = $event">
              </app-searchable-select>
            </div>
            <input type="text" class="form-control" [(ngModel)]="newItemName" [placeholder]="'ACTIVITIES.ITEM_NAME' | translate">
            <input type="number" class="form-control" [(ngModel)]="newItemQty" min="0.01" step="0.01" [placeholder]="'COMMON.QTY' | translate">
            <div class="input-addon-wrap">
              <input type="number" class="form-control" [(ngModel)]="newItemValue" min="0" [placeholder]="'COMMON.UNIT_VALUE' | translate">
              <span class="addon">{{ 'COMMON.MRU' | translate }}</span>
            </div>
            <button class="btn btn-green" (click)="addItem()" [disabled]="!newItemName || savingItem">
              {{ savingItem ? ('COMMON.LOADING' | translate) : ('COMMON.SAVE' | translate) }}
            </button>
          </div>

          <div *ngIf="(activity.items?.length || 0) > 0" class="items-table">
            <div class="items-header items-header-5">
              <span>{{ 'ACTIVITIES.ITEM_NAME' | translate }}</span>
              <span>{{ 'CONTRIBUTIONS.PAYMENT_METHOD' | translate }}</span>
              <span>{{ 'ACTIVITIES.ITEM_QTY' | translate }}</span>
              <span>{{ 'ACTIVITIES.ITEM_UNIT_VALUE' | translate }}</span>
              <span>{{ 'ACTIVITIES.ITEM_TOTAL' | translate }}</span>
              <span></span>
            </div>
            <div *ngFor="let item of activity.items" class="item-row item-row-5">
              <span>{{ item.name }}</span>
              <span>
                <span *ngIf="item.payment_method" class="bank-badge">{{ getBankLabel(item.payment_method) }}</span>
                <span *ngIf="!item.payment_method" class="text-muted">—</span>
              </span>
              <span>{{ item.quantity }}</span>
              <span>{{ item.unit_value | number:'1.0-0' }} {{ 'COMMON.MRU' | translate }}</span>
              <span class="item-total">{{ (item.quantity * item.unit_value) | number:'1.0-0' }} {{ 'COMMON.MRU' | translate }}</span>
              <button class="remove-benef" (click)="confirmDeleteItem(item.id)">✕</button>
            </div>
          </div>
          <div *ngIf="(activity.items?.length || 0) === 0 && !showItemForm" class="empty-state">{{ 'COMMON.NO_DATA' | translate }}</div>
        </div>

        <!-- Photos -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">📷 {{ 'ACTIVITIES.PHOTOS' | translate }}</h3>
            <label class="btn-add-photo">
              <input type="file" accept="image/*" multiple hidden (change)="onAddPhotos($event)">
              + {{ 'ACTIVITIES.ADD_PHOTOS' | translate }}
            </label>
          </div>
          <div class="photos-gallery">
            <div *ngFor="let p of activity.photos" class="gallery-item">
              <img [src]="p.photo_url" [alt]="p.caption">
              <button class="remove-photo" (click)="confirmDeletePhoto(p.id)">✕</button>
            </div>
            <div *ngIf="(activity.photos?.length || 0) === 0" class="empty-state">{{ 'COMMON.NO_DATA' | translate }}</div>
          </div>
        </div>
      </div>

      <!-- Right: Beneficiaries -->
      <div class="right-col">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">👥 {{ 'ACTIVITIES.BENEFICIARIES' | translate }}</h3>
            <button class="btn-add-benef" (click)="showBenefForm = !showBenefForm">
              + {{ 'ACTIVITIES.ADD_BENEFICIARY' | translate }}
            </button>
          </div>

          <div *ngIf="showBenefForm" class="benef-form">
            <app-searchable-select [options]="benefTypeOptions" [value]="benefType"
              [placeholder]="'— ' + ('ACTIVITIES.BENEFICIARY_TYPE' | translate) + ' —'"
              (valueChange)="onBenefTypeChange($event)">
            </app-searchable-select>
            <app-searchable-select [options]="currentEntityOptions" [value]="benefId"
              [placeholder]="'— ' + ('COMMON.ALL' | translate) + ' —'"
              (valueChange)="onBenefEntitySelect($event)">
            </app-searchable-select>
            <!-- Amount + payment method for financial activities -->
            <ng-container *ngIf="activity.payment_type === 'financial'">
              <div class="amount-wrap">
                <input type="number" class="form-control" [(ngModel)]="benefAmount"
                       [placeholder]="'COMMON.AMOUNT' | translate" min="0">
                <span class="addon">{{ 'COMMON.MRU' | translate }}</span>
              </div>
              <div class="field-group">
                <label class="field-label">{{ 'CONTRIBUTIONS.PAYMENT_METHOD' | translate }} *</label>
                <app-searchable-select [options]="bankOptions" [value]="benefPaymentMethod"
                  [placeholder]="'— ' + ('CONTRIBUTIONS.PAYMENT_METHOD' | translate) + ' —'"
                  (valueChange)="benefPaymentMethod = $event">
                </app-searchable-select>
              </div>
              <!-- Screenshot upload for non-cash -->
              <div *ngIf="benefPaymentMethod && benefPaymentMethod !== 'cash'" class="field-group">
                <label class="field-label">{{ 'DONATIONS.SCREENSHOT' | translate }}</label>
                <label class="screenshot-upload-label">
                  <input type="file" accept="image/*" hidden (change)="onBenefScreenshot($event)">
                  <span *ngIf="!benefScreenshotPreview">📎 {{ 'DONATIONS.UPLOAD_SCREENSHOT' | translate }}</span>
                  <img *ngIf="benefScreenshotPreview" [src]="benefScreenshotPreview" class="screenshot-preview-sm">
                </label>
              </div>
            </ng-container>
            <button class="btn btn-green" (click)="addBeneficiary()"
              [disabled]="!benefId || savingBenef || (activity.payment_type === 'financial' && !benefPaymentMethod)">
              {{ savingBenef ? ('COMMON.LOADING' | translate) : ('COMMON.SAVE' | translate) }}
            </button>
          </div>

          <div *ngIf="(activity.beneficiaries?.length || 0) === 0 && !showBenefForm" class="empty-state">
            {{ 'COMMON.NO_DATA' | translate }}
          </div>
          <div *ngFor="let b of activity.beneficiaries" class="benef-card">
            <div class="benef-icon">{{ b.beneficiary_type === 'orphan' ? '🧒' : '🏠' }}</div>
            <div class="benef-info">
              <strong>{{ b.beneficiary_name || ('ID: ' + b.beneficiary_id) }}</strong>
              <span class="benef-type">{{ b.beneficiary_type === 'orphan' ? ('MENU.ORPHANS' | translate) : ('MENU.FAMILIES' | translate) }}</span>
              <div *ngIf="b.payment_method" class="benef-bank-row">
                <span class="bank-badge">{{ getBankLabel(b.payment_method) }}</span>
                <a *ngIf="b.screenshot_url" [href]="b.screenshot_url" target="_blank" class="screenshot-link">📎</a>
              </div>
            </div>
            <div *ngIf="b.value_received && activity.payment_type === 'financial'" class="benef-amount">
              {{ b.value_received | number:'1.0-0' }} {{ 'COMMON.MRU' | translate }}
            </div>
            <button class="remove-benef" (click)="confirmDeleteBenef(b.id)">✕</button>
          </div>
        </div>
      </div>
    </div>

    <app-confirm-dialog [visible]="showDeleteDialog" type="danger"
      [title]="'COMMON.CONFIRM_DELETE' | translate"
      [message]="'COMMON.CONFIRM_DELETE_MSG' | translate"
      [confirmLabel]="'COMMON.DELETE' | translate"
      iconName="delete"
      (confirmed)="confirmAction()" (cancelled)="showDeleteDialog = false">
    </app-confirm-dialog>

    <app-insufficient-balance-modal
      [visible]="showBalanceModal"
      [data]="balanceError"
      [lang]="currentLang"
      (close)="showBalanceModal = false">
    </app-insufficient-balance-modal>
  `,
  styles: [`
    .detail-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 768px) { .detail-layout { grid-template-columns: 1fr; } }
    .left-col, .right-col { display: flex; flex-direction: column; gap: 20px; }
    .card { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .card-title { margin: 0; font-size: 16px; font-weight: 700; color: #333; }
    .activity-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .type-badge { padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; background: #F3E5F5; color: #7B1FA2; }
    .date { font-size: 13px; color: #888; }
    .desc { color: #666; line-height: 1.6; margin-bottom: 12px; }
    .cost-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
    .cost { font-size: 18px; font-weight: 700; color: #2E7D32; }
    .payment-badge { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; background: #E3F2FD; color: #1565C0; }
    .payment-badge.in-kind { background: #FFF3E0; color: #E65100; }
    .pay-method-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #555; }
    .pay-logo { width: 28px; height: 28px; object-fit: contain; border-radius: 6px; }
    .photos-gallery { display: flex; flex-wrap: wrap; gap: 10px; }
    .gallery-item { position: relative; width: 100px; height: 100px; border-radius: 10px; overflow: hidden; }
    .gallery-item img { width: 100%; height: 100%; object-fit: cover; }
    .remove-photo { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.5); color: #fff; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 10px; }
    .btn-add-photo { border: 1px dashed #7B1FA2; color: #7B1FA2; border-radius: 8px; padding: 6px 12px; cursor: pointer; font-size: 13px; background: none; }
    .btn-add-benef { background: none; border: 1px dashed #2E7D32; color: #2E7D32; border-radius: 8px; padding: 6px 12px; cursor: pointer; font-size: 13px; }
    .benef-form { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; padding: 12px; background: #f9f9f9; border-radius: 10px; }
    .form-control { padding: 8px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; width: 100%; box-sizing: border-box; }
    .amount-wrap { display: flex; align-items: center; }
    .amount-wrap .form-control { border-radius: 8px 0 0 8px; flex: 1; }
    .addon { padding: 8px 10px; background: #f5f5f5; border: 1px solid #ddd; border-left: none; border-radius: 0 8px 8px 0; font-size: 13px; color: #666; white-space: nowrap; }
    .benef-card { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 10px; background: #fafafa; margin-bottom: 8px; }
    .benef-icon { font-size: 24px; }
    .benef-info { flex: 1; min-width: 0; }
    .benef-info strong { display: block; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .benef-type { font-size: 12px; color: #999; }
    .benef-amount { font-weight: 700; color: #2E7D32; font-size: 14px; white-space: nowrap; }
    .remove-benef { background: none; border: none; color: #ccc; cursor: pointer; font-size: 14px; flex-shrink: 0; }
    .remove-benef:hover { color: #C62828; }
    /* Items table */
    .item-bank-row { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f0f7f0; border-radius: 8px; margin-bottom: 12px; font-size: 13px; color: #2E7D32; }
    .item-bank-name { font-weight: 700; }
    .item-bank-balance { margin-left: auto; font-weight: 600; color: #1565C0; }
    .field-group { display: flex; flex-direction: column; gap: 4px; }
    .field-label { font-size: 12px; font-weight: 600; color: #666; }
    .bank-chip { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; background: #f0f7f0; border: 1px solid #c8e6c9; border-radius: 8px; font-size: 13px; font-weight: 600; color: #2E7D32; }
    .chip-logo { width: 20px; height: 20px; object-fit: contain; border-radius: 4px; }
    .chip-name { font-weight: 700; }
    .item-form { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; padding: 12px; background: #fff8e1; border-radius: 10px; }
    .input-addon-wrap { display: flex; }
    .input-addon-wrap .form-control { border-radius: 8px 0 0 8px; flex: 1; }
    .items-table { border: 1px solid #eee; border-radius: 8px; overflow: hidden; }
    .items-header { display: grid; grid-template-columns: 2fr 1fr 1.2fr 1.2fr 28px; gap: 6px; padding: 8px 10px; background: #f5f5f5; font-size: 11px; font-weight: 700; color: #666; }
    .items-header-5 { grid-template-columns: 2fr 1.2fr 0.7fr 1.1fr 1.1fr 28px; }
    .item-row { display: grid; grid-template-columns: 2fr 1fr 1.2fr 1.2fr 28px; gap: 6px; padding: 8px 10px; border-top: 1px solid #f0f0f0; font-size: 13px; align-items: center; }
    .item-row-5 { grid-template-columns: 2fr 1.2fr 0.7fr 1.1fr 1.1fr 28px; }
    .item-total { font-weight: 700; color: #7B1FA2; }
    .bank-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 700; background: #E3F2FD; color: #1565C0; white-space: nowrap; }
    .empty-state { text-align: center; color: #aaa; padding: 20px 0; font-size: 14px; }
    .loading-state { display: flex; justify-content: center; padding: 60px; }
    .spinner-lg { width: 40px; height: 40px; border: 4px solid #eee; border-top-color: #7B1FA2; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; font-weight: 500; }
    .btn-green { background: #2E7D32; color: #fff; }
    .btn-green:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-edit { background: #7B1FA2; color: #fff; border: none; border-radius: 8px; padding: 10px 18px; cursor: pointer; font-size: 14px; font-weight: 500; }
    .btn-print { background: #fff; border: 1.5px solid #C62828; color: #C62828; border-radius: 8px; padding: 9px 16px; cursor: pointer; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px; font-family: inherit; transition: all .15s; }
    .btn-print:hover { background: #FFEBEE; }
    .benef-bank-row { display: flex; align-items: center; gap: 6px; margin-top: 3px; }
    .screenshot-link { font-size: 14px; text-decoration: none; }
    .screenshot-upload-label { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 8px 12px; border: 1.5px dashed #1565C0; border-radius: 8px; cursor: pointer; font-size: 13px; color: #1565C0; background: #E3F2FD; }
    .screenshot-preview-sm { width: 60px; height: 60px; object-fit: cover; border-radius: 6px; }
    .ms-icon-p { font-family: 'Material Symbols Outlined'; font-style: normal; font-weight: normal; font-variation-settings: 'FILL' 1,'wght' 400; display: inline-block; line-height: 1; font-size: 16px; }
  `]
})
export class ActivityDetailComponent implements OnInit {
  activity: Activity | null = null;
  loading = true;
  banks: Bank[] = [];

  showBenefForm = false;
  savingBenef = false;
  benefType: string = 'orphan';
  benefId: number | string | null = null;
  benefAmount: number | null = null;
  benefPaymentMethod: number | string | null = null;
  benefScreenshotFile: File | null = null;
  benefScreenshotPreview: string | null = null;

  showItemForm = false;
  savingItem = false;
  newItemName = '';
  newItemQty = 1;
  newItemValue = 0;
  newItemPaymentMethod: number | string | null = null;

  showBalanceModal = false;
  balanceError: InsufficientBalanceData | null = null;
  get currentLang(): string { return this.translate.currentLang || 'fr'; }

  get bankOptions(): SelectOption[] {
    const lang = this.translate.currentLang || 'fr';
    return this.banks.map(b => ({
      id: b.name_fr.toLowerCase(),
      label: lang === 'ar' ? b.name_ar : b.name_fr,
      sublabel: `${b.balance.toLocaleString('fr-FR')} ${this.translate.instant('COMMON.MRU')}`
    }));
  }

  showDeleteDialog = false;
  private pendingAction: (() => void) | null = null;

  benefTypeOptions: SelectOption[] = [];
  orphanOptions: SelectOption[] = [];
  familyOptions: SelectOption[] = [];

  get currentEntityOptions(): SelectOption[] {
    return this.benefType === 'orphan' ? this.orphanOptions : this.familyOptions;
  }

  private typeIcons: Record<string, string> = {
    school_fees: '📚', eid_help: '🌙', food_basket: '🥗', winter_clothes: '🧥', ramadan: '⭐', other: '📋'
  };

  constructor(
    private route: ActivatedRoute,
    private service: ActivityService,
    private orphanService: OrphanService,
    private familyService: FamilyService,
    private bankService: BankService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.benefTypeOptions = [
      { id: 'orphan', label: this.translate.instant('MENU.ORPHANS') },
      { id: 'family', label: this.translate.instant('MENU.FAMILIES') }
    ];

    const id = +this.route.snapshot.paramMap.get('id')!;
    this.loadActivity(id);

    this.orphanService.getAll({ status: 'active' }).subscribe({
      next: r => this.orphanOptions = (r.data as Orphan[]).map(o => ({ id: o.id, label: o.full_name })),
      error: () => {}
    });
    this.familyService.getAll({ is_active: true }).subscribe({
      next: r => this.familyOptions = (r.data as Family[]).map(f => ({ id: f.id, label: f.name || f.representative_name })),
      error: () => {}
    });
    this.bankService.getAll().subscribe({
      next: res => this.banks = res.data.filter(b => b.is_active),
      error: () => {}
    });
  }

  private loadActivity(id: number): void {
    this.service.getById(id).subscribe({
      next: res => { this.activity = res.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  getTypeIcon(type: string): string { return this.typeIcons[type] || '📋'; }

  getBankLabel(method: string): string {
    const b = this.banks.find(b => b.name_fr.toLowerCase() === method);
    if (!b) return method;
    const lang = this.translate.currentLang || 'fr';
    return lang === 'ar' ? b.name_ar : b.name_fr;
  }

  onBenefTypeChange(val: number | string | null): void { this.benefType = (val as string) || 'orphan'; this.benefId = null; }
  onBenefEntitySelect(val: number | string | null): void { this.benefId = val; }

  onBenefScreenshot(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.benefScreenshotFile = file;
    const reader = new FileReader();
    reader.onload = e => this.benefScreenshotPreview = e.target?.result as string;
    reader.readAsDataURL(file);
    (event.target as HTMLInputElement).value = '';
  }

  onAddPhotos(event: Event): void {
    if (!this.activity) return;
    const files = Array.from((event.target as HTMLInputElement).files || []);
    const fd = new FormData();
    files.forEach((file, i) => fd.append(`photos[${i}]`, file));
    this.service.addPhoto(this.activity.id, fd).subscribe({ next: () => this.loadActivity(this.activity!.id), error: () => {} });
    (event.target as HTMLInputElement).value = '';
  }

  confirmDeletePhoto(photoId: number): void {
    this.pendingAction = () => {
      this.service.deletePhoto(this.activity!.id, photoId).subscribe({
        next: () => { this.showDeleteDialog = false; this.loadActivity(this.activity!.id); },
        error: () => { this.showDeleteDialog = false; }
      });
    };
    this.showDeleteDialog = true;
  }

  addBeneficiary(): void {
    if (!this.activity || !this.benefId) return;
    this.savingBenef = true;
    const data: Partial<ActivityBeneficiary> = {
      beneficiary_type: this.benefType as any,
      beneficiary_id: +this.benefId,
      value_received: this.activity.payment_type === 'financial' ? (this.benefAmount ?? undefined) : undefined,
      payment_method: this.activity.payment_type === 'financial' ? (this.benefPaymentMethod as string) : undefined,
    };
    const screenshot = this.benefPaymentMethod !== 'cash' ? (this.benefScreenshotFile ?? undefined) : undefined;
    this.service.addBeneficiary(this.activity.id, data, screenshot).subscribe({
      next: () => {
        this.savingBenef = false; this.showBenefForm = false;
        this.benefId = null; this.benefAmount = null;
        this.benefPaymentMethod = null; this.benefScreenshotFile = null; this.benefScreenshotPreview = null;
        this.loadActivity(this.activity!.id);
        this.refreshBanks();
      },
      error: (err: any) => {
        this.savingBenef = false;
        if (err?.status === 422 && err?.error?.error === 'insufficient_balance') {
          this.balanceError = err.error.data;
          this.showBalanceModal = true;
        }
      }
    });
  }

  confirmDeleteBenef(benefId: number): void {
    this.pendingAction = () => {
      this.service.removeBeneficiary(this.activity!.id, benefId).subscribe({
        next: () => { this.showDeleteDialog = false; this.loadActivity(this.activity!.id); },
        error: () => { this.showDeleteDialog = false; }
      });
    };
    this.showDeleteDialog = true;
  }

  addItem(): void {
    if (!this.activity || !this.newItemName.trim()) return;
    this.savingItem = true;
    this.service.addItems(this.activity.id, [{
      name: this.newItemName,
      quantity: this.newItemQty,
      unit_value: this.newItemValue,
      payment_method: (this.newItemPaymentMethod as string | null) ?? undefined
    }]).subscribe({
      next: () => {
        this.savingItem = false; this.showItemForm = false;
        this.newItemName = ''; this.newItemQty = 1; this.newItemValue = 0;
        this.newItemPaymentMethod = null;
        this.loadActivity(this.activity!.id);
        this.refreshBanks();
      },
      error: (err: any) => {
        this.savingItem = false;
        if (err?.status === 422 && err?.error?.error === 'insufficient_balance') {
          this.balanceError = err.error.data;
          this.showBalanceModal = true;
        }
      }
    });
  }

  confirmDeleteItem(itemId: number): void {
    this.pendingAction = () => {
      this.service.removeItem(this.activity!.id, itemId).subscribe({
        next: () => {
          this.showDeleteDialog = false;
          this.loadActivity(this.activity!.id);
          this.refreshBanks();
        },
        error: () => { this.showDeleteDialog = false; }
      });
    };
    this.showDeleteDialog = true;
  }

  private refreshBanks(): void {
    this.bankService.getAll().subscribe({
      next: res => this.banks = res.data.filter(b => b.is_active),
      error: () => {}
    });
  }

  confirmAction(): void { this.pendingAction?.(); }

  printActivity(): void {
    if (!this.activity) return;
    const a = this.activity;
    const lang = this.translate.currentLang || 'fr';
    const isAr = lang === 'ar';
    const dir = isAr ? 'rtl' : 'ltr';
    const textAlign = isAr ? 'right' : 'left';

    const typeLabels: Record<string, [string, string]> = {
      school_fees:    ['Frais de scolarité', 'رسوم دراسية'],
      eid_help:       ['Aide Aïd',           'مساعدة عيد'],
      food_basket:    ['Salle alimentaire',  'سلة غذائية'],
      winter_clothes: ['Vêtements d\'hiver', 'ملابس شتوية'],
      ramadan:        ['Ramadan',            'رمضان'],
      other:          ['Autre',              'أخرى'],
    };
    const payTypeLabels: Record<string, [string, string]> = {
      financial: ['Financière', 'مالية'],
      in_kind:   ['En nature',  'عينية'],
    };
    const payMethodLabels: Record<string, string> = {
      cash: isAr ? 'نقداً' : 'Espèces',
      bankily: 'Bankily', sadad: 'Sadad', masrafi: isAr ? 'مصرفي' : 'Masrafi',
    };

    const t = (fr: string, ar: string) => isAr ? ar : fr;
    const typeLabel = typeLabels[a.activity_type]?.[isAr ? 1 : 0] ?? a.activity_type;
    const payTypeLabel = payTypeLabels[a.payment_type ?? 'financial']?.[isAr ? 1 : 0] ?? '';
    const actDate = a.activity_date ? new Date(a.activity_date).toLocaleDateString('fr-FR') : '—';
    const logoUrl = `${window.location.origin}/assets/images/logo.png`;

    const orphans  = (a.beneficiaries || []).filter(b => b.beneficiary_type === 'orphan');
    const families = (a.beneficiaries || []).filter(b => b.beneficiary_type === 'family');

    const renderBenefTable = (list: typeof orphans, title: string) => {
      if (!list.length) return '';
      const rows = list.map((b, i) => `
        <tr style="background:${i % 2 === 0 ? '#fff' : '#f5faf5'}">
          <td style="padding:5px 10px">${b.beneficiary_name || '—'}</td>
          ${a.payment_type === 'financial'
            ? `<td style="padding:5px 10px;font-weight:700;color:#2E7D32;text-align:center">${b.value_received ? b.value_received.toLocaleString('fr-FR') + ' ' + t('MRU', 'أوقية جديدة') : '—'}</td>`
            : ''}
        </tr>`).join('');
      return `
        <h3 style="font-size:13px;font-weight:700;color:#555;margin:16px 0 6px;border-bottom:1px solid #eee;padding-bottom:4px">${title}</h3>
        <table style="width:100%;border-collapse:collapse;font-size:11px">
          <thead><tr style="background:#2E7D32;color:#fff">
            <th style="padding:6px 10px;text-align:${textAlign}">${t('Nom', 'الاسم')}</th>
            ${a.payment_type === 'financial' ? `<th style="padding:6px 10px;text-align:center">${t('Montant reçu', 'المبلغ المستلم')}</th>` : ''}
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    };

    const itemsSection = a.payment_type === 'in_kind' && (a.items?.length || 0) > 0 ? `
      <h3 style="font-size:13px;font-weight:700;color:#555;margin:16px 0 6px;border-bottom:1px solid #eee;padding-bottom:4px">
        ${t('Éléments distribués', 'العناصر الموزعة')}
      </h3>
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        <thead><tr style="background:#00695C;color:#fff">
          <th style="padding:6px 10px;text-align:${textAlign}">${t('Élément', 'العنصر')}</th>
          <th style="padding:6px 10px;text-align:center">${t('Mode de paiement', 'طريقة الدفع')}</th>
          <th style="padding:6px 10px;text-align:center">${t('Qté', 'الكمية')}</th>
          <th style="padding:6px 10px;text-align:center">${t('Val. unitaire', 'القيمة الوحدوية')}</th>
          <th style="padding:6px 10px;text-align:center">${t('Sous-total', 'المجموع')}</th>
        </tr></thead>
        <tbody>${(a.items || []).map((item, i) => {
          const method = item.payment_method ? (payMethodLabels[item.payment_method] || item.payment_method) : '—';
          return `<tr style="background:${i % 2 === 0 ? '#fff' : '#f0faf8'}">
            <td style="padding:5px 10px;font-weight:600">${item.name}</td>
            <td style="padding:5px 10px;text-align:center;color:#1565C0">${method}</td>
            <td style="padding:5px 10px;text-align:center">${item.quantity}</td>
            <td style="padding:5px 10px;text-align:center">${item.unit_value.toLocaleString('fr-FR')}</td>
            <td style="padding:5px 10px;text-align:center;font-weight:700;color:#00695C">${((item.quantity * item.unit_value) || 0).toLocaleString('fr-FR')}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>` : '';

    const benefSection = (orphans.length || families.length) ? `
      <h2 style="font-size:14px;font-weight:700;color:#333;margin:20px 0 4px">
        ${t('Bénéficiaires', 'المستفيدون')} (${(a.beneficiaries || []).length})
      </h2>
      ${renderBenefTable(orphans,  t(`Orphelins (${orphans.length})`,  `الأيتام (${orphans.length})`))}
      ${renderBenefTable(families, t(`Familles (${families.length})`, `الأسر المحتاجة (${families.length})`))}` : '';

    const container = document.createElement('div');
    container.style.cssText = [
      'position:fixed','top:-99999px','left:-99999px','width:794px',
      'background:#fff','padding:28px 32px',
      `font-family:'Cairo',Arial,sans-serif`,'font-size:12px','color:#212121',`direction:${dir}`,
    ].join(';');

    container.innerHTML = `
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div>
          <div style="font-size:20px;font-weight:800;color:#212121">${isAr ? (a.title_ar || a.title_fr) : (a.title_fr || a.title_ar)}</div>
          <div style="font-size:12px;color:#888;margin-top:2px">${typeLabel} &nbsp;·&nbsp; ${actDate} &nbsp;·&nbsp; ${payTypeLabel}</div>
        </div>
        <img src="${logoUrl}" style="height:56px;object-fit:contain">
      </div>
      <hr style="border:none;border-top:2px solid #2E7D32;margin-bottom:16px">

      <!-- Summary row -->
      <div style="display:flex;gap:12px;margin-bottom:16px">
        <div style="flex:1;background:#E8F5E9;border-radius:10px;padding:12px 16px;text-align:center">
          <div style="font-size:10px;color:#555;margin-bottom:4px">${t('Coût total', 'التكلفة الإجمالية')}</div>
          <div style="font-size:18px;font-weight:800;color:#2E7D32">${a.total_cost ? a.total_cost.toLocaleString('fr-FR') : '0'} <span style="font-size:11px;font-weight:500">${t('MRU', 'أوقية جديدة')}</span></div>
        </div>
        <div style="flex:1;background:#E3F2FD;border-radius:10px;padding:12px 16px;text-align:center">
          <div style="font-size:10px;color:#555;margin-bottom:4px">${t('Bénéficiaires', 'المستفيدون')}</div>
          <div style="font-size:18px;font-weight:800;color:#1565C0">${(a.beneficiaries || []).length}</div>
        </div>
        ${a.payment_type === 'in_kind' ? `
        <div style="flex:1;background:#FFF3E0;border-radius:10px;padding:12px 16px;text-align:center">
          <div style="font-size:10px;color:#555;margin-bottom:4px">${t('Éléments', 'العناصر')}</div>
          <div style="font-size:18px;font-weight:800;color:#E65100">${(a.items || []).length}</div>
        </div>` : ''}
      </div>

      ${itemsSection}
      ${benefSection}
      ${(a.photos?.length || 0) > 0 ? `
      <h2 style="font-size:14px;font-weight:700;color:#333;margin:20px 0 10px;border-bottom:1px solid #eee;padding-bottom:6px">
        ${t('Photos', 'الصور')} (${a.photos!.length})
      </h2>
      <div style="display:flex;flex-wrap:wrap;gap:10px">
        ${a.photos!.map(p => `
          <div style="width:220px;border-radius:10px;overflow:hidden;border:1px solid #eee">
            <img src="${p.photo_url}" crossorigin="anonymous"
                 style="width:220px;height:160px;object-fit:cover;display:block">
            ${(p.caption_fr || p.caption_ar) ? `
              <div style="padding:4px 8px;font-size:10px;color:#666;background:#fafafa">
                ${isAr ? (p.caption_ar || p.caption_fr) : (p.caption_fr || p.caption_ar)}
              </div>` : ''}
          </div>`).join('')}
      </div>` : ''}

      <hr style="border:none;border-top:1px solid #eee;margin-top:24px;margin-bottom:8px">
      <div style="text-align:center;font-size:10px;color:#aaa">
        ${t('Imprimé le', 'تاريخ الطباعة')}: ${new Date().toLocaleDateString('fr-FR')} &nbsp;·&nbsp; جمعية معا للمستقبل الخيرية
      </div>`;

    document.body.appendChild(container);
    document.fonts.load('600 12px Cairo').then(() => {
      html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(canvas => {
        document.body.removeChild(container);
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const imgH = (canvas.height / canvas.width) * pageW;
        if (imgH <= pageH) {
          pdf.addImage(imgData, 'PNG', 0, 0, pageW, imgH);
        } else {
          const ratio = canvas.width / pageW;
          const sliceH = Math.floor(pageH * ratio);
          let yOff = 0;
          while (yOff < canvas.height) {
            const sc = document.createElement('canvas');
            sc.width = canvas.width;
            sc.height = Math.min(sliceH, canvas.height - yOff);
            sc.getContext('2d')!.drawImage(canvas, 0, -yOff);
            pdf.addImage(sc.toDataURL('image/png'), 'PNG', 0, 0, pageW, pageH);
            yOff += sliceH;
            if (yOff < canvas.height) pdf.addPage();
          }
        }
        const title = (isAr ? (a.title_ar || a.title_fr) : (a.title_fr || a.title_ar)) || String(a.id);
        const safeName = title.replace(/\s+/g, '_').replace(/[^\w؀-ۿ_-]/g, '');
        const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
        pdf.save(`activite_${safeName}_${dateStr}.pdf`);
      });
    });
  }
}
