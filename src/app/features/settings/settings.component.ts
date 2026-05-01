import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { WilayaService, Wilaya } from '../../core/services/wilaya.service';
import { SettingsService } from '../../core/services/settings.service';
import { BankService } from '../../core/services/bank.service';
import { Bank } from '../../core/models/bank.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, ConfirmDialogComponent],
  template: `
    <div class="page-header">
      <h1 class="page-title">{{ 'SETTINGS.TITLE' | translate }}</h1>
    </div>

    <div class="settings-layout">

      <!-- General Settings -->
      <div class="card">
        <h2 class="card-title">{{ 'SETTINGS.GENERAL' | translate }}</h2>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">{{ 'SETTINGS.DEFAULT_AMOUNT' | translate }}</div>
            <div class="setting-desc">{{ 'SETTINGS.DEFAULT_AMOUNT_DESC' | translate }}</div>
          </div>
          <div class="setting-control">
            <div class="input-addon-wrap">
              <input type="number" class="form-control" [(ngModel)]="defaultAmount" min="0" (blur)="saveDefaultAmount()">
              <span class="addon">{{ 'COMMON.MRU' | translate }}</span>
            </div>
            <div class="saved-msg" *ngIf="savedAmount">✓</div>
          </div>
        </div>
      </div>

      <!-- Banks -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">{{ 'SETTINGS.BANKS' | translate }}</h2>
          <button class="btn-add" (click)="showAddBankForm = !showAddBankForm">
            + {{ 'SETTINGS.ADD_BANK' | translate }}
          </button>
        </div>

        <!-- Add bank form -->
        <div *ngIf="showAddBankForm" class="add-form">
          <form [formGroup]="addBankForm" (ngSubmit)="addBank()">
            <div class="form-row">
              <label class="logo-upload-label" title="Choisir un logo">
                <img *ngIf="addBankLogoPreview" [src]="addBankLogoPreview" class="logo-preview-sm">
                <span *ngIf="!addBankLogoPreview" class="logo-upload-placeholder">🏦<br><small>Logo</small></span>
                <input type="file" accept="image/*" (change)="onAddBankLogo($event)" style="display:none">
              </label>
              <input type="text" formControlName="name_fr" class="form-control" [placeholder]="'SETTINGS.BANK_NAME_FR' | translate">
              <input type="text" formControlName="name_ar" class="form-control rtl-input" [placeholder]="'SETTINGS.BANK_NAME_AR' | translate" dir="rtl">
              <div class="input-addon-wrap">
                <input type="number" formControlName="balance" class="form-control balance-input" min="0" [placeholder]="'SETTINGS.BANK_BALANCE' | translate">
                <span class="addon">{{ 'COMMON.MRU' | translate }}</span>
              </div>
              <button type="submit" class="btn btn-primary" [disabled]="addBankForm.invalid || addingBank">
                {{ addingBank ? ('COMMON.LOADING' | translate) : ('COMMON.SAVE' | translate) }}
              </button>
              <button type="button" class="btn btn-secondary" (click)="showAddBankForm = false; addBankLogoPreview = null; addBankLogoFile = null">
                {{ 'COMMON.CANCEL' | translate }}
              </button>
            </div>
          </form>
        </div>

        <div *ngIf="loadingBanks" class="loading-state"><div class="spinner"></div></div>

        <div class="bank-list" *ngIf="!loadingBanks">
          <div *ngFor="let b of banks" class="bank-row">

            <div *ngIf="editingBankId !== b.id" class="bank-view">
              <div class="bank-logo-wrap">
                <img *ngIf="b.logo" [src]="b.logo" [alt]="b.name_fr" class="bank-logo">
                <div *ngIf="!b.logo" class="bank-logo-placeholder">🏦</div>
              </div>
              <span class="bank-fr">{{ b.name_fr }}</span>
              <span class="bank-ar">{{ b.name_ar }}</span>
              <span class="bank-balance">{{ b.balance | number:'1.0-0' }} <small>{{ 'COMMON.MRU' | translate }}</small></span>
              <span class="badge" [class]="b.is_active ? 'success' : 'secondary'">
                {{ (b.is_active ? 'COMMON.ACTIVE' : 'COMMON.INACTIVE') | translate }}
              </span>
              <div class="bank-actions">
                <button class="btn-icon" (click)="startEditBank(b)" title="{{ 'COMMON.EDIT' | translate }}">✏️</button>
                <button class="btn-icon danger" (click)="confirmDeleteBank(b)" title="{{ 'COMMON.DELETE' | translate }}">🗑️</button>
              </div>
            </div>

            <div *ngIf="editingBankId === b.id" class="bank-edit">
              <label class="logo-upload-label" title="Changer le logo">
                <img *ngIf="editBankLogoPreview || editBankCurrentLogo" [src]="editBankLogoPreview || editBankCurrentLogo!" class="logo-preview-sm">
                <span *ngIf="!editBankLogoPreview && !editBankCurrentLogo" class="logo-upload-placeholder">🏦<br><small>Logo</small></span>
                <input type="file" accept="image/*" (change)="onEditBankLogo($event)" style="display:none">
              </label>
              <input type="text" class="form-control" [(ngModel)]="editBankFr" [placeholder]="'SETTINGS.BANK_NAME_FR' | translate">
              <input type="text" class="form-control rtl-input" [(ngModel)]="editBankAr" [placeholder]="'SETTINGS.BANK_NAME_AR' | translate" dir="rtl">
              <div class="input-addon-wrap">
                <input type="number" class="form-control balance-input" [(ngModel)]="editBankBalance" min="0">
                <span class="addon">{{ 'COMMON.MRU' | translate }}</span>
              </div>
              <label class="toggle-label">
                <input type="checkbox" [(ngModel)]="editBankActive"> {{ 'COMMON.ACTIVE' | translate }}
              </label>
              <button class="btn btn-primary btn-sm" (click)="saveEditBank(b.id)" [disabled]="savingBank">
                {{ 'COMMON.SAVE' | translate }}
              </button>
              <button class="btn btn-secondary btn-sm" (click)="editingBankId = null; editBankLogoFile = null; editBankLogoPreview = null">
                {{ 'COMMON.CANCEL' | translate }}
              </button>
            </div>

          </div>
          <div *ngIf="banks.length === 0" class="empty">{{ 'SETTINGS.NO_BANKS' | translate }}</div>
        </div>
      </div>

      <!-- Wilayas -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">{{ 'SETTINGS.WILAYAS' | translate }}</h2>
          <button class="btn-add" (click)="showAddForm = !showAddForm">
            + {{ 'SETTINGS.ADD_WILAYA' | translate }}
          </button>
        </div>

        <!-- Add form -->
        <div *ngIf="showAddForm" class="add-form">
          <form [formGroup]="addForm" (ngSubmit)="addWilaya()">
            <div class="form-row">
              <input type="text" formControlName="name_fr" class="form-control" [placeholder]="'SETTINGS.WILAYA_FR' | translate">
              <input type="text" formControlName="name_ar" class="form-control rtl-input" [placeholder]="'SETTINGS.WILAYA_AR' | translate" dir="rtl">
              <button type="submit" class="btn btn-primary" [disabled]="addForm.invalid || adding">
                {{ adding ? ('COMMON.LOADING' | translate) : ('COMMON.SAVE' | translate) }}
              </button>
              <button type="button" class="btn btn-secondary" (click)="showAddForm = false">
                {{ 'COMMON.CANCEL' | translate }}
              </button>
            </div>
          </form>
        </div>

        <div *ngIf="loading" class="loading-state"><div class="spinner"></div></div>

        <div class="wilaya-list" *ngIf="!loading">
          <div *ngFor="let w of wilayas" class="wilaya-row">
            <div *ngIf="editingId !== w.id" class="wilaya-view">
              <span class="wilaya-fr">{{ w.name_fr }}</span>
              <span class="wilaya-ar">{{ w.name_ar }}</span>
              <span class="badge" [class]="w.is_active ? 'success' : 'secondary'">
                {{ (w.is_active ? 'COMMON.ACTIVE' : 'COMMON.INACTIVE') | translate }}
              </span>
              <div class="wilaya-actions">
                <button class="btn-icon" (click)="startEdit(w)" title="{{ 'COMMON.EDIT' | translate }}">✏️</button>
                <button class="btn-icon danger" (click)="confirmDelete(w)" title="{{ 'COMMON.DELETE' | translate }}">🗑️</button>
              </div>
            </div>
            <div *ngIf="editingId === w.id" class="wilaya-edit">
              <input type="text" class="form-control" [(ngModel)]="editFr" [placeholder]="'SETTINGS.WILAYA_FR' | translate">
              <input type="text" class="form-control rtl-input" [(ngModel)]="editAr" [placeholder]="'SETTINGS.WILAYA_AR' | translate" dir="rtl">
              <label class="toggle-label">
                <input type="checkbox" [(ngModel)]="editActive"> {{ 'COMMON.ACTIVE' | translate }}
              </label>
              <button class="btn btn-primary btn-sm" (click)="saveEdit(w.id)" [disabled]="saving">
                {{ 'COMMON.SAVE' | translate }}
              </button>
              <button class="btn btn-secondary btn-sm" (click)="editingId = null">
                {{ 'COMMON.CANCEL' | translate }}
              </button>
            </div>
          </div>
          <div *ngIf="wilayas.length === 0" class="empty">{{ 'SETTINGS.NO_WILAYAS' | translate }}</div>
        </div>
      </div>
    </div>

    <app-confirm-dialog [visible]="showDeleteDialog" type="danger"
      [title]="deleteDialogTitle"
      [message]="deleteDialogMsg"
      [confirmLabel]="'COMMON.DELETE' | translate" iconName="delete"
      (confirmed)="deleteConfirmed()" (cancelled)="showDeleteDialog = false">
    </app-confirm-dialog>
  `,
  styles: [`
    .settings-layout { display: flex; flex-direction: column; gap: 24px; }
    .card { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .card-title { font-size: 16px; font-weight: 700; color: #333; margin: 0 0 20px; }
    .card-header .card-title { margin: 0; }

    .setting-row { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 12px 0; }
    .setting-label { font-weight: 600; font-size: 14px; color: #333; }
    .setting-desc { font-size: 12px; color: #999; margin-top: 2px; }
    .setting-control { display: flex; align-items: center; gap: 8px; }
    .saved-msg { color: #2E7D32; font-weight: 700; font-size: 16px; }

    .input-addon-wrap { display: flex; align-items: center; }
    .input-addon-wrap .form-control { border-radius: 8px 0 0 8px; width: 100px; }
    .balance-input { width: 120px !important; }
    .addon { padding: 9px 12px; background: #f5f5f5; border: 1px solid #ddd; border-left: none; border-radius: 0 8px 8px 0; font-size: 13px; white-space: nowrap; }

    .btn-add { background: none; border: 1.5px dashed #2E7D32; color: #2E7D32; border-radius: 8px; padding: 7px 14px; cursor: pointer; font-size: 13px; font-weight: 600; }
    .btn-add:hover { background: #E8F5E9; }

    .add-form { background: #f9fafb; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
    .form-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .form-control { padding: 9px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; flex: 1; min-width: 120px; }
    .form-control:focus { border-color: #2E7D32; }
    .rtl-input { text-align: right; }

    /* Logo upload */
    .logo-upload-label { width: 52px; height: 52px; border: 2px dashed #ccc; border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; overflow: hidden; transition: border-color .15s; }
    .logo-upload-label:hover { border-color: #2E7D32; }
    .logo-preview-sm { width: 52px; height: 52px; object-fit: contain; border-radius: 8px; }
    .logo-upload-placeholder { font-size: 20px; text-align: center; line-height: 1.2; color: #aaa; }
    .logo-upload-placeholder small { font-size: 9px; }

    /* Banks */
    .bank-list { display: flex; flex-direction: column; gap: 6px; }
    .bank-view { display: flex; align-items: center; gap: 14px; padding: 12px 14px; background: #fafafa; border-radius: 10px; }
    .bank-edit { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: #FFF3E0; border-radius: 10px; flex-wrap: wrap; }
    .bank-logo-wrap { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .bank-logo { width: 44px; height: 44px; object-fit: contain; border-radius: 8px; }
    .bank-logo-placeholder { font-size: 28px; }
    .bank-fr { flex: 1; font-weight: 700; font-size: 14px; color: #222; }
    .bank-ar { flex: 1; text-align: right; font-size: 14px; color: #555; direction: rtl; }
    .bank-balance { font-weight: 700; color: #1565C0; font-size: 15px; white-space: nowrap; }
    .bank-balance small { font-size: 11px; font-weight: 400; color: #888; }
    .bank-actions { display: flex; gap: 6px; flex-shrink: 0; }

    /* Wilayas */
    .wilaya-list { display: flex; flex-direction: column; gap: 2px; }
    .wilaya-row { border-radius: 8px; overflow: hidden; }
    .wilaya-view { display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: #fafafa; border-radius: 8px; }
    .wilaya-fr { flex: 1; font-weight: 600; font-size: 14px; color: #333; }
    .wilaya-ar { flex: 1; text-align: right; font-size: 14px; color: #555; direction: rtl; }
    .wilaya-edit { display: flex; gap: 10px; align-items: center; padding: 10px 12px; background: #F3E5F5; border-radius: 8px; flex-wrap: wrap; }
    .wilaya-actions { display: flex; gap: 6px; }

    .btn-icon { background: none; border: none; cursor: pointer; font-size: 15px; padding: 4px 6px; border-radius: 6px; }
    .btn-icon:hover { background: #EEEEEE; }
    .btn-icon.danger:hover { background: #FFEBEE; }
    .toggle-label { display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; white-space: nowrap; }

    .badge { padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 500; white-space: nowrap; }
    .badge.success { background: #E8F5E9; color: #2E7D32; }
    .badge.secondary { background: #EEEEEE; color: #757575; }

    .btn { padding: 9px 18px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; font-weight: 600; white-space: nowrap; }
    .btn-sm { padding: 7px 14px; font-size: 13px; }
    .btn-primary { background: #2E7D32; color: #fff; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary { background: #EEE; color: #555; }

    .empty { text-align: center; color: #aaa; padding: 24px; font-size: 14px; }
    .loading-state { display: flex; justify-content: center; padding: 32px; }
    .spinner { width: 28px; height: 28px; border: 3px solid #eee; border-top-color: #2E7D32; border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class SettingsComponent implements OnInit {
  // Wilayas
  wilayas: Wilaya[] = [];
  loading = false;
  adding = false;
  saving = false;
  showAddForm = false;
  editingId: number | null = null;
  editFr = '';
  editAr = '';
  editActive = true;
  addForm!: FormGroup;

  // Banks
  banks: Bank[] = [];
  loadingBanks = false;
  addingBank = false;
  savingBank = false;
  showAddBankForm = false;
  editingBankId: number | null = null;
  editBankFr = '';
  editBankAr = '';
  editBankBalance = 0;
  editBankActive = true;
  addBankForm!: FormGroup;
  addBankLogoFile: File | null = null;
  addBankLogoPreview: string | null = null;
  editBankLogoFile: File | null = null;
  editBankLogoPreview: string | null = null;
  editBankCurrentLogo: string | null = null;

  // General
  defaultAmount: number | null = null;
  savedAmount = false;

  // Shared confirm dialog
  showDeleteDialog = false;
  deleteDialogTitle = '';
  deleteDialogMsg = '';
  private pendingDelete: (() => void) | null = null;

  constructor(
    private wilayaService: WilayaService,
    private settingsService: SettingsService,
    private bankService: BankService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.addForm = this.fb.group({
      name_fr: ['', Validators.required],
      name_ar: ['', Validators.required]
    });

    this.addBankForm = this.fb.group({
      name_fr: ['', Validators.required],
      name_ar: ['', Validators.required],
      balance: [0]
    });

    this.loadWilayas();
    this.loadBanks();
    this.settingsService.getAll().subscribe({
      next: res => {
        const v = res.data?.['default_monthly_amount'];
        this.defaultAmount = v ? +v : null;
      }
    });
  }

  // ── Wilayas ────────────────────────────────────────────
  loadWilayas(): void {
    this.loading = true;
    this.wilayaService.getAll().subscribe({
      next: res => { this.wilayas = res.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  addWilaya(): void {
    if (this.addForm.invalid) return;
    this.adding = true;
    this.wilayaService.create(this.addForm.value).subscribe({
      next: res => { this.wilayas.push(res.data); this.addForm.reset(); this.showAddForm = false; this.adding = false; },
      error: () => { this.adding = false; }
    });
  }

  startEdit(w: Wilaya): void { this.editingId = w.id; this.editFr = w.name_fr; this.editAr = w.name_ar; this.editActive = w.is_active; }

  saveEdit(id: number): void {
    this.saving = true;
    this.wilayaService.update(id, { name_fr: this.editFr, name_ar: this.editAr, is_active: this.editActive }).subscribe({
      next: res => { const i = this.wilayas.findIndex(w => w.id === id); if (i !== -1) this.wilayas[i] = res.data; this.editingId = null; this.saving = false; },
      error: () => { this.saving = false; }
    });
  }

  confirmDelete(w: Wilaya): void {
    this.deleteDialogTitle = 'SETTINGS.DELETE_WILAYA';
    this.deleteDialogMsg   = 'SETTINGS.DELETE_WILAYA_MSG';
    this.pendingDelete = () => {
      this.wilayaService.delete(w.id).subscribe({
        next: () => { this.wilayas = this.wilayas.filter(x => x.id !== w.id); this.showDeleteDialog = false; },
        error: () => { this.showDeleteDialog = false; }
      });
    };
    this.showDeleteDialog = true;
  }

  // ── Banks ──────────────────────────────────────────────
  loadBanks(): void {
    this.loadingBanks = true;
    this.bankService.getAll().subscribe({
      next: res => { this.banks = res.data; this.loadingBanks = false; },
      error: () => { this.loadingBanks = false; }
    });
  }

  addBank(): void {
    if (this.addBankForm.invalid) return;
    this.addingBank = true;
    this.bankService.create(this.addBankForm.value, this.addBankLogoFile ?? undefined).subscribe({
      next: res => { this.banks.push(res.data); this.addBankForm.reset({ balance: 0 }); this.showAddBankForm = false; this.addingBank = false; this.addBankLogoFile = null; this.addBankLogoPreview = null; },
      error: () => { this.addingBank = false; }
    });
  }

  startEditBank(b: Bank): void {
    this.editingBankId = b.id;
    this.editBankFr = b.name_fr;
    this.editBankAr = b.name_ar;
    this.editBankBalance = b.balance;
    this.editBankActive = b.is_active;
    this.editBankCurrentLogo = b.logo || null;
    this.editBankLogoFile = null;
    this.editBankLogoPreview = null;
  }

  saveEditBank(id: number): void {
    this.savingBank = true;
    const data = { name_fr: this.editBankFr, name_ar: this.editBankAr, balance: this.editBankBalance, is_active: this.editBankActive };
    this.bankService.update(id, data, this.editBankLogoFile ?? undefined).subscribe({
      next: res => { const i = this.banks.findIndex(b => b.id === id); if (i !== -1) this.banks[i] = res.data; this.editingBankId = null; this.savingBank = false; this.editBankLogoFile = null; this.editBankLogoPreview = null; },
      error: () => { this.savingBank = false; }
    });
  }

  onAddBankLogo(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.addBankLogoFile = file;
    const reader = new FileReader();
    reader.onload = e => this.addBankLogoPreview = e.target?.result as string;
    reader.readAsDataURL(file);
  }

  onEditBankLogo(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.editBankLogoFile = file;
    const reader = new FileReader();
    reader.onload = e => this.editBankLogoPreview = e.target?.result as string;
    reader.readAsDataURL(file);
  }

  confirmDeleteBank(b: Bank): void {
    this.deleteDialogTitle = 'SETTINGS.DELETE_BANK';
    this.deleteDialogMsg   = 'SETTINGS.DELETE_BANK_MSG';
    this.pendingDelete = () => {
      this.bankService.delete(b.id).subscribe({
        next: () => { this.banks = this.banks.filter(x => x.id !== b.id); this.showDeleteDialog = false; },
        error: () => { this.showDeleteDialog = false; }
      });
    };
    this.showDeleteDialog = true;
  }

  // ── Shared ─────────────────────────────────────────────
  deleteConfirmed(): void { this.pendingDelete?.(); }

  saveDefaultAmount(): void {
    if (this.defaultAmount === null) return;
    this.settingsService.set('default_monthly_amount', String(this.defaultAmount)).subscribe({
      next: () => { this.savedAmount = true; setTimeout(() => this.savedAmount = false, 2000); }
    });
  }
}
