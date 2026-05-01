import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DonorService } from '../../../core/services/donor.service';
import { WilayaService, Wilaya } from '../../../core/services/wilaya.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { SearchableSelectComponent, SelectOption } from '../../../shared/components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-donor-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule, PageHeaderComponent, SearchableSelectComponent],
  template: `
    <app-page-header [title]="isEdit ? ('DONORS.EDIT' | translate) : ('DONORS.ADD' | translate)" backLink="/donors"></app-page-header>
    <div class="form-card">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="form-grid">
          <div class="form-group">
            <label>{{ 'DONORS.FULL_NAME' | translate }} *</label>
            <input type="text" formControlName="full_name" class="form-control" [class.error]="hasError('full_name')">
          </div>
          <div class="form-group">
            <label>{{ 'DONORS.PHONE' | translate }} *</label>
            <input type="tel" formControlName="phone" class="form-control" [class.error]="hasError('phone')">
          </div>
          <div class="form-group">
            <label>{{ 'DONORS.GENDER' | translate }}</label>
            <div class="gender-toggle">
              <button type="button" class="gender-btn"
                      [class.active-male]="form.value.gender === 'male'"
                      (click)="form.get('gender')!.setValue(form.value.gender === 'male' ? null : 'male')">
                ♂ {{ 'DONORS.MALE' | translate }}
              </button>
              <button type="button" class="gender-btn"
                      [class.active-female]="form.value.gender === 'female'"
                      (click)="form.get('gender')!.setValue(form.value.gender === 'female' ? null : 'female')">
                ♀ {{ 'DONORS.FEMALE' | translate }}
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>{{ 'DONORS.TYPE' | translate }} *</label>
            <app-searchable-select
              [options]="typeOptions"
              [value]="selectedType"
              [placeholder]="'— ' + ('DONORS.TYPE' | translate) + ' —'"
              (valueChange)="onTypeSelect($event)">
            </app-searchable-select>
          </div>
          <div class="form-group">
            <label>{{ 'DONORS.ADDRESS' | translate }}</label>
            <app-searchable-select
              [options]="wilayaOptions"
              [value]="selectedAddress"
              [placeholder]="'— ' + ('DONORS.ADDRESS' | translate) + ' —'"
              (valueChange)="onAddressSelect($event)">
            </app-searchable-select>
          </div>
          <div class="form-group full-width">
            <label>{{ 'COMMON.NOTES' | translate }}</label>
            <textarea formControlName="notes" class="form-control" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="is_active">
              {{ 'COMMON.ACTIVE' | translate }}
            </label>
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="saving">
            {{ saving ? ('COMMON.LOADING' | translate) : ('COMMON.SAVE' | translate) }}
          </button>
          <button type="button" class="btn btn-secondary" routerLink="/donors">{{ 'COMMON.CANCEL' | translate }}</button>
        </div>
      </form>
    </div>

    <div class="modal-overlay" *ngIf="showPhoneExistsModal" (click)="showPhoneExistsModal = false">
      <div class="modal-box" (click)="$event.stopPropagation()">
        <div class="modal-icon">📵</div>
        <h3>{{ 'COMMON.PHONE_EXISTS_TITLE' | translate }}</h3>
        <p>{{ 'COMMON.PHONE_EXISTS_MSG' | translate }}</p>
        <button class="btn-close-modal" (click)="showPhoneExistsModal = false">{{ 'COMMON.CLOSE' | translate }}</button>
      </div>
    </div>
  `,
  styles: [`
    .form-card { background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group.full-width { grid-column: 1 / -1; }
    .form-group label { font-weight: 600; color: #555; font-size: 14px; }
    .form-control { padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; }
    .form-control:focus { border-color: #2E7D32; }
    .form-control.error { border-color: #C62828; }
    .gender-toggle { display: flex; gap: 8px; }
    .gender-btn { flex: 1; padding: 9px 12px; border: 1.5px solid #ddd; border-radius: 8px; background: #fff; cursor: pointer; font-size: 14px; font-weight: 600; color: #666; transition: all .15s; font-family: inherit; }
    .gender-btn:hover { border-color: #999; }
    .gender-btn.active-male { background: #E3F2FD; border-color: #1565C0; color: #1565C0; }
    .gender-btn.active-female { background: #FCE4EC; border-color: #C2185B; color: #C2185B; }
    .checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
    .form-actions { display: flex; gap: 12px; margin-top: 28px; }
    .btn { padding: 12px 28px; border-radius: 8px; border: none; cursor: pointer; font-size: 15px; font-weight: 600; }
    .btn-primary { background: #2E7D32; color: #fff; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary { background: #eee; color: #555; }
    textarea.form-control { resize: vertical; }
    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-box { background: #fff; border-radius: 16px; padding: 32px 28px; max-width: 380px; width: 90%; text-align: center; box-shadow: 0 8px 40px rgba(0,0,0,0.2); }
    .modal-icon { font-size: 40px; margin-bottom: 12px; }
    .modal-box h3 { margin: 0 0 10px; font-size: 17px; color: #C62828; }
    .modal-box p { margin: 0 0 20px; font-size: 14px; color: #555; line-height: 1.5; }
    .btn-close-modal { padding: 10px 28px; background: #C62828; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; }
  `]
})
export class DonorFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  saving = false;
  showPhoneExistsModal = false;
  donorId: number | null = null;
  typeOptions: SelectOption[] = [];
  wilayaOptions: SelectOption[] = [];
  selectedType: string = 'individual';
  selectedAddress: string | null = null;

  constructor(
    private fb: FormBuilder,
    private service: DonorService,
    private wilayaService: WilayaService,
    private translate: TranslateService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      full_name: ['', Validators.required],
      gender: [null],
      phone: ['', Validators.required],
      address: [''],
      type: ['individual', Validators.required],
      notes: [''],
      is_active: [true]
    });

    this.typeOptions = [
      { id: 'individual', label: this.translate.instant('DONORS.TYPE_INDIVIDUAL') },
      { id: 'company',    label: this.translate.instant('DONORS.TYPE_COMPANY') }
    ];

    this.wilayaService.getAll().subscribe({
      next: res => {
        this.wilayaOptions = res.data
          .filter((w: Wilaya) => w.is_active)
          .map((w: Wilaya) => ({ id: w.name_fr, label: w.name_fr, sublabel: w.name_ar }));
      }
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.donorId = +id;
      this.service.getById(+id).subscribe(res => {
        this.form.patchValue(res.data);
        this.selectedType = res.data.type || 'individual';
        this.selectedAddress = res.data.address || null;
      });
    }
  }

  hasError(f: string): boolean { const c = this.form.get(f); return !!(c?.invalid && c?.touched); }

  onTypeSelect(val: number | string | null): void {
    this.selectedType = (val as string) || 'individual';
    this.form.get('type')!.setValue(this.selectedType);
  }

  onAddressSelect(val: number | string | null): void {
    this.selectedAddress = val as string | null;
    this.form.get('address')!.setValue(val ?? '');
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const req = this.isEdit ? this.service.update(this.donorId!, this.form.value) : this.service.create(this.form.value);
    req.subscribe({
      next: () => { this.saving = false; this.router.navigate(['/donors']); },
      error: (err: any) => {
        this.saving = false;
        if (err?.status === 422 && err?.error?.data?.phone) {
          this.showPhoneExistsModal = true;
        }
      }
    });
  }
}
