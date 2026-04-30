import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MemberService } from '../../../core/services/member.service';
import { WilayaService, Wilaya } from '../../../core/services/wilaya.service';
import { SettingsService } from '../../../core/services/settings.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { SearchableSelectComponent, SelectOption } from '../../../shared/components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-member-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule, PageHeaderComponent, SearchableSelectComponent],
  template: `
    <app-page-header
      [title]="isEdit ? ('MEMBERS.EDIT' | translate) : ('MEMBERS.ADD' | translate)"
      backLink="/members">
    </app-page-header>

    <div class="form-card">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="form-grid">
          <div class="form-group">
            <label>{{ 'MEMBERS.FULL_NAME' | translate }} *</label>
            <input type="text" formControlName="full_name" class="form-control"
                   [class.error]="hasError('full_name')">
            <span class="error-msg" *ngIf="hasError('full_name')">Champ requis</span>
          </div>

          <div class="form-group">
            <label>{{ 'MEMBERS.GENDER' | translate }}</label>
            <div class="gender-toggle">
              <button type="button" class="gender-btn"
                      [class.active-male]="form.value.gender === 'male'"
                      (click)="form.get('gender')!.setValue(form.value.gender === 'male' ? null : 'male')">
                ♂ {{ 'MEMBERS.MALE' | translate }}
              </button>
              <button type="button" class="gender-btn"
                      [class.active-female]="form.value.gender === 'female'"
                      (click)="form.get('gender')!.setValue(form.value.gender === 'female' ? null : 'female')">
                ♀ {{ 'MEMBERS.FEMALE' | translate }}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>{{ 'MEMBERS.PHONE' | translate }} *</label>
            <input type="tel" formControlName="phone" class="form-control"
                   [class.error]="hasError('phone')">
          </div>

          <div class="form-group">
            <label>{{ 'MEMBERS.WHATSAPP' | translate }}</label>
            <input type="tel" formControlName="whatsapp" class="form-control">
          </div>

          <div class="form-group">
            <label>{{ 'MEMBERS.PROFESSION' | translate }}</label>
            <input type="text" formControlName="profession" class="form-control">
          </div>

          <div class="form-group">
            <label>{{ 'MEMBERS.JOIN_DATE' | translate }} *</label>
            <input type="date" formControlName="join_date" class="form-control"
                   [class.error]="hasError('join_date')">
          </div>

          <div class="form-group">
            <label>{{ 'MEMBERS.MONTHLY_AMOUNT' | translate }} *</label>
            <div class="input-with-addon">
              <input type="number" formControlName="monthly_amount" class="form-control"
                     [class.error]="hasError('monthly_amount')" min="0">
              <span class="input-addon">{{ 'COMMON.MRU' | translate }}</span>
            </div>
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
              {{ 'MEMBERS.STATUS' | translate }} ({{ 'COMMON.ACTIVE' | translate }})
            </label>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="saving">
            <span *ngIf="saving" class="spinner-sm"></span>
            {{ saving ? ('COMMON.LOADING' | translate) : ('COMMON.SAVE' | translate) }}
          </button>
          <button type="button" class="btn btn-secondary" routerLink="/members">
            {{ 'COMMON.CANCEL' | translate }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-card { background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group.full-width { grid-column: 1 / -1; }
    .form-group label { font-weight: 600; color: #555; font-size: 14px; }
    .form-control { padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; transition: border-color 0.2s; }
    .form-control:focus { border-color: #2E7D32; }
    .form-control.error { border-color: #C62828; }
    .error-msg { font-size: 12px; color: #C62828; }
    .input-with-addon { display: flex; align-items: center; }
    .input-with-addon .form-control { border-radius: 8px 0 0 8px; flex: 1; }
    .input-addon { padding: 10px 12px; background: #f5f5f5; border: 1px solid #ddd; border-left: none; border-radius: 0 8px 8px 0; font-size: 14px; color: #666; }
    .gender-toggle { display: flex; gap: 8px; }
    .gender-btn { flex: 1; padding: 9px 12px; border: 1.5px solid #ddd; border-radius: 8px; background: #fff; cursor: pointer; font-size: 14px; font-weight: 600; color: #666; transition: all .15s; font-family: inherit; }
    .gender-btn:hover { border-color: #999; }
    .gender-btn.active-male { background: #E3F2FD; border-color: #1565C0; color: #1565C0; }
    .gender-btn.active-female { background: #FCE4EC; border-color: #C2185B; color: #C2185B; }
    .checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 500; }
    .form-actions { display: flex; gap: 12px; margin-top: 32px; }
    .btn { padding: 12px 28px; border-radius: 8px; border: none; cursor: pointer; font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
    .btn-primary { background: #2E7D32; color: #fff; }
    .btn-primary:hover:not(:disabled) { background: #1b5e20; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary { background: #eee; color: #555; }
    .btn-secondary:hover { background: #ddd; }
    .spinner-sm { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    textarea.form-control { resize: vertical; }
    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
  `]
})
export class MemberFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  saving = false;
  memberId: number | null = null;
  wilayaOptions: SelectOption[] = [];
  selectedAddress: string | null = null;

  constructor(
    private fb: FormBuilder,
    private memberService: MemberService,
    private wilayaService: WilayaService,
    private settingsService: SettingsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      full_name: ['', Validators.required],
      gender: [null],
      phone: ['', Validators.required],
      whatsapp: [''],
      profession: [''],
      join_date: [new Date().toISOString().split('T')[0], Validators.required],
      monthly_amount: [200, [Validators.required, Validators.min(0)]],
      address: [''],
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
      this.memberId = +id;
      this.memberService.getById(this.memberId).subscribe(res => {
        this.form.patchValue(res.data);
        this.selectedAddress = res.data.address || null;
      });
    } else {
      this.settingsService.getAll().subscribe({
        next: res => {
          const v = res.data?.['default_monthly_amount'];
          if (v) this.form.get('monthly_amount')!.setValue(+v);
        }
      });
    }
  }

  hasError(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  onAddressSelect(val: number | string | null): void {
    this.selectedAddress = val as string | null;
    this.form.get('address')!.setValue(val ?? '');
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const data = this.form.value;
    const req = this.isEdit
      ? this.memberService.update(this.memberId!, data)
      : this.memberService.create(data);
    req.subscribe({
      next: () => { this.saving = false; this.router.navigate(['/members']); },
      error: () => { this.saving = false; }
    });
  }
}
