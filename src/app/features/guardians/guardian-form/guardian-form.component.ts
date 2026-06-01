import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { GuardianService } from '../../../core/services/guardian.service';
import { WilayaService } from '../../../core/services/wilaya.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { SearchableSelectComponent, SelectOption } from '../../../shared/components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-guardian-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule, PageHeaderComponent, SearchableSelectComponent],
  template: `
    <app-page-header [title]="(isEdit ? 'GUARDIANS.EDIT' : 'GUARDIANS.ADD') | translate" backLink="/guardians"></app-page-header>

    <div class="form-card">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">

        <div class="section-title">{{ 'GUARDIANS.INFO_TITLE' | translate }}</div>
        <div class="form-grid">
          <div class="form-group">
            <label>{{ 'GUARDIANS.NAME' | translate }} *</label>
            <input type="text" formControlName="name" class="form-control" [class.error]="hasError('name')">
            <small class="error-text" *ngIf="hasError('name')">{{ 'COMMON.FIELD_REQUIRED' | translate }}</small>
          </div>

          <div class="form-group">
            <label>{{ 'ORPHANS.FATHER_NAME' | translate }}</label>
            <input type="text" formControlName="father_name" class="form-control">
          </div>

          <div class="form-group">
            <label>{{ 'COMMON.PHONE' | translate }} *</label>
            <input type="tel" formControlName="phone" class="form-control" [class.error]="hasError('phone')" placeholder="Ex: 22000000">
            <small class="error-text" *ngIf="hasError('phone')">{{ phoneError || ('COMMON.FIELD_REQUIRED' | translate) }}</small>
          </div>

          <div class="form-group">
            <label>WhatsApp</label>
            <div class="input-with-icon">
              <span class="input-prefix">📱</span>
              <input type="tel" formControlName="whatsapp" class="form-control has-prefix" placeholder="Ex: 22000000">
            </div>
          </div>

          <div class="form-group full-width">
            <label>{{ 'MEMBERS.ADDRESS' | translate }}</label>
            <app-searchable-select
              [options]="wilayaOptions"
              [value]="selectedAddress"
              placeholder="—"
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
              {{ 'GUARDIANS.ACTIVE' | translate }}
            </label>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="saving">
            <span *ngIf="saving" class="spinner-sm"></span>
            {{ (saving ? 'COMMON.SAVING' : 'COMMON.SAVE') | translate }}
          </button>
          <button type="button" class="btn btn-secondary" routerLink="/guardians">{{ 'COMMON.CANCEL' | translate }}</button>
        </div>
      </form>
    </div>

    <div class="modal-overlay" *ngIf="showErrorModal" (click)="showErrorModal = false">
      <div class="modal-box" (click)="$event.stopPropagation()">
        <div class="modal-icon">⚠️</div>
        <h3>{{ 'COMMON.ERROR' | translate }}</h3>
        <p>{{ errorMessage }}</p>
        <button class="btn-close-modal" (click)="showErrorModal = false">{{ 'COMMON.CLOSE' | translate }}</button>
      </div>
    </div>
  `,
  styles: [`
    .form-card { background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); max-width: 700px; margin: 24px auto; }
    .section-title { font-size: 13px; font-weight: 700; color: #2E7D32; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #E8F5E9; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group.full-width { grid-column: 1 / -1; }
    .form-group label { font-weight: 600; color: #555; font-size: 14px; }
    .form-control { padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: inherit; width: 100%; box-sizing: border-box; }
    .form-control:focus { border-color: #2E7D32; }
    .form-control.error { border-color: #C62828; }
    .form-control.has-prefix { padding-left: 40px; }
    .input-with-icon { position: relative; }
    .input-prefix { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 16px; }
    .error-text { color: #C62828; font-size: 12px; }
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
    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } .form-card { padding: 20px; } }
  `]
})
export class GuardianFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  saving = false;
  showErrorModal = false;
  errorMessage = '';
  guardianId: number | null = null;
  phoneError = '';
  wilayaOptions: SelectOption[] = [];
  selectedAddress: string | null = null;

  constructor(
    private fb: FormBuilder,
    private guardianService: GuardianService,
    private wilayaService: WilayaService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name:        ['', Validators.required],
      father_name: [''],
      phone:       ['', Validators.required],
      whatsapp:    [''],
      address:     [''],
      notes:       [''],
      is_active:   [true],
    });

    this.wilayaService.getAll().subscribe({
      next: res => {
        this.wilayaOptions = res.data.map(w => ({ id: w.name_fr, label: w.name_fr }));
      },
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.guardianId = +id;
      this.guardianService.getById(+id).subscribe({
        next: (res) => {
          this.form.patchValue(res.data);
          this.selectedAddress = res.data.address || null;
        },
        error: () => this.router.navigate(['/guardians']),
      });
    }
  }

  onAddressSelect(val: number | string | null): void {
    this.selectedAddress = val as string | null;
    this.form.get('address')!.setValue(val ?? '');
  }

  hasError(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    this.phoneError = '';
    const req = this.isEdit
      ? this.guardianService.update(this.guardianId!, this.form.value)
      : this.guardianService.create(this.form.value);

    req.subscribe({
      next: () => { this.saving = false; this.router.navigate(['/guardians']); },
      error: (err: any) => {
        this.saving = false;
        if (err?.error?.errors?.phone) {
          this.phoneError = err.error.errors.phone[0];
          this.form.get('phone')!.markAsTouched();
        } else {
          this.errorMessage = err?.error?.message || 'Une erreur est survenue';
          this.showErrorModal = true;
        }
      },
    });
  }
}
