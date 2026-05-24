import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { OrphanService } from '../../../core/services/orphan.service';
import { GuardianService } from '../../../core/services/guardian.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PhotoUploadComponent } from '../../../shared/components/photo-upload/photo-upload.component';
import { SearchableSelectComponent, SelectOption } from '../../../shared/components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-orphan-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule, PageHeaderComponent, PhotoUploadComponent, SearchableSelectComponent],
  template: `
    <app-page-header
      [title]="isEdit ? pageTitle.edit : pageTitle.add"
      [backLink]="backLink">
    </app-page-header>

    <div class="form-card">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="form-grid">

          <div class="form-group">
            <label>Prénom *</label>
            <input type="text" formControlName="full_name" class="form-control" [class.error]="hasError('full_name')" placeholder="Prénom de l'enfant">
            <small class="error-text" *ngIf="hasError('full_name')">Ce champ est obligatoire</small>
          </div>

          <div class="form-group">
            <label>Genre *</label>
            <app-searchable-select
              [options]="genderOptions"
              [value]="selectedGender"
              placeholder="— Genre —"
              (valueChange)="onGenderSelect($event)">
            </app-searchable-select>
          </div>

          <div class="form-group">
            <label>Année de naissance *</label>
            <input
              type="number"
              formControlName="birth_year"
              class="form-control"
              [class.error]="hasError('birth_year')"
              placeholder="Ex: 2010"
              [min]="1980"
              [max]="currentYear">
            <small class="error-text" *ngIf="hasError('birth_year')">Entrez une année valide (1980–{{ currentYear }})</small>
          </div>

          <!-- Nom affiché (calculé) -->
          <div class="form-group display-name-preview" *ngIf="displayNamePreview">
            <label>Nom affiché</label>
            <div class="preview-box">{{ displayNamePreview }}</div>
          </div>

          <div class="form-group">
            <label>École</label>
            <input type="text" formControlName="school_name" class="form-control" placeholder="Nom de l'école">
          </div>

          <div class="form-group">
            <label>Niveau scolaire</label>
            <input type="text" formControlName="grade" class="form-control" placeholder="Ex: 3ème année">
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="is_active">
              Orphelin actif
            </label>
          </div>

          <div class="form-group full-width">
            <label>Notes</label>
            <textarea formControlName="notes" class="form-control" rows="3" placeholder="Remarques..."></textarea>
          </div>

          <div class="form-group photo-group">
            <label>Photo</label>
            <app-photo-upload (fileSelected)="onPhotoSelected($event)"></app-photo-upload>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="saving">
            <span *ngIf="saving" class="spinner-sm"></span>
            {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
          <button type="button" class="btn btn-secondary" [routerLink]="backLink">Annuler</button>
        </div>
      </form>
    </div>

    <div class="modal-overlay" *ngIf="showErrorModal" (click)="showErrorModal = false">
      <div class="modal-box" (click)="$event.stopPropagation()">
        <div class="modal-icon">⚠️</div>
        <h3>Erreur</h3>
        <p>{{ errorMessage }}</p>
        <button class="btn-close-modal" (click)="showErrorModal = false">Fermer</button>
      </div>
    </div>
  `,
  styles: [`
    .form-card { background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group.full-width { grid-column: 1 / -1; }
    .form-group.photo-group { grid-column: span 2; max-width: 300px; }
    .form-group.display-name-preview { grid-column: 1 / -1; }
    .form-group label { font-weight: 600; color: #555; font-size: 14px; }
    .form-control { padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: inherit; }
    .form-control:focus { border-color: #2E7D32; }
    .form-control.error { border-color: #C62828; }
    .error-text { color: #C62828; font-size: 12px; }
    .preview-box { background: #E8F5E9; border-left: 4px solid #2E7D32; border-radius: 6px; padding: 10px 14px; font-size: 15px; font-weight: 600; color: #1B5E20; }
    .checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 400; }
    .form-actions { display: flex; gap: 12px; margin-top: 28px; }
    .btn { padding: 12px 28px; border-radius: 8px; border: none; cursor: pointer; font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
    .btn-primary { background: #2E7D32; color: #fff; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary { background: #eee; color: #555; }
    .spinner-sm { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    textarea.form-control { resize: vertical; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-box { background: #fff; border-radius: 16px; padding: 32px 28px; max-width: 380px; width: 90%; text-align: center; box-shadow: 0 8px 40px rgba(0,0,0,0.2); }
    .modal-icon { font-size: 40px; margin-bottom: 12px; }
    .modal-box h3 { margin: 0 0 10px; font-size: 17px; color: #C62828; }
    .modal-box p { margin: 0 0 20px; font-size: 14px; color: #555; line-height: 1.5; }
    .btn-close-modal { padding: 10px 28px; background: #C62828; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; }
    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } .form-group.photo-group { grid-column: 1; max-width: 100%; } }
  `]
})
export class OrphanFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  saving = false;
  showErrorModal = false;
  errorMessage = '';
  orphanId: number | null = null;
  guardianId: number | null = null;
  fatherName = '';
  photoFile: File | null = null;
  genderOptions: SelectOption[] = [
    { id: 'male',   label: 'Garçon' },
    { id: 'female', label: 'Fille'  },
  ];
  selectedGender = 'male';
  currentYear = new Date().getFullYear();
  pageTitle = { edit: 'Modifier orphelin', add: 'Ajouter un orphelin' };

  get displayNamePreview(): string {
    const name = this.form.get('full_name')?.value?.trim();
    if (!name || !this.fatherName) return name || '';
    return `${name} ${this.fatherName}`;
  }

  get backLink(): string {
    return this.guardianId ? `/guardians/${this.guardianId}` : '/orphans';
  }

  constructor(
    private fb: FormBuilder,
    private orphanService: OrphanService,
    private guardianService: GuardianService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      full_name:   ['', Validators.required],
      birth_year:  ['', [Validators.required, Validators.min(1980), Validators.max(this.currentYear)]],
      gender:      ['male', Validators.required],
      guardian_id: [null, Validators.required],
      school_name: [''],
      grade:       [''],
      notes:       [''],
      is_active:   [true],
    });

    // Guardian vient du paramètre de route ou du queryParam
    const guardianIdParam = this.route.snapshot.paramMap.get('guardianId')
      || this.route.snapshot.queryParamMap.get('guardian_id');
    if (guardianIdParam) {
      this.guardianId = +guardianIdParam;
      this.form.get('guardian_id')!.setValue(this.guardianId);
      this.guardianService.getById(this.guardianId).subscribe({
        next: res => { this.fatherName = res.data.father_name || ''; }
      });
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.orphanId = +id;
      this.orphanService.getById(+id).subscribe(res => {
        const o = res.data;
        this.form.patchValue({
          full_name:   o.full_name,
          birth_year:  o.birth_year,
          gender:      o.gender,
          guardian_id: o.guardian_id,
          school_name: o.school_name,
          grade:       o.grade,
          notes:       o.notes,
          is_active:   o.is_active,
        });
        this.selectedGender = o.gender || 'male';
        this.guardianId     = o.guardian_id ?? null;
        this.fatherName     = o.guardian?.father_name ?? '';
      });
    }
  }

  hasError(f: string): boolean { const c = this.form.get(f); return !!(c?.invalid && c?.touched); }
  onPhotoSelected(file: File | null): void { this.photoFile = file; }

  onGenderSelect(val: number | string | null): void {
    this.selectedGender = (val as string) || 'male';
    this.form.get('gender')!.setValue(this.selectedGender);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;

    const fd = new FormData();
    const v  = this.form.value;
    fd.append('full_name',   v.full_name);
    fd.append('birth_year',  String(v.birth_year));
    fd.append('gender',      v.gender);
    fd.append('guardian_id', String(v.guardian_id));
    if (v.school_name) fd.append('school_name', v.school_name);
    if (v.grade)       fd.append('grade',       v.grade);
    if (v.notes)       fd.append('notes',       v.notes);
    fd.append('is_active', v.is_active ? '1' : '0');
    if (this.photoFile) fd.append('photo', this.photoFile);

    const req = this.isEdit
      ? this.orphanService.update(this.orphanId!, fd)
      : this.orphanService.create(fd);

    req.subscribe({
      next: () => { this.saving = false; this.router.navigate([this.backLink]); },
      error: (err: any) => {
        this.saving = false;
        this.errorMessage = err?.error?.message || 'Une erreur est survenue';
        this.showErrorModal = true;
      },
    });
  }
}
