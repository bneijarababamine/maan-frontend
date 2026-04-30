import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="overlay" *ngIf="visible" (click)="onCancel()">
      <div class="dialog" (click)="$event.stopPropagation()">

        <div class="dialog-top">
          <h3 class="dialog-title">{{ title }}</h3>
          <button class="close-btn" (click)="onCancel()">
            <span class="ms-icon">close</span>
          </button>
        </div>

        <div class="dialog-body">
          <div class="icon-wrap" [class]="type">
            <span class="ms-icon lg">{{ iconName }}</span>
          </div>
          <p class="dialog-msg">{{ message }}</p>
        </div>

        <div class="dialog-footer">
          <button class="btn-cancel" (click)="onCancel()">{{ 'COMMON.CANCEL' | translate }}</button>
          <button class="btn-confirm" [class]="type" (click)="onConfirm()">
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.40);
      display: flex; align-items: center; justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.15s ease;
    }
    @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }

    .dialog {
      background: #fff;
      border-radius: 12px;
      width: 380px;
      max-width: 92vw;
      box-shadow: 0 8px 40px rgba(0,0,0,0.18);
      overflow: hidden;
      animation: slideUp 0.18s ease;
    }
    @keyframes slideUp {
      from { transform:translateY(16px); opacity:0 }
      to   { transform:translateY(0);    opacity:1 }
    }

    .dialog-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #F5F5F5;
    }
    .dialog-title {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #212121;
    }
    .close-btn {
      width: 28px; height: 28px;
      border-radius: 50%;
      background: #F5F5F5;
      border: none;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #757575;
      transition: background 0.15s;
    }
    .close-btn:hover { background: #EEEEEE; }

    .dialog-body {
      padding: 24px 20px 16px;
      text-align: center;
    }
    .icon-wrap {
      width: 56px; height: 56px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 14px;
    }
    .icon-wrap.danger  { background: #FFEBEE; }
    .icon-wrap.warning { background: #FFF8E1; }
    .icon-wrap.info    { background: #E3F2FD; }

    .dialog-msg {
      margin: 0;
      font-size: 13px;
      color: #757575;
      line-height: 1.6;
    }

    .dialog-footer {
      display: flex;
      gap: 10px;
      padding: 16px 20px;
      border-top: 1px solid #F5F5F5;
      justify-content: flex-end;
    }

    .btn-cancel {
      padding: 9px 20px;
      border-radius: 8px;
      border: 1px solid #E0E0E0;
      background: #fff;
      color: #424242;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.15s;
    }
    .btn-cancel:hover { background: #F5F5F5; }

    .btn-confirm {
      padding: 9px 20px;
      border-radius: 8px;
      border: none;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: opacity 0.15s;
      display: flex; align-items: center; gap: 6px;
    }
    .btn-confirm:hover { opacity: 0.88; }
    .btn-confirm.danger  { background: #C62828; color: #fff; }
    .btn-confirm.warning { background: #F57F17; color: #fff; }
    .btn-confirm.info    { background: #1565C0; color: #fff; }

    .ms-icon {
      font-family: 'Material Symbols Outlined';
      font-style: normal; font-weight: normal;
      font-variation-settings: 'FILL' 1, 'wght' 400;
      display: inline-block;
      font-size: 18px; line-height: 1;
    }
    .ms-icon.lg { font-size: 28px; }
    .danger  .ms-icon { color: #C62828; }
    .warning .ms-icon { color: #F57F17; }
    .info    .ms-icon { color: #1565C0; }
  `]
})
export class ConfirmDialogComponent {
  @Input() visible = false;
  @Input() type: 'danger' | 'warning' | 'info' = 'danger';
  @Input() title = 'Confirmer';
  @Input() message = 'Êtes-vous sûr de vouloir continuer ?';
  @Input() confirmLabel = 'Confirmer';
  @Input() iconName = 'delete';

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void { this.confirmed.emit(); }
  onCancel(): void  { this.cancelled.emit(); }
}
