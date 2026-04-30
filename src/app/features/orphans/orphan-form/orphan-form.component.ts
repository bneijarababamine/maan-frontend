import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OrphanService } from '../../../core/services/orphan.service';
import { WilayaService, Wilaya } from '../../../core/services/wilaya.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PhotoUploadComponent } from '../../../shared/components/photo-upload/photo-upload.component';
import { SearchableSelectComponent, SelectOption } from '../../../shared/components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-orphan-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule, PageHeaderComponent, PhotoUploadComponent, SearchableSelectComponent],
  template: `
    <app-page-header [title]="isEdit ? ('ORPHANS.EDIT' | translate) : ('ORPHANS.ADD' | translate)" backLink="/orphans"></app-page-header>
    <div class="form-card">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="form-grid">
          <div class="form-group">
            <label>{{ 'MEMBERS.FULL_NAME' | translate }} *</label>
            <input type="text" formControlName="full_name" class="form-control" [class.error]="hasError('full_name')">
          </div>
          <div class="form-group">
            <label>{{ 'ORPHANS.BIRTH_DATE' | translate }} *</label>
            <input type="date" formControlName="birth_date" class="form-control" [class.error]="hasError('birth_date')">
          </div>
          <div class="form-group">
            <label>{{ 'ORPHANS.GENDER' | translate }} *</label>
            <app-searchable-select
              [options]="genderOptions"
              [value]="selectedGender"
              [placeholder]="'— ' + ('ORPHANS.GENDER' | translate) + ' —'"
              (valueChange)="onGenderSelect($event)">
            </app-searchable-select>
          </div>
          <div class="form-group">
            <label>{{ 'ORPHANS.GUARDIAN' | translate }} *</label>
            <input type="text" formControlName="guardian_name" class="form-control" [class.error]="hasError('guardian_name')">
          </div>
          <div class="form-group">
            <label>{{ 'ORPHANS.GUARDIAN_PHONE' | translate }} *</label>
            <input type="tel" formControlName="guardian_phone" class="form-control" [class.error]="hasError('guardian_phone')">
          </div>
          <div class="form-group">
            <label>{{ 'ORPHANS.SCHOOL' | translate }}</label>
            <input type="text" formControlName="school_name" class="form-control">
          </div>
          <div class="form-group">
            <label>{{ 'ORPHANS.GRADE' | translate }}</label>
            <input type="text" formControlName="grade" class="form-control">
          </div>
          <div class="form-group">
            <label>{{ 'MEMBERS.ADDRESS' | translate }}</label>
            <app-searchable-select
              [options]="wilayaOptions"
              [value]="selectedAddress"
              [placeholder]="'— ' + ('MEMBERS.ADDRESS' | translate) + ' —'"
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
              {{ 'ORPHANS.STATUS_ACTIVE' | translate }}
            </label>
          </div>
          <div class="form-group photo-group">
            <label>{{ 'ORPHANS.PHOTO' | translate }}</label>
            <app-photo-upload (fileSelected)="onPhotoSelected($event)"></app-photo-upload>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="saving">
            <span *ngIf="saving" class="spinner-sm"></span>
            {{ saving ? ('COMMON.LOADING' | translate) : ('COMMON.SAVE' | translate) }}
          </button>
          <button type="button" class="btn btn-secondary" routerLink="/orphans">{{ 'COMMON.CANCEL' | translate }}</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-card { background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group.full-width { grid-column: 1 / -1; }
    .form-group.photo-group { grid-column: span 2; max-width: 300px; }
    .form-group label { font-weight: 600; color: #555; font-size: 14px; }
    .form-control { padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; }
    .form-control:focus { border-color: #2E7D32; }
    .form-control.error { border-color: #C62828; }
    .checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
    .form-actions { display: flex; gap: 12px; margin-top: 28px; }
    .btn { padding: 12px 28px; border-radius: 8px; border: none; cursor: pointer; font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
    .btn-primary { background: #2E7D32; color: #fff; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary { background: #eee; color: #555; }
    .spinner-sm { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    textarea.form-control { resize: vertical; }
    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } .form-group.photo-group { grid-column: 1; max-width: 100%; } }
  `]
})
export class OrphanFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  saving = false;
  orphanId: number | null = null;
  photoFile: File | null = null;
  wilayaOptions: SelectOption[] = [];
  genderOptions: SelectOption[] = [];
  selectedAddress: string | null = null;
  selectedGender: string = 'male';

  constructor(
    private fb: FormBuilder,
    private service: OrphanService,
    private wilayaService: WilayaService,
    private translate: TranslateService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      full_name: ['', Validators.required],
      birth_date: ['', Validators.required],
      gender: ['male', Validators.required],
      guardian_name: ['', Validators.required],
      guardian_phone: ['', Validators.required],
      school_name: [''],
      grade: [''],
      address: [''],
      notes: [''],
      is_active: [true]
    });

    this.genderOptions = [
      { id: 'male',   label: this.translate.instant('ORPHANS.MALE') },
      { id: 'female', label: this.translate.instant('ORPHANS.FEMALE') }
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
      this.orphanId = +id;
      this.service.getById(+id).subscribe(res => {
        this.form.patchValue(res.data);
        this.selectedGender = res.data.gender || 'male';
        this.selectedAddress = res.data.address || null;
      });
    }
  }

  hasError(f: string): boolean { const c = this.form.get(f); return !!(c?.invalid && c?.touched); }
  onPhotoSelected(file: File | null): void { this.photoFile = file; }

  onGenderSelect(val: number | string | null): void {
    this.selectedGender = (val as string) || 'male';
    this.form.get('gender')!.setValue(this.selectedGender);
  }

  onAddressSelect(val: number | string | null): void {
    this.selectedAddress = val as string | null;
    this.form.get('address')!.setValue(val ?? '');
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const fd = new FormData();
    Object.entries(this.form.value).forEach(([k, v]) => {
      if (v !== null && v !== undefined) fd.append(k, String(v));
    });
    if (this.photoFile) fd.append('photo', this.photoFile);
    const req = this.isEdit ? this.service.update(this.orphanId!, fd) : this.service.create(fd);
    req.subscribe({
      next: () => { this.saving = false; this.router.navigate(['/orphans']); },
      error: () => { this.saving = false; }
    });
  }
}
