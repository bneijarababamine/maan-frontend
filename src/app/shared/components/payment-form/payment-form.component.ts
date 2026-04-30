import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BankService } from '../../../core/services/bank.service';
import { Bank } from '../../../core/models/bank.model';

export interface PaymentData {
  payment_method: string;
  transaction_ref?: string;
  screenshots: File[];
  keepPublicIds: string[];
}

export interface ExistingScreenshot {
  url: string;
  public_id: string;
}

interface MethodOption {
  value: string;
  label_fr: string;
  label_ar: string;
  logo?: string;
  isCash: boolean;
}

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="payment-section">
      <div class="form-group">
        <label class="form-label">{{ 'CONTRIBUTIONS.PAYMENT_METHOD' | translate }}</label>
        <div class="payment-methods">
          <label *ngFor="let b of banks" class="method-card" [class.selected]="data.payment_method === b.value">
            <input type="radio" [value]="b.value" [(ngModel)]="data.payment_method"
                   (change)="onMethodChange()" hidden>
            <img *ngIf="b.logo" [src]="'assets/images/' + b.logo" [alt]="b.label_fr" class="bank-logo">
            <span *ngIf="!b.logo" class="cash-icon">💵</span>
            <span class="method-label">{{ currentLang === 'ar' ? b.label_ar : b.label_fr }}</span>
          </label>
        </div>
      </div>

      <div *ngIf="data.payment_method !== 'cash'" class="online-fields">
        <div class="form-group">
          <label class="form-label">{{ 'CONTRIBUTIONS.TRANSACTION_REF' | translate }}</label>
          <input type="text" class="form-control" [(ngModel)]="data.transaction_ref"
                 [placeholder]="'CONTRIBUTIONS.TRANSACTION_REF' | translate">
        </div>

        <div class="form-group">
          <label class="form-label">{{ 'CONTRIBUTIONS.SCREENSHOT' | translate }}</label>

          <div *ngIf="keptScreenshots.length > 0 || newPreviews.length > 0" class="screenshots-preview">
            <div *ngFor="let s of keptScreenshots; let i = index" class="thumb-wrap existing">
              <img [src]="s.url" alt="reçu">
              <button type="button" class="thumb-remove" (click)="removeExisting(i)">✕</button>
              <span class="thumb-badge">{{ 'COMMON.RECEIPT_EXISTING' | translate }}</span>
            </div>
            <div *ngFor="let p of newPreviews; let i = index" class="thumb-wrap new">
              <img [src]="p" alt="nouveau">
              <button type="button" class="thumb-remove" (click)="removeNew(i)">✕</button>
              <span class="thumb-badge new-badge">{{ 'COMMON.RECEIPT_NEW' | translate }}</span>
            </div>
          </div>

          <label class="add-files-btn">
            <input type="file" accept="image/*" multiple hidden (change)="onFilesSelected($event)">
            <span class="ms-icon">add_photo_alternate</span>
            {{ 'CONTRIBUTIONS.ADD_SCREENSHOTS' | translate }}
          </label>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .payment-methods { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 8px; }
    .method-card {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      border: 2px solid #e0e0e0; border-radius: 12px;
      padding: 14px 18px; cursor: pointer; transition: all 0.2s; min-width: 90px;
    }
    .method-card.selected { border-color: #2E7D32; background: #e8f5e9; }
    .method-card:hover:not(.selected) { border-color: #bdbdbd; background: #fafafa; }
    .cash-icon { font-size: 28px; line-height: 1; }
    .bank-logo { width: 48px; height: 48px; object-fit: contain; border-radius: 8px; }
    .method-label { font-size: 12px; font-weight: 600; color: #444; }
    .online-fields { margin-top: 16px; padding: 16px; background: #fafafa; border-radius: 10px; }
    .form-group { margin-bottom: 16px; }
    .form-label { display: block; font-weight: 500; color: #555; margin-bottom: 6px; font-size: 14px; }
    .form-control {
      width: 100%; padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px;
      font-size: 14px; outline: none; box-sizing: border-box;
    }
    .form-control:focus { border-color: #2E7D32; }
    .screenshots-preview { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
    .thumb-wrap { position: relative; width: 90px; height: 90px; border-radius: 8px; overflow: hidden; border: 2px solid #ddd; }
    .thumb-wrap.existing { border-color: #A5D6A7; }
    .thumb-wrap.new { border-color: #90CAF9; }
    .thumb-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .thumb-remove {
      position: absolute; top: 3px; right: 3px; width: 20px; height: 20px;
      background: rgba(0,0,0,0.6); color: #fff; border: none; border-radius: 50%;
      cursor: pointer; font-size: 11px; display: flex; align-items: center; justify-content: center; padding: 0;
    }
    .thumb-badge {
      position: absolute; bottom: 0; left: 0; right: 0;
      background: rgba(165,214,167,0.9); color: #1b5e20; font-size: 9px; font-weight: 700;
      text-align: center; padding: 2px 0; text-transform: uppercase;
    }
    .new-badge { background: rgba(144,202,249,0.9); color: #0d47a1; }
    .add-files-btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 16px; border: 2px dashed #bbb; border-radius: 8px;
      cursor: pointer; font-size: 13px; font-weight: 500; color: #555; transition: all .15s;
    }
    .add-files-btn:hover { border-color: #2E7D32; color: #2E7D32; background: #f1f8e9; }
    .ms-icon { font-family: 'Material Symbols Outlined'; font-size: 20px; }
  `]
})
export class PaymentFormComponent implements OnInit {
  @Input() initialData?: Partial<PaymentData>;
  @Input() existingScreenshots: ExistingScreenshot[] = [];
  @Output() dataChange = new EventEmitter<PaymentData>();

  data: PaymentData = { payment_method: 'cash', screenshots: [], keepPublicIds: [] };
  keptScreenshots: ExistingScreenshot[] = [];
  newPreviews: string[] = [];
  banks: MethodOption[] = [];

  get currentLang(): string { return this.translate.currentLang || 'fr'; }

  constructor(private bankService: BankService, private translate: TranslateService) {}

  ngOnInit(): void {
    if (this.initialData) {
      this.data = { ...this.data, ...this.initialData, screenshots: [], keepPublicIds: [] };
    }
    this.keptScreenshots = [...this.existingScreenshots];
    this.data.keepPublicIds = this.keptScreenshots.map(s => s.public_id);

    this.bankService.getAll().subscribe({
      next: res => {
        this.banks = res.data
          .filter((b: Bank) => b.is_active)
          .map((b: Bank) => ({
            value:    b.name_fr.toLowerCase(),
            label_fr: b.name_fr,
            label_ar: b.name_ar,
            logo:     b.logo,
            isCash:   b.name_fr.toLowerCase() === 'cash'
          }));
      }
    });
  }

  onMethodChange(): void {
    if (this.data.payment_method === 'cash') {
      this.data.transaction_ref = undefined;
      this.data.screenshots = [];
      this.newPreviews = [];
    }
    this.emit();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    Array.from(input.files).forEach(file => {
      this.data.screenshots.push(file);
      const reader = new FileReader();
      reader.onload = e => this.newPreviews.push(e.target!.result as string);
      reader.readAsDataURL(file);
    });
    input.value = '';
    this.emit();
  }

  removeExisting(index: number): void {
    this.keptScreenshots.splice(index, 1);
    this.data.keepPublicIds = this.keptScreenshots.map(s => s.public_id);
    this.emit();
  }

  removeNew(index: number): void {
    this.data.screenshots.splice(index, 1);
    this.newPreviews.splice(index, 1);
    this.emit();
  }

  private emit(): void { this.dataChange.emit({ ...this.data }); }

  getData(): PaymentData { return this.data; }
}
