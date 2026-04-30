import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FamilyService } from '../../../core/services/family.service';
import { WilayaService, Wilaya } from '../../../core/services/wilaya.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { SearchableSelectComponent, SelectOption } from '../../../shared/components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-family-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule, PageHeaderComponent, SearchableSelectComponent],
  template: `
    <app-page-header [title]="isEdit ? ('FAMILIES.EDIT' | translate) : ('FAMILIES.ADD' | translate)" backLink="/families"></app-page-header>
    <div class="form-card">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="form-grid">
          <div class="form-group">
            <label>{{ 'FAMILIES.NAME' | translate }}</label>
            <input type="text" formControlName="name" class="form-control">
          </div>
          <div class="form-group">
            <label>{{ 'FAMILIES.REPRESENTATIVE' | translate }} *</label>
            <input type="text" formControlName="representative_name" class="form-control" [class.error]="hasError('representative_name')">
          </div>
          <div class="form-group">
            <label>{{ 'FAMILIES.PHONE' | translate }} *</label>
            <input type="tel" formControlName="phone" class="form-control" [class.error]="hasError('phone')">
          </div>
          <div class="form-group">
            <label>{{ 'FAMILIES.MEMBERS_COUNT' | translate }} *</label>
            <input type="number" formControlName="members_count" class="form-control" min="1" [class.error]="hasError('members_count')">
          </div>
          <div class="form-group">
            <label>{{ 'FAMILIES.ADDRESS' | translate }}</label>
            <app-searchable-select
              [options]="wilayaOptions"
              [value]="selectedAddress"
              [placeholder]="'— ' + ('FAMILIES.ADDRESS' | translate) + ' —'"
              (valueChange)="onAddressSelect($event)">
            </app-searchable-select>
          </div>
          <div class="form-group full-width">
            <label>{{ 'COMMON.NOTES' | translate }}</label>
            <textarea formControlName="notes" class="form-control" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="is_active"> {{ 'COMMON.ACTIVE' | translate }}
            </label>
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="saving">
            {{ saving ? ('COMMON.LOADING' | translate) : ('COMMON.SAVE' | translate) }}
          </button>
          <button type="button" class="btn btn-secondary" routerLink="/families">{{ 'COMMON.CANCEL' | translate }}</button>
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
    .form-control:focus { border-color: #E65100; }
    .form-control.error { border-color: #C62828; }
    .input-addon-wrap { display: flex; align-items: center; }
    .input-addon-wrap .form-control { border-radius: 8px 0 0 8px; flex: 1; }
    .addon { padding: 10px 12px; background: #f5f5f5; border: 1px solid #ddd; border-left: none; border-radius: 0 8px 8px 0; }
    .checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
    .form-actions { display: flex; gap: 12px; margin-top: 28px; }
    .btn { padding: 12px 28px; border-radius: 8px; border: none; cursor: pointer; font-size: 15px; font-weight: 600; }
    .btn-primary { background: #E65100; color: #fff; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary { background: #eee; color: #555; }
    textarea.form-control { resize: vertical; }
    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
  `]
})
export class FamilyFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  saving = false;
  familyId: number | null = null;
  wilayaOptions: SelectOption[] = [];
  selectedAddress: string | null = null;

  constructor(
    private fb: FormBuilder,
    private service: FamilyService,
    private wilayaService: WilayaService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [''],
      representative_name: ['', Validators.required],
      phone: ['', Validators.required],
      address: [''],
      members_count: [1, [Validators.required, Validators.min(1)]],
      notes: [''],
      is_active: [true]
    });

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
      this.familyId = +id;
      this.service.getById(+id).subscribe(res => {
        this.form.patchValue(res.data);
        this.selectedAddress = res.data.address || null;
      });
    }
  }

  hasError(f: string): boolean { const c = this.form.get(f); return !!(c?.invalid && c?.touched); }

  onAddressSelect(val: number | string | null): void {
    this.selectedAddress = val as string | null;
    this.form.get('address')!.setValue(val ?? '');
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const req = this.isEdit ? this.service.update(this.familyId!, this.form.value) : this.service.create(this.form.value);
    req.subscribe({
      next: () => { this.saving = false; this.router.navigate(['/families']); },
      error: () => { this.saving = false; }
    });
  }
}
