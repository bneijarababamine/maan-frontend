import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

export interface InsufficientBalanceData {
  bank_fr: string;
  bank_ar: string;
  available: number;
  required: number;
}

@Component({
  selector: 'app-insufficient-balance-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="overlay" *ngIf="visible" (click)="close.emit()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-icon">⚠️</div>
        <h2 class="modal-title">{{ 'ERRORS.INSUFFICIENT_BALANCE_TITLE' | translate }}</h2>
        <p class="modal-msg" [innerHTML]="message"></p>
        <div class="amounts-row">
          <div class="amount-box available">
            <div class="amount-label">{{ 'ERRORS.AVAILABLE' | translate }}</div>
            <div class="amount-val">{{ data?.available | number:'1.0-0' }} <small>MRU</small></div>
          </div>
          <div class="amount-box required">
            <div class="amount-label">{{ 'ERRORS.REQUIRED' | translate }}</div>
            <div class="amount-val">{{ data?.required | number:'1.0-0' }} <small>MRU</small></div>
          </div>
        </div>
        <button class="btn-close" (click)="close.emit()">{{ 'ERRORS.CLOSE' | translate }}</button>
      </div>
    </div>
  `,
  styles: [`
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .modal { background: #fff; border-radius: 18px; padding: 32px 28px; max-width: 380px; width: 90%; text-align: center; box-shadow: 0 8px 40px rgba(0,0,0,.18); }
    .modal-icon { font-size: 40px; margin-bottom: 12px; }
    .modal-title { font-size: 18px; font-weight: 800; color: #C62828; margin: 0 0 10px; }
    .modal-msg { font-size: 14px; color: #555; margin: 0 0 20px; line-height: 1.6; }
    .modal-msg strong { color: #1565C0; }
    .amounts-row { display: flex; gap: 12px; margin-bottom: 24px; }
    .amount-box { flex: 1; border-radius: 10px; padding: 12px 8px; }
    .amount-box.available { background: #E8F5E9; }
    .amount-box.required  { background: #FFEBEE; }
    .amount-label { font-size: 11px; color: #777; margin-bottom: 4px; }
    .amount-val { font-size: 18px; font-weight: 800; }
    .amount-box.available .amount-val { color: #2E7D32; }
    .amount-box.required  .amount-val { color: #C62828; }
    .amount-val small { font-size: 11px; font-weight: 400; }
    .btn-close { background: #2E7D32; color: #fff; border: none; border-radius: 8px; padding: 11px 32px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; }
    .btn-close:hover { background: #1b5e20; }
  `]
})
export class InsufficientBalanceModalComponent {
  @Input() visible = false;
  @Input() data: InsufficientBalanceData | null = null;
  @Input() lang = 'fr';
  @Output() close = new EventEmitter<void>();

  get message(): string {
    if (!this.data) return '';
    const bank = this.lang === 'ar' ? this.data.bank_ar : this.data.bank_fr;
    const tpl = this.lang === 'ar'
      ? `رصيد حساب <strong>${bank}</strong> غير كافٍ لإتمام هذه العملية.`
      : `Le solde du compte <strong>${bank}</strong> est insuffisant pour cette opération.`;
    return tpl;
  }
}
