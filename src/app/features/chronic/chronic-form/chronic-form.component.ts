import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChronicPatientService } from '../../../core/services/chronic-patient.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { SearchableSelectComponent, SelectOption } from '../../../shared/components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-chronic-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule, PageHeaderComponent, SearchableSelectComponent],
  template: `
    <app-page-header [title]="(isEdit ? 'CHRONIC.EDIT' : 'CHRONIC.ADD') | translate" backLink="/chronic"></app-page-header>

    <div class="form-card">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">

        <div class="form-row">
          <div class="form-group">
            <label>{{ 'CHRONIC.FULL_NAME' | translate }} *</label>
            <input formControlName="full_name" class="form-control" [class.error]="hasError('full_name')">
          </div>
          <div class="form-group">
            <label>{{ 'CHRONIC.DISEASE_NAME' | translate }} *</label>
            <input formControlName="disease_name" class="form-control" [class.error]="hasError('disease_name')">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>{{ 'ORPHANS.GENDER' | translate }}</label>
            <app-searchable-select
              [options]="genderOptions"
              [value]="selectedGender"
              placeholder="—"
              (valueChange)="onGenderChange($event)">
            </app-searchable-select>
          </div>
          <div class="form-group">
            <label>{{ 'ORPHANS.BIRTH_DATE' | translate }}</label>
            <input formControlName="birth_date" type="date" class="form-control">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>{{ 'MEMBERS.PHONE' | translate }}</label>
            <input formControlName="phone" class="form-control">
          </div>
          <div class="form-group">
            <label>{{ 'MEMBERS.WHATSAPP' | translate }}</label>
            <input formControlName="whatsapp" class="form-control">
          </div>
        </div>

        <div class="form-group">
          <label>{{ 'COMMON.NOTES' | translate }}</label>
          <textarea formControlName="notes" class="form-control" rows="3"></textarea>
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input type="checkbox" formControlName="is_active">
            {{ 'CHRONIC.IS_ACTIVE' | translate }}
          </label>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="saving">
            {{ (saving ? 'COMMON.SAVING' : 'COMMON.SAVE') | translate }}
          </button>
          <button type="button" class="btn btn-secondary" routerLink="/chronic">{{ 'COMMON.CANCEL' | translate }}</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-card { background:#fff; border-radius:16px; padding:32px; box-shadow:0 2px 12px rgba(0,0,0,0.08); max-width:720px; margin:24px auto; }
    .form-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    @media(max-width:600px) { .form-row { grid-template-columns:1fr; } }
    .form-group { display:flex; flex-direction:column; gap:6px; margin-bottom:16px; }
    label { font-size:13px; font-weight:600; color:#555; }
    .form-control { padding:10px 12px; border:1px solid #ddd; border-radius:8px; font-size:14px; font-family:inherit; outline:none; }
    .form-control:focus { border-color:#6A1B9A; }
    .form-control.error { border-color:#C62828; }
    textarea.form-control { resize:vertical; }
    .checkbox-group { flex-direction:row; align-items:center; }
    .checkbox-label { display:flex; align-items:center; gap:8px; font-size:14px; cursor:pointer; }
    .form-actions { display:flex; gap:12px; margin-top:8px; }
    .btn { padding:10px 22px; border-radius:8px; font-size:14px; font-family:inherit; font-weight:600; cursor:pointer; border:none; }
    .btn-primary { background:#6A1B9A; color:#fff; }
    .btn-primary:disabled { opacity:0.6; cursor:not-allowed; }
    .btn-secondary { background:#eee; color:#555; }
  `]
})
export class ChronicFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  patientId: number | null = null;
  saving = false;
  selectedGender: string = '';

  genderOptions: SelectOption[] = [];

  constructor(
    private fb: FormBuilder,
    private service: ChronicPatientService,
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.genderOptions = [
      { id: '', label: '—' },
      { id: 'male',   label: this.translate.instant('ORPHANS.MALE') },
      { id: 'female', label: this.translate.instant('ORPHANS.FEMALE') },
    ];

    this.form = this.fb.group({
      full_name:    ['', Validators.required],
      disease_name: ['', Validators.required],
      gender:       [''],
      birth_date:   [''],
      phone:        [''],
      whatsapp:     [''],
      notes:        [''],
      is_active:    [true],
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.patientId = +id;
      this.service.getById(+id).subscribe({
        next: res => {
          this.form.patchValue(res.data);
          this.selectedGender = res.data.gender ?? '';
        },
        error: () => this.router.navigate(['/chronic']),
      });
    }
  }

  onGenderChange(val: string | number | null): void {
    this.selectedGender = (val as string) ?? '';
    this.form.get('gender')!.setValue(this.selectedGender);
  }

  hasError(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const req = this.isEdit
      ? this.service.update(this.patientId!, this.form.value)
      : this.service.create(this.form.value);
    req.subscribe({
      next: (res: any) => {
        this.saving = false;
        const id = res.data?.id ?? this.patientId;
        this.router.navigate(['/chronic', id]);
      },
      error: () => { this.saving = false; }
    });
  }
}
