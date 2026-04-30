import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { BankService } from '../../core/services/bank.service';
import { BankTransferService } from '../../core/services/bank-transfer.service';
import { Bank } from '../../core/models/bank.model';
import { BankTransfer } from '../../core/models/bank-transfer.model';
import { SearchableSelectComponent, SelectOption } from '../../shared/components/searchable-select/searchable-select.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-gestion',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, SearchableSelectComponent, ConfirmDialogComponent],
  template: `
    <div class="page-header">
      <h1 class="page-title">{{ 'TRANSFERS.TITLE' | translate }}</h1>
    </div>

    <div class="gestion-layout">

      <!-- Soldes des comptes -->
      <div class="card balances-card">
        <h2 class="card-title">{{ 'TRANSFERS.BALANCES' | translate }}</h2>
        <div *ngIf="loadingBanks" class="loading-state"><div class="spinner"></div></div>
        <div class="balances-grid" *ngIf="!loadingBanks">
          <div *ngFor="let b of banks" class="balance-chip">
            <div class="balance-logo">
              <img *ngIf="b.logo" [src]="'assets/images/' + b.logo" [alt]="b.name_fr" class="b-logo">
              <span *ngIf="!b.logo" class="b-logo-text">💵</span>
            </div>
            <div class="balance-info">
              <span class="balance-name">{{ lang === 'ar' ? b.name_ar : b.name_fr }}</span>
              <span class="balance-amount">{{ b.balance | number:'1.0-0' }} <small>{{ 'COMMON.MRU' | translate }}</small></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Nouveau transfert -->
      <div class="card">
        <h2 class="card-title">{{ 'TRANSFERS.ADD' | translate }}</h2>

        <div class="transfer-form">
          <div class="transfer-row">
            <div class="tf-group">
              <label class="tf-label">{{ 'TRANSFERS.FROM' | translate }}</label>
              <app-searchable-select
                [options]="fromBankOptions"
                [value]="transferFrom"
                [placeholder]="'TRANSFERS.FROM_PLACEHOLDER' | translate"
                (valueChange)="transferFrom = $event; transferTo = transferTo == $event ? '' : transferTo">
              </app-searchable-select>
            </div>
            <div class="transfer-arrow">→</div>
            <div class="tf-group">
              <label class="tf-label">{{ 'TRANSFERS.TO' | translate }}</label>
              <app-searchable-select
                [options]="toBankOptions"
                [value]="transferTo"
                [placeholder]="'TRANSFERS.TO_PLACEHOLDER' | translate"
                (valueChange)="transferTo = $event">
              </app-searchable-select>
            </div>
          </div>
          <div class="transfer-row">
            <div class="tf-group">
              <label class="tf-label">{{ 'TRANSFERS.AMOUNT' | translate }}</label>
              <div class="input-addon-wrap">
                <input type="number" class="form-control" [(ngModel)]="transferAmount" min="0.01" step="0.01">
                <span class="addon">{{ 'COMMON.MRU' | translate }}</span>
              </div>
            </div>
            <div class="tf-group">
              <label class="tf-label">{{ 'TRANSFERS.NOTES' | translate }}</label>
              <input type="text" class="form-control" [(ngModel)]="transferNotes">
            </div>
          </div>
          <div *ngIf="transferError" class="alert alert-error">{{ transferError }}</div>
          <div *ngIf="successMsg" class="alert alert-success">{{ 'TRANSFERS.SUCCESS' | translate }}</div>
          <div class="form-actions">
            <button class="btn btn-primary" (click)="doTransfer()" [disabled]="doingTransfer || !transferFrom || !transferTo || !transferAmount">
              {{ doingTransfer ? ('COMMON.LOADING' | translate) : ('COMMON.SAVE' | translate) }}
            </button>
            <button class="btn btn-secondary" (click)="resetForm()">{{ 'COMMON.RESET' | translate }}</button>
          </div>
        </div>
      </div>

      <!-- Historique -->
      <div class="card">
        <h2 class="card-title">{{ 'TRANSFERS.HISTORY' | translate }}</h2>
        <div *ngIf="loadingTransfers" class="loading-state"><div class="spinner"></div></div>
        <div *ngIf="!loadingTransfers" class="transfer-list">

          <!-- Normal row -->
          <ng-container *ngFor="let t of transfers">
            <div *ngIf="editingId !== t.id" class="transfer-row-item">
              <div class="transfer-banks">
                <span class="transfer-bank">
                  <img *ngIf="t.from_bank.logo" [src]="'assets/images/' + t.from_bank.logo" class="t-logo">
                  <span *ngIf="!t.from_bank.logo">💵</span>
                  {{ t.from_bank.name_fr }}
                </span>
                <span class="transfer-arrow-sm">→</span>
                <span class="transfer-bank">
                  <img *ngIf="t.to_bank.logo" [src]="'assets/images/' + t.to_bank.logo" class="t-logo">
                  <span *ngIf="!t.to_bank.logo">💵</span>
                  {{ t.to_bank.name_fr }}
                </span>
              </div>
              <span class="transfer-amount">{{ t.amount | number:'1.0-0' }} {{ 'COMMON.MRU' | translate }}</span>
              <span class="transfer-notes" *ngIf="t.notes">{{ t.notes }}</span>
              <span class="transfer-date">{{ t.created_at | date:'dd/MM/yy HH:mm' }}</span>
              <div class="row-actions">
                <button class="btn-icon" (click)="startEdit(t)" title="{{ 'COMMON.EDIT' | translate }}">✏️</button>
                <button class="btn-icon danger" (click)="confirmDelete(t)" title="{{ 'COMMON.DELETE' | translate }}">🗑️</button>
              </div>
            </div>

            <!-- Edit row -->
            <div *ngIf="editingId === t.id" class="edit-row">
              <div class="edit-selects">
                <div class="tf-group">
                  <label class="tf-label">{{ 'TRANSFERS.FROM' | translate }}</label>
                  <app-searchable-select
                    [options]="fromBankOptions"
                    [value]="editFrom"
                    [placeholder]="'TRANSFERS.FROM_PLACEHOLDER' | translate"
                    (valueChange)="editFrom = $event; editTo = editTo == $event ? '' : editTo">
                  </app-searchable-select>
                </div>
                <div class="transfer-arrow">→</div>
                <div class="tf-group">
                  <label class="tf-label">{{ 'TRANSFERS.TO' | translate }}</label>
                  <app-searchable-select
                    [options]="editToBankOptions"
                    [value]="editTo"
                    [placeholder]="'TRANSFERS.TO_PLACEHOLDER' | translate"
                    (valueChange)="editTo = $event">
                  </app-searchable-select>
                </div>
              </div>
              <div class="edit-fields">
                <div class="tf-group">
                  <label class="tf-label">{{ 'TRANSFERS.AMOUNT' | translate }}</label>
                  <div class="input-addon-wrap">
                    <input type="number" class="form-control" [(ngModel)]="editAmount" min="0.01" step="0.01">
                    <span class="addon">{{ 'COMMON.MRU' | translate }}</span>
                  </div>
                </div>
                <div class="tf-group">
                  <label class="tf-label">{{ 'TRANSFERS.NOTES' | translate }}</label>
                  <input type="text" class="form-control" [(ngModel)]="editNotes">
                </div>
              </div>
              <div *ngIf="editError" class="alert alert-error">{{ editError }}</div>
              <div class="edit-actions">
                <button class="btn btn-primary btn-sm" (click)="saveEdit(t.id)" [disabled]="savingEdit || !editFrom || !editTo || !editAmount">
                  {{ savingEdit ? ('COMMON.LOADING' | translate) : ('COMMON.SAVE' | translate) }}
                </button>
                <button class="btn btn-secondary btn-sm" (click)="editingId = null">
                  {{ 'COMMON.CANCEL' | translate }}
                </button>
              </div>
            </div>
          </ng-container>

          <div *ngIf="transfers.length === 0" class="empty">{{ 'TRANSFERS.NO_DATA' | translate }}</div>
        </div>
      </div>

    </div>

    <app-confirm-dialog
      [visible]="showDeleteDialog"
      type="danger"
      [title]="'COMMON.CONFIRM_DELETE' | translate"
      [message]="'COMMON.CONFIRM_DELETE_MSG' | translate"
      [confirmLabel]="'COMMON.DELETE' | translate"
      iconName="delete"
      (confirmed)="deleteConfirmed()"
      (cancelled)="showDeleteDialog = false">
    </app-confirm-dialog>
  `,
  styles: [`
    .gestion-layout { display: flex; flex-direction: column; gap: 24px; }
    .card { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .card-title { font-size: 16px; font-weight: 700; color: #333; margin: 0 0 20px; }

    /* Balances */
    .balances-grid { display: flex; flex-wrap: wrap; gap: 16px; }
    .balance-chip { display: flex; align-items: center; gap: 12px; padding: 14px 18px; background: #f0f7f0; border-radius: 12px; min-width: 180px; }
    .balance-logo { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .b-logo { width: 40px; height: 40px; object-fit: contain; border-radius: 8px; }
    .b-logo-text { font-size: 24px; }
    .balance-info { display: flex; flex-direction: column; gap: 2px; }
    .balance-name { font-size: 13px; font-weight: 600; color: #555; }
    .balance-amount { font-size: 16px; font-weight: 700; color: #1565C0; }
    .balance-amount small { font-size: 11px; font-weight: 400; color: #888; }

    /* Transfer form */
    .transfer-form { display: flex; flex-direction: column; gap: 14px; }
    .transfer-row { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; }
    .tf-group { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 160px; }
    .tf-label { font-size: 12px; font-weight: 600; color: #666; }
    .transfer-arrow { font-size: 20px; color: #999; padding-bottom: 10px; flex-shrink: 0; }

    .input-addon-wrap { display: flex; align-items: center; }
    .input-addon-wrap .form-control { border-radius: 8px 0 0 8px; flex: 1; }
    .addon { padding: 9px 12px; background: #f5f5f5; border: 1px solid #ddd; border-left: none; border-radius: 0 8px 8px 0; font-size: 13px; white-space: nowrap; }

    .form-control { padding: 9px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; width: 100%; box-sizing: border-box; }
    .form-control:focus { border-color: #2E7D32; }
    .form-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }

    .alert { padding: 9px 14px; border-radius: 8px; font-size: 13px; }
    .alert-error { color: #C62828; background: #FFEBEE; }
    .alert-success { color: #2E7D32; background: #E8F5E9; }

    /* Transfer history */
    .transfer-list { display: flex; flex-direction: column; gap: 6px; }
    .transfer-row-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: #fafafa; border-radius: 10px; }
    .transfer-banks { display: flex; align-items: center; gap: 8px; flex: 1; font-size: 13px; }
    .transfer-bank { display: flex; align-items: center; gap: 6px; font-weight: 500; }
    .t-logo { width: 22px; height: 22px; object-fit: contain; border-radius: 4px; }
    .transfer-arrow-sm { color: #999; font-size: 14px; }
    .transfer-amount { font-weight: 700; color: #1565C0; font-size: 14px; white-space: nowrap; }
    .transfer-notes { font-size: 12px; color: #888; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 160px; }
    .transfer-date { font-size: 12px; color: #aaa; white-space: nowrap; }
    .row-actions { display: flex; gap: 4px; flex-shrink: 0; }

    /* Edit row */
    .edit-row { background: #FFF8E1; border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .edit-selects { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; }
    .edit-fields { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; }
    .edit-actions { display: flex; gap: 8px; }

    .btn { padding: 9px 18px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; font-weight: 600; white-space: nowrap; }
    .btn-sm { padding: 7px 14px; font-size: 13px; }
    .btn-primary { background: #2E7D32; color: #fff; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary { background: #EEE; color: #555; }

    .btn-icon { background: none; border: none; cursor: pointer; font-size: 15px; padding: 4px 6px; border-radius: 6px; }
    .btn-icon:hover { background: #EEEEEE; }
    .btn-icon.danger:hover { background: #FFEBEE; }

    .empty { text-align: center; color: #aaa; padding: 24px; font-size: 14px; }
    .loading-state { display: flex; justify-content: center; padding: 32px; }
    .spinner { width: 28px; height: 28px; border: 3px solid #eee; border-top-color: #2E7D32; border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class GestionComponent implements OnInit {
  banks: Bank[] = [];
  loadingBanks = false;

  transfers: BankTransfer[] = [];
  loadingTransfers = false;

  // New transfer form
  transferFrom: number | string | null = null;
  transferTo: number | string | null = null;
  transferAmount: number | null = null;
  transferNotes = '';
  transferError = '';
  successMsg = false;
  doingTransfer = false;

  // Edit transfer
  editingId: number | null = null;
  editFrom: number | string | null = null;
  editTo: number | string | null = null;
  editAmount: number | null = null;
  editNotes = '';
  editError = '';
  savingEdit = false;

  // Delete dialog
  showDeleteDialog = false;
  private pendingDeleteId: number | null = null;

  get lang(): string { return this.translate.currentLang || 'fr'; }

  constructor(
    private bankService: BankService,
    private transferService: BankTransferService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadBanks();
    this.loadTransfers();
  }

  private bankLabel(b: { name_fr: string; name_ar: string }): string {
    return this.lang === 'ar' ? b.name_ar : b.name_fr;
  }

  get fromBankOptions(): SelectOption[] {
    return this.banks.map(b => ({
      id: b.id,
      label: this.bankLabel(b),
      sublabel: `${b.balance.toLocaleString('fr-FR')} ${this.translate.instant('COMMON.MRU')}`
    }));
  }

  get toBankOptions(): SelectOption[] {
    return this.banks
      .filter(b => b.id !== +(this.transferFrom ?? 0))
      .map(b => ({
        id: b.id,
        label: this.bankLabel(b),
        sublabel: `${b.balance.toLocaleString('fr-FR')} ${this.translate.instant('COMMON.MRU')}`
      }));
  }

  get editToBankOptions(): SelectOption[] {
    return this.banks
      .filter(b => b.id !== +(this.editFrom ?? 0))
      .map(b => ({
        id: b.id,
        label: this.bankLabel(b),
        sublabel: `${b.balance.toLocaleString('fr-FR')} ${this.translate.instant('COMMON.MRU')}`
      }));
  }

  loadBanks(): void {
    this.loadingBanks = true;
    this.bankService.getAll().subscribe({
      next: res => { this.banks = res.data; this.loadingBanks = false; },
      error: () => { this.loadingBanks = false; }
    });
  }

  loadTransfers(): void {
    this.loadingTransfers = true;
    this.transferService.getAll().subscribe({
      next: res => { this.transfers = res.data?.data ?? []; this.loadingTransfers = false; },
      error: () => { this.loadingTransfers = false; }
    });
  }

  doTransfer(): void {
    this.transferError = '';
    this.successMsg = false;
    if (!this.transferFrom || !this.transferTo || !this.transferAmount) return;
    this.doingTransfer = true;
    this.transferService.create({
      from_bank_id: +(this.transferFrom!),
      to_bank_id:   +(this.transferTo!),
      amount:       this.transferAmount,
      notes:        this.transferNotes || undefined
    }).subscribe({
      next: () => {
        this.doingTransfer = false;
        this.successMsg = true;
        this.resetForm();
        this.loadBanks();
        this.loadTransfers();
        setTimeout(() => this.successMsg = false, 3000);
      },
      error: (err) => {
        this.doingTransfer = false;
        this.transferError = err?.error?.message || 'COMMON.ERROR_GENERIC';
      }
    });
  }

  resetForm(): void {
    this.transferFrom = null;
    this.transferTo = null;
    this.transferAmount = null;
    this.transferNotes = '';
    this.transferError = '';
  }

  startEdit(t: BankTransfer): void {
    this.editingId  = t.id;
    this.editFrom   = t.from_bank.id as number;
    this.editTo     = t.to_bank.id as number;
    this.editAmount = t.amount;
    this.editNotes  = t.notes ?? '';
    this.editError  = '';
  }

  saveEdit(id: number): void {
    if (!this.editFrom || !this.editTo || !this.editAmount) return;
    this.savingEdit = true;
    this.editError = '';
    this.transferService.update(id, {
      from_bank_id: +(this.editFrom!),
      to_bank_id:   +(this.editTo!),
      amount:       this.editAmount,
      notes:        this.editNotes || undefined
    }).subscribe({
      next: res => {
        const idx = this.transfers.findIndex(t => t.id === id);
        if (idx !== -1) this.transfers[idx] = res.data;
        this.editingId = null;
        this.savingEdit = false;
        this.loadBanks();
      },
      error: (err) => {
        this.savingEdit = false;
        this.editError = err?.error?.message || 'COMMON.ERROR_GENERIC';
      }
    });
  }

  confirmDelete(t: BankTransfer): void {
    this.pendingDeleteId = t.id;
    this.showDeleteDialog = true;
  }

  deleteConfirmed(): void {
    if (!this.pendingDeleteId) return;
    const id = this.pendingDeleteId;
    this.transferService.delete(id).subscribe({
      next: () => {
        this.transfers = this.transfers.filter(t => t.id !== id);
        this.showDeleteDialog = false;
        this.pendingDeleteId = null;
        this.loadBanks();
      },
      error: () => { this.showDeleteDialog = false; }
    });
  }
}
