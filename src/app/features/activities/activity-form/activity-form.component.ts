import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivityService } from '../../../core/services/activity.service';
import { ActivityItem } from '../../../core/models/activity.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { SearchableSelectComponent, SelectOption } from '../../../shared/components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-activity-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, TranslateModule, PageHeaderComponent, SearchableSelectComponent],
  template: `
    <app-page-header [title]="isEdit ? ('ACTIVITIES.EDIT' | translate) : ('ACTIVITIES.ADD' | translate)" backLink="/activities"></app-page-header>
    <div class="form-card">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="form-grid">
          <div class="form-group">
            <label>{{ 'ACTIVITIES.TITLE_FR' | translate }} *</label>
            <input type="text" formControlName="title_fr" class="form-control" [class.error]="hasError('title_fr')">
          </div>
          <div class="form-group">
            <label>{{ 'ACTIVITIES.TITLE_AR' | translate }} *</label>
            <input type="text" formControlName="title_ar" class="form-control" dir="rtl" [class.error]="hasError('title_ar')">
          </div>
          <div class="form-group">
            <label>{{ 'ACTIVITIES.TYPE' | translate }} *</label>
            <app-searchable-select [options]="activityTypeOptions" [value]="selectedActivityType"
              [placeholder]="'— ' + ('ACTIVITIES.TYPE' | translate) + ' —'"
              (valueChange)="onActivityTypeSelect($event)">
            </app-searchable-select>
          </div>
          <div class="form-group">
            <label>{{ 'ACTIVITIES.BENEFICIARY_TYPE' | translate }} *</label>
            <app-searchable-select [options]="beneficiaryTypeOptions" [value]="selectedBeneficiaryType"
              [placeholder]="'— ' + ('ACTIVITIES.BENEFICIARY_TYPE' | translate) + ' —'"
              (valueChange)="onBeneficiaryTypeSelect($event)">
            </app-searchable-select>
          </div>
          <div class="form-group">
            <label>{{ 'COMMON.DATE' | translate }} *</label>
            <input type="date" formControlName="activity_date" class="form-control" [class.error]="hasError('activity_date')">
          </div>
          <div class="form-group">
            <label>{{ 'ACTIVITIES.PAYMENT_TYPE' | translate }} *</label>
            <app-searchable-select [options]="paymentTypeOptions" [value]="selectedPaymentType"
              [placeholder]="'— ' + ('ACTIVITIES.PAYMENT_TYPE' | translate) + ' —'"
              (valueChange)="onPaymentTypeSelect($event)">
            </app-searchable-select>
          </div>
          <div class="form-group full-width">
            <label>{{ 'ACTIVITIES.DESCRIPTION' | translate }}</label>
            <textarea formControlName="description_fr" class="form-control" rows="3"></textarea>
          </div>
        </div>

        <!-- In-kind items list -->
        <div *ngIf="selectedPaymentType === 'in_kind'" class="items-section">
          <div class="section-header">
            <h4 class="section-title">{{ 'ACTIVITIES.ITEMS' | translate }}</h4>
            <button type="button" class="btn-add-item" (click)="addItemRow()">+ {{ 'ACTIVITIES.ADD_ITEM' | translate }}</button>
          </div>
          <div *ngIf="itemRows.length > 0" class="items-table">
            <div class="items-header">
              <span>{{ 'ACTIVITIES.ITEM_NAME' | translate }}</span>
              <span>{{ 'ACTIVITIES.ITEM_QTY' | translate }}</span>
              <span>{{ 'ACTIVITIES.ITEM_UNIT_VALUE' | translate }}</span>
              <span>{{ 'ACTIVITIES.ITEM_TOTAL' | translate }}</span>
              <span></span>
            </div>
            <div *ngFor="let row of itemRows; let i = index" class="item-row">
              <input type="text" class="form-control" [(ngModel)]="row.name" [ngModelOptions]="{standalone: true}" [placeholder]="'ACTIVITIES.ITEM_NAME' | translate">
              <input type="number" class="form-control num-input" [(ngModel)]="row.quantity" [ngModelOptions]="{standalone: true}" min="0.01" step="0.01">
              <div class="input-addon-wrap">
                <input type="number" class="form-control num-input" [(ngModel)]="row.unit_value" [ngModelOptions]="{standalone: true}" min="0">
                <span class="addon">{{ 'COMMON.MRU' | translate }}</span>
              </div>
              <span class="item-subtotal">{{ (row.quantity * row.unit_value) | number:'1.0-0' }} {{ 'COMMON.MRU' | translate }}</span>
              <button type="button" class="remove-item" (click)="removeItemRow(i)">✕</button>
            </div>
            <div class="items-total">
              <span>{{ 'COMMON.TOTAL' | translate }}</span>
              <span class="total-value">{{ itemsTotal | number:'1.0-0' }} {{ 'COMMON.MRU' | translate }}</span>
            </div>
          </div>
        </div>

        <!-- Photos upload -->
        <div class="photos-section">
          <h4 class="section-title">{{ 'ACTIVITIES.PHOTOS' | translate }}</h4>
          <div class="photos-grid">
            <div *ngFor="let p of photosPreviews; let i = index" class="photo-preview">
              <img [src]="p" alt="photo">
              <button type="button" class="remove-photo" (click)="removePhoto(i)">✕</button>
            </div>
            <label class="add-photo-btn">
              <input type="file" accept="image/*" multiple hidden (change)="onPhotosSelected($event)">
              <span>+ {{ 'ACTIVITIES.ADD_PHOTOS' | translate }}</span>
            </label>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="saving">
            <span *ngIf="saving" class="spinner-sm"></span>
            {{ saving ? ('COMMON.LOADING' | translate) : ('COMMON.SAVE' | translate) }}
          </button>
          <button type="button" class="btn btn-secondary" routerLink="/activities">{{ 'COMMON.CANCEL' | translate }}</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-card { background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group.full-width { grid-column: 1/-1; }
    .form-group label { font-weight: 600; color: #555; font-size: 14px; }
    .form-control { padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; }
    .form-control:focus { border-color: #7B1FA2; }
    .form-control.error { border-color: #C62828; }
    .section-title { font-size: 15px; font-weight: 700; color: #444; margin: 24px 0 12px; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin: 24px 0 12px; }
    .section-header .section-title { margin: 0; }

    /* Payment method */
    .payment-section { margin-top: 24px; }
    .payment-methods { display: flex; gap: 12px; flex-wrap: wrap; }
    .method-card { display: flex; flex-direction: column; align-items: center; gap: 8px; border: 2px solid #e0e0e0; border-radius: 12px; padding: 14px 18px; cursor: pointer; min-width: 90px; transition: all .2s; }
    .method-card.selected { border-color: #7B1FA2; background: #F3E5F5; }
    .bank-logo { width: 44px; height: 44px; object-fit: contain; border-radius: 8px; }
    .cash-icon { font-size: 28px; }
    .method-label { font-size: 12px; font-weight: 600; color: #444; }

    /* Items */
    .items-section { margin-top: 8px; }
    .btn-add-item { background: none; border: 1.5px dashed #7B1FA2; color: #7B1FA2; border-radius: 8px; padding: 6px 14px; cursor: pointer; font-size: 13px; font-weight: 600; }
    .items-table { border: 1px solid #eee; border-radius: 10px; overflow: hidden; }
    .items-header { display: grid; grid-template-columns: 2fr 1fr 1.5fr 1fr 32px; gap: 8px; padding: 10px 12px; background: #f5f5f5; font-size: 12px; font-weight: 700; color: #666; }
    .item-row { display: grid; grid-template-columns: 2fr 1fr 1.5fr 1fr 32px; gap: 8px; padding: 8px 12px; border-top: 1px solid #f0f0f0; align-items: center; }
    .num-input { text-align: right; }
    .input-addon-wrap { display: flex; }
    .input-addon-wrap .form-control { border-radius: 8px 0 0 8px; flex: 1; }
    .addon { padding: 10px 8px; background: #f5f5f5; border: 1px solid #ddd; border-left: none; border-radius: 0 8px 8px 0; font-size: 12px; white-space: nowrap; }
    .item-subtotal { font-weight: 700; color: #7B1FA2; font-size: 13px; text-align: right; }
    .remove-item { background: none; border: none; color: #bbb; cursor: pointer; font-size: 14px; padding: 0; }
    .remove-item:hover { color: #C62828; }
    .items-total { display: flex; justify-content: space-between; padding: 10px 12px; background: #F3E5F5; border-top: 1px solid #e0d5f0; font-weight: 700; font-size: 14px; }
    .total-value { color: #7B1FA2; }

    /* Photos */
    .photos-section { margin-top: 24px; }
    .photos-grid { display: flex; flex-wrap: wrap; gap: 12px; }
    .photo-preview { position: relative; width: 100px; height: 100px; border-radius: 10px; overflow: hidden; }
    .photo-preview img { width: 100%; height: 100%; object-fit: cover; }
    .remove-photo { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.5); color: #fff; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 10px; display: flex; align-items: center; justify-content: center; }
    .add-photo-btn { width: 100px; height: 100px; border: 2px dashed #ccc; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; color: #999; text-align: center; transition: border-color 0.2s; }
    .add-photo-btn:hover { border-color: #7B1FA2; color: #7B1FA2; }
    .form-actions { display: flex; gap: 12px; margin-top: 28px; }
    .btn { padding: 12px 28px; border-radius: 8px; border: none; cursor: pointer; font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
    .btn-primary { background: #7B1FA2; color: #fff; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary { background: #eee; color: #555; }
    .spinner-sm { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    textarea.form-control { resize: vertical; }
    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } .items-header, .item-row { grid-template-columns: 1fr; } }
  `]
})
export class ActivityFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  saving = false;
  activityId: number | null = null;
  photoFiles: File[] = [];
  photosPreviews: string[] = [];
  itemRows: { name: string; quantity: number; unit_value: number }[] = [];

  activityTypeOptions: SelectOption[] = [];
  beneficiaryTypeOptions: SelectOption[] = [];
  paymentTypeOptions: SelectOption[] = [];
  selectedActivityType: string = 'other';
  selectedBeneficiaryType: string = 'general';
  selectedPaymentType: string = 'financial';

  get itemsTotal(): number {
    return this.itemRows.reduce((s, r) => s + (r.quantity || 0) * (r.unit_value || 0), 0);
  }

  constructor(
    private fb: FormBuilder,
    private service: ActivityService,
    private translate: TranslateService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      title_fr:         ['', Validators.required],
      title_ar:         ['', Validators.required],
      activity_type:    ['other', Validators.required],
      beneficiary_type: ['general', Validators.required],
      activity_date:    [new Date().toISOString().split('T')[0], Validators.required],
      description_fr:   [''],
      description_ar:   ['']
    });

    this.activityTypeOptions = [
      { id: 'school_fees',    label: this.translate.instant('ACTIVITIES.TYPE_SCHOOL_FEES') },
      { id: 'eid_help',       label: this.translate.instant('ACTIVITIES.TYPE_EID') },
      { id: 'food_basket',    label: this.translate.instant('ACTIVITIES.TYPE_FOOD') },
      { id: 'winter_clothes', label: this.translate.instant('ACTIVITIES.TYPE_CLOTHES') },
      { id: 'ramadan',        label: this.translate.instant('ACTIVITIES.TYPE_RAMADAN') },
      { id: 'other',          label: this.translate.instant('ACTIVITIES.TYPE_OTHER') }
    ];

    this.beneficiaryTypeOptions = [
      { id: 'orphans',  label: this.translate.instant('MENU.ORPHANS') },
      { id: 'families', label: this.translate.instant('MENU.FAMILIES') },
      { id: 'general',  label: this.translate.instant('ACTIVITIES.BENEFICIARY_GENERAL') }
    ];

    this.paymentTypeOptions = [
      { id: 'financial', label: this.translate.instant('ACTIVITIES.PAYMENT_FINANCIAL') },
      { id: 'in_kind',   label: this.translate.instant('ACTIVITIES.PAYMENT_IN_KIND') }
    ];

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.activityId = +id;
      this.service.getById(+id).subscribe(res => {
        const d = res.data as any;
        this.selectedActivityType    = d.activity_type || d.type || 'other';
        this.selectedBeneficiaryType = d.beneficiary_type || 'general';
        this.selectedPaymentType     = d.payment_type || 'financial';
        this.form.patchValue({
          title_fr:         d.title_fr || d.title || '',
          title_ar:         d.title_ar || '',
          activity_type:    this.selectedActivityType,
          beneficiary_type: this.selectedBeneficiaryType,
          activity_date:    d.activity_date || '',
          description_fr:   d.description_fr || d.description || '',
          description_ar:   d.description_ar || ''
        });
        if (d.items?.length) {
          this.itemRows = d.items.map((i: any) => ({ name: i.name, quantity: i.quantity, unit_value: i.unit_value }));
        }
      });
    }
  }

  hasError(f: string): boolean { const c = this.form.get(f); return !!(c?.invalid && c?.touched); }

  onActivityTypeSelect(val: number | string | null): void {
    this.selectedActivityType = (val as string) || 'other';
    this.form.get('activity_type')!.setValue(this.selectedActivityType);
  }

  onBeneficiaryTypeSelect(val: number | string | null): void {
    this.selectedBeneficiaryType = (val as string) || 'general';
    this.form.get('beneficiary_type')!.setValue(this.selectedBeneficiaryType);
  }

  onPaymentTypeSelect(val: number | string | null): void {
    this.selectedPaymentType = (val as string) || 'financial';
  }

  addItemRow(): void { this.itemRows.push({ name: '', quantity: 1, unit_value: 0 }); }
  removeItemRow(i: number): void { this.itemRows.splice(i, 1); }

  onPhotosSelected(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files || []);
    files.forEach(file => {
      this.photoFiles.push(file);
      const reader = new FileReader();
      reader.onload = e => this.photosPreviews.push(e.target?.result as string);
      reader.readAsDataURL(file);
    });
    (event.target as HTMLInputElement).value = '';
  }

  removePhoto(i: number): void { this.photoFiles.splice(i, 1); this.photosPreviews.splice(i, 1); }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;

    const fd = new FormData();
    Object.entries(this.form.value).forEach(([k, val]) => {
      if (val !== null && val !== undefined && val !== '') fd.append(k, String(val));
    });
    fd.append('payment_type', this.selectedPaymentType);

    const req = this.isEdit ? this.service.update(this.activityId!, fd) : this.service.create(fd);
    req.subscribe({
      next: res => {
        const actId = res.data.id;
        const afterSave = () => {
          if (this.photoFiles.length > 0) {
            const photoFd = new FormData();
            this.photoFiles.forEach((f, i) => photoFd.append(`photos[${i}]`, f));
            this.service.addPhoto(actId, photoFd).subscribe({
              next: () => { this.saving = false; this.router.navigate(['/activities', actId]); },
              error: () => { this.saving = false; this.router.navigate(['/activities', actId]); }
            });
          } else {
            this.saving = false;
            this.router.navigate(['/activities', actId]);
          }
        };

        // Save in-kind items if any
        if (this.selectedPaymentType === 'in_kind' && this.itemRows.length > 0) {
          const validItems = this.itemRows.filter(r => r.name.trim());
          if (validItems.length > 0) {
            this.service.addItems(actId, validItems).subscribe({ next: afterSave, error: afterSave });
          } else { afterSave(); }
        } else { afterSave(); }
      },
      error: () => { this.saving = false; }
    });
  }
}
