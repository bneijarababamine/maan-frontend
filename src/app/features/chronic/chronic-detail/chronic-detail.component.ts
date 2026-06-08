import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChronicPatientService, ChronicPatient, PatientMedication } from '../../../core/services/chronic-patient.service';
import { BankService } from '../../../core/services/bank.service';
import { Bank } from '../../../core/models/bank.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-chronic-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule, PageHeaderComponent, ConfirmDialogComponent],
  template: `
    <app-page-header [title]="patient?.full_name || ''" backLink="/chronic">
      <button class="btn btn-edit" [routerLink]="['/chronic', patient?.id, 'edit']" *ngIf="patient">
        ✏️ {{ 'COMMON.EDIT' | translate }}
      </button>
    </app-page-header>

    <div *ngIf="loading" class="loading-state"><div class="spinner-lg"></div></div>

    <div *ngIf="!loading && patient" class="detail-layout">

      <!-- Left: Info -->
      <div class="left-col">
        <div class="card info-card">
          <div class="avatar-wrap">
            <div class="avatar" [class.male-av]="patient.gender==='male'" [class.female-av]="patient.gender==='female'" [class.no-gender]="!patient.gender">
              {{ patient.full_name.charAt(0) }}
            </div>
            <span class="status-badge" [class.active]="patient.is_active" [class.inactive]="!patient.is_active">
              {{ (patient.is_active ? 'COMMON.ACTIVE' : 'COMMON.INACTIVE') | translate }}
            </span>
          </div>
          <div class="info-list">
            <div class="info-row">
              <span class="info-key">{{ 'CHRONIC.DISEASE_NAME' | translate }}</span>
              <span class="disease-badge">💊 {{ patient.disease_name }}</span>
            </div>
            <div class="info-row" *ngIf="patient.gender">
              <span class="info-key">{{ 'ORPHANS.GENDER' | translate }}</span>
              <span [class]="'gender ' + patient.gender">
                {{ (patient.gender === 'male' ? 'ORPHANS.MALE' : 'ORPHANS.FEMALE') | translate }}
              </span>
            </div>
            <div class="info-row" *ngIf="patient.birth_date">
              <span class="info-key">{{ 'ORPHANS.BIRTH_DATE' | translate }}</span>
              <span>{{ patient.birth_date | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="info-row" *ngIf="patient.phone">
              <span class="info-key">{{ 'MEMBERS.PHONE' | translate }}</span>
              <span>📞 {{ patient.phone }}</span>
            </div>
            <div class="info-row" *ngIf="patient.whatsapp">
              <span class="info-key">WhatsApp</span>
              <span>📱 {{ patient.whatsapp }}</span>
            </div>
            <div class="info-row" *ngIf="patient.notes">
              <span class="info-key">{{ 'COMMON.NOTES' | translate }}</span>
              <span class="notes-text">{{ patient.notes }}</span>
            </div>
          </div>

          <!-- Total -->
          <div class="total-box">
            <span>{{ 'CHRONIC.TOTAL_SPENT' | translate }}</span>
            <strong>{{ totalSpent | number:'1.0-0' }} {{ 'COMMON.MRU' | translate }}</strong>
          </div>
        </div>
      </div>

      <!-- Right: Medications -->
      <div class="right-col">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">💊 {{ 'CHRONIC.MEDICATIONS' | translate }} ({{ medications.length }})</h3>
            <button class="btn-add" (click)="showMedForm = !showMedForm">
              {{ showMedForm ? ('COMMON.CANCEL' | translate) : ('+ ' + ('CHRONIC.ADD_MED' | translate)) }}
            </button>
          </div>

          <!-- Add medication form -->
          <div *ngIf="showMedForm" class="med-form">
            <div class="form-group">
              <label>{{ 'CHRONIC.MED_NAME' | translate }} *</label>
              <input [(ngModel)]="medName" class="form-control">
            </div>

            <!-- Start date + Duration side by side -->
            <div class="med-form-row">
              <div class="form-group">
                <label>{{ 'CHRONIC.MED_START_DATE' | translate }} *</label>
                <input [(ngModel)]="medStartDate" type="date" class="form-control">
              </div>
              <div class="form-group">
                <label>{{ 'CHRONIC.MED_DURATION' | translate }} *</label>
                <div class="duration-row">
                  <input [(ngModel)]="medDurationValue" type="number" min="1" step="1" class="form-control dur-val">
                  <select [(ngModel)]="medDurationUnit" class="form-control dur-unit">
                    <option value="days">{{ 'CHRONIC.DAYS' | translate }}</option>
                    <option value="weeks">{{ 'CHRONIC.WEEKS' | translate }}</option>
                    <option value="months">{{ 'CHRONIC.MONTHS' | translate }}</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="med-form-row">
              <div class="form-group">
                <label>{{ 'CHRONIC.MED_PRICE' | translate }} ({{ 'COMMON.MRU' | translate }})</label>
                <input [(ngModel)]="medPrice" type="number" min="0" step="0.01" class="form-control">
              </div>
              <div class="form-group">
                <label>{{ 'CHRONIC.MED_QTY' | translate }}</label>
                <input [(ngModel)]="medQty" type="number" min="1" step="1" class="form-control">
              </div>
            </div>
            <div class="form-group">
              <label>{{ 'CONTRIBUTIONS.PAYMENT_METHOD' | translate }} *</label>
              <select [(ngModel)]="medPayment" class="form-control">
                <option value="">—</option>
                <option *ngFor="let b of banks" [value]="b.name_fr.toLowerCase()">
                  {{ b.name_fr }} ({{ b.balance | number:'1.0-0' }} {{ 'COMMON.MRU' | translate }})
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>{{ 'CHRONIC.MED_IMAGE' | translate }}</label>
              <input type="file" accept="image/*" (change)="onImageSelect($event)" class="form-control">
              <img *ngIf="medImagePreview" [src]="medImagePreview" class="image-preview">
            </div>
            <div class="form-group">
              <label>{{ 'COMMON.NOTES' | translate }}</label>
              <input [(ngModel)]="medNotes" class="form-control">
            </div>

            <div *ngIf="balanceError" class="error-msg">
              ⚠️ {{ 'CHRONIC.INSUFFICIENT_BALANCE' | translate }}
            </div>

            <button class="btn btn-primary" (click)="addMedication()"
                    [disabled]="savingMed || !medName || !medStartDate || !medDurationValue || !medPayment">
              {{ (savingMed ? 'COMMON.SAVING' : 'CHRONIC.SAVE_MED') | translate }}
            </button>
          </div>

          <!-- Medications list -->
          <div *ngIf="medications.length === 0 && !showMedForm" class="empty-state">
            {{ 'COMMON.NO_DATA' | translate }}
          </div>

          <div *ngFor="let m of medications" class="med-card">
            <div class="med-left">
              <img *ngIf="m.image_url" [src]="m.image_url" class="med-img" (click)="openImage(m.image_url!)">
              <div *ngIf="!m.image_url" class="med-img-placeholder">💊</div>
            </div>
            <div class="med-body">
              <strong class="med-name">{{ m.name }}</strong>
              <span class="med-date">{{ m.start_date | date:'dd/MM/yyyy' }} → {{ m.end_date | date:'dd/MM/yyyy' }}</span>
              <span class="med-duration">{{ m.duration_value }} {{ durationUnitLabel(m.duration_unit) }}</span>
              <!-- Remaining badge -->
              <span class="remaining-badge" [ngClass]="remainingClass(m)">
                <span class="material-symbols-outlined" style="font-size:13px;vertical-align:-2px;">schedule</span>
                {{ remainingLabel(m) }}
              </span>
              <span *ngIf="m.notes" class="med-notes">{{ m.notes }}</span>
              <span class="med-method">{{ getBankLabel(m.payment_method) }}</span>
            </div>
            <div class="med-right">
              <div class="med-total">{{ m.total | number:'1.0-0' }} {{ 'COMMON.MRU' | translate }}</div>
              <div class="med-detail">{{ m.quantity | number:'1.0-0' }} × {{ m.price | number:'1.0-0' }}</div>
              <button class="btn-del" (click)="askDeleteMed(m)">🗑️</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Image lightbox -->
    <div *ngIf="lightboxUrl" class="lightbox" (click)="lightboxUrl=null">
      <img [src]="lightboxUrl">
    </div>

    <app-confirm-dialog [visible]="showDeleteMed" type="danger"
      [title]="'CHRONIC.DELETE_MED_TITLE' | translate"
      [message]="'CHRONIC.DELETE_MED_MSG' | translate"
      [confirmLabel]="'COMMON.DELETE' | translate"
      iconName="delete"
      (confirmed)="confirmDeleteMed()" (cancelled)="showDeleteMed=false">
    </app-confirm-dialog>
  `,
  styles: [`
    .detail-layout { display:grid; grid-template-columns:320px 1fr; gap:20px; }
    @media(max-width:768px) { .detail-layout { grid-template-columns:1fr; } }
    .left-col,.right-col { display:flex; flex-direction:column; gap:20px; }
    .card { background:#fff; border-radius:16px; padding:24px; box-shadow:0 2px 12px rgba(0,0,0,0.08); }
    .card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    .card-title { margin:0; font-size:15px; font-weight:700; color:#333; }
    .avatar-wrap { display:flex; flex-direction:column; align-items:center; gap:10px; margin-bottom:20px; }
    .avatar { width:80px; height:80px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:32px; color:#fff; }
    .male-av   { background:linear-gradient(135deg,#1565C0,#42A5F5); }
    .female-av { background:linear-gradient(135deg,#AD1457,#F06292); }
    .no-gender { background:linear-gradient(135deg,#546E7A,#90A4AE); }
    .status-badge { padding:4px 12px; border-radius:12px; font-size:12px; font-weight:600; }
    .status-badge.active   { background:#E8F5E9; color:#2E7D32; }
    .status-badge.inactive { background:#eee; color:#666; }
    .info-list { display:flex; flex-direction:column; gap:10px; }
    .info-row { display:flex; justify-content:space-between; align-items:center; font-size:13px; padding-bottom:8px; border-bottom:1px solid #f5f5f5; }
    .info-key { color:#999; font-weight:500; }
    .disease-badge { background:#F3E5F5; color:#6A1B9A; border-radius:8px; padding:2px 8px; font-size:12px; font-weight:600; }
    .gender.male   { color:#1565C0; }
    .gender.female { color:#AD1457; }
    .notes-text { color:#555; font-size:12px; max-width:160px; text-align:end; }
    .total-box { display:flex; justify-content:space-between; align-items:center; margin-top:16px; padding-top:12px; border-top:2px solid #6A1B9A; }
    .total-box span { color:#6A1B9A; font-size:13px; font-weight:600; }
    .total-box strong { font-size:18px; color:#6A1B9A; }
    .btn-add { background:none; border:1px dashed #6A1B9A; color:#6A1B9A; border-radius:8px; padding:6px 12px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; }
    .btn-add:hover { background:#F3E5F5; }
    .med-form { background:#faf5ff; border-radius:10px; padding:16px; margin-bottom:16px; display:flex; flex-direction:column; gap:10px; }
    .med-form-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .duration-row { display:flex; gap:6px; }
    .dur-val { width:70px; flex-shrink:0; }
    .dur-unit { flex:1; }
    .form-group { display:flex; flex-direction:column; gap:4px; }
    label { font-size:12px; font-weight:600; color:#555; }
    .form-control { padding:8px 10px; border:1px solid #ddd; border-radius:8px; font-size:13px; font-family:inherit; outline:none; }
    .form-control:focus { border-color:#6A1B9A; }
    .image-preview { width:100%; max-height:150px; object-fit:contain; border-radius:8px; margin-top:6px; border:1px solid #eee; }
    .error-msg { color:#C62828; font-size:13px; background:#FFEBEE; padding:8px 12px; border-radius:8px; }
    .btn { padding:10px 20px; border-radius:8px; font-size:13px; font-family:inherit; font-weight:600; cursor:pointer; border:none; }
    .btn-primary { background:#6A1B9A; color:#fff; }
    .btn-primary:disabled { opacity:0.6; cursor:not-allowed; }
    .empty-state { text-align:center; color:#aaa; padding:24px; font-size:13px; }
    .med-card { display:flex; gap:12px; padding:12px 0; border-bottom:1px solid #f5f5f5; }
    .med-card:last-child { border-bottom:none; }
    .med-img { width:60px; height:60px; object-fit:cover; border-radius:8px; cursor:pointer; border:1px solid #eee; }
    .med-img-placeholder { width:60px; height:60px; background:#F3E5F5; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:24px; flex-shrink:0; }
    .med-body { flex:1; display:flex; flex-direction:column; gap:3px; }
    .med-name { font-size:14px; font-weight:700; color:#222; }
    .med-date { font-size:11px; color:#999; }
    .med-duration { font-size:11px; color:#7B1FA2; font-weight:600; }
    .med-notes { font-size:11px; color:#777; }
    .med-method { font-size:11px; background:#E8EAF6; color:#3949AB; padding:2px 6px; border-radius:6px; display:inline-block; }
    .remaining-badge { display:inline-flex; align-items:center; gap:3px; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:700; width:fit-content; }
    .remaining-badge.ok      { background:#E8F5E9; color:#2E7D32; }
    .remaining-badge.soon    { background:#FFF8E1; color:#F57F17; }
    .remaining-badge.urgent  { background:#FFEBEE; color:#C62828; }
    .remaining-badge.expired { background:#ECEFF1; color:#607D8B; }
    .med-right { display:flex; flex-direction:column; align-items:flex-end; gap:4px; }
    .med-total { font-size:15px; font-weight:700; color:#6A1B9A; }
    .med-detail { font-size:11px; color:#999; }
    .btn-del { background:none; border:none; cursor:pointer; font-size:15px; opacity:0.6; padding:2px; }
    .btn-del:hover { opacity:1; }
    .btn-edit { background:#1565C0; color:#fff; border:none; border-radius:8px; padding:10px 18px; cursor:pointer; font-size:14px; font-family:inherit; font-weight:500; }
    .loading-state { display:flex; justify-content:center; padding:60px; }
    .spinner-lg { width:40px; height:40px; border:4px solid #eee; border-top-color:#6A1B9A; border-radius:50%; animation:spin 0.8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .lightbox { position:fixed; inset:0; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:2000; cursor:zoom-out; }
    .lightbox img { max-width:90vw; max-height:90vh; border-radius:8px; object-fit:contain; }
  `]
})
export class ChronicDetailComponent implements OnInit {
  patient: ChronicPatient | null = null;
  medications: PatientMedication[] = [];
  banks: Bank[] = [];
  loading = true;
  totalSpent = 0;

  showMedForm = false;
  savingMed = false;
  balanceError = false;
  medName = '';
  medStartDate = '';
  medDurationValue: number = 30;
  medDurationUnit: 'days' | 'weeks' | 'months' = 'days';
  medPrice: number | null = null;
  medQty: number = 1;
  medPayment = '';
  medNotes = '';
  medImageFile: File | null = null;
  medImagePreview: string | null = null;
  lightboxUrl: string | null = null;

  showDeleteMed = false;
  deleteMedTarget: PatientMedication | null = null;

  constructor(
    private route: ActivatedRoute,
    private service: ChronicPatientService,
    private bankService: BankService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.bankService.getAll().subscribe({ next: res => this.banks = res.data.filter((b: Bank) => b.is_active) });
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.load(id);
  }

  load(id: number): void {
    this.loading = true;
    this.service.getById(id).subscribe({
      next: res => {
        this.patient = res.data;
        this.medications = res.data.medications ?? [];
        this.totalSpent = res.data.total_spent ?? 0;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  getBankLabel(method: string): string {
    if (!method) return '';
    const b = this.banks.find(b => b.name_fr.toLowerCase() === method.toLowerCase());
    return b ? b.name_fr : method;
  }

  durationUnitLabel(unit: string): string {
    const key = unit === 'days' ? 'CHRONIC.DAYS' : unit === 'weeks' ? 'CHRONIC.WEEKS' : 'CHRONIC.MONTHS';
    return this.translate.instant(key);
  }

  remainingClass(m: PatientMedication): string {
    const d = m.days_remaining;
    if (d < 0) return 'expired';
    if (d <= 7) return 'urgent';
    if (d <= 14) return 'soon';
    return 'ok';
  }

  remainingLabel(m: PatientMedication): string {
    const d = m.days_remaining;
    if (d < 0) return this.translate.instant('CHRONIC.EXPIRED');
    if (d === 0) return this.translate.instant('CHRONIC.EXPIRES_TODAY');
    return `${d} ${this.translate.instant('CHRONIC.DAYS_LEFT')}`;
  }

  onImageSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.medImageFile = file;
    const reader = new FileReader();
    reader.onload = e => this.medImagePreview = e.target?.result as string;
    reader.readAsDataURL(file);
  }

  addMedication(): void {
    if (!this.patient || !this.medName || !this.medStartDate || !this.medDurationValue || !this.medPayment) return;
    this.savingMed = true;
    this.balanceError = false;
    const fd = new FormData();
    fd.append('name', this.medName);
    fd.append('start_date', this.medStartDate);
    fd.append('duration_value', String(this.medDurationValue));
    fd.append('duration_unit', this.medDurationUnit);
    fd.append('price', String(this.medPrice ?? 0));
    fd.append('quantity', String(this.medQty));
    fd.append('payment_method', this.medPayment);
    if (this.medNotes) fd.append('notes', this.medNotes);
    if (this.medImageFile) fd.append('image', this.medImageFile);

    this.service.addMedication(this.patient.id, fd).subscribe({
      next: () => {
        this.savingMed = false;
        this.showMedForm = false;
        this.resetMedForm();
        this.load(this.patient!.id);
      },
      error: (err: any) => {
        this.savingMed = false;
        if (err?.error?.error === 'insufficient_balance') this.balanceError = true;
      }
    });
  }

  resetMedForm(): void {
    this.medName = ''; this.medStartDate = ''; this.medDurationValue = 30;
    this.medDurationUnit = 'days'; this.medPrice = null;
    this.medQty = 1; this.medPayment = ''; this.medNotes = '';
    this.medImageFile = null; this.medImagePreview = null;
  }

  askDeleteMed(m: PatientMedication): void { this.deleteMedTarget = m; this.showDeleteMed = true; }

  confirmDeleteMed(): void {
    if (!this.patient || !this.deleteMedTarget) return;
    this.service.removeMedication(this.patient.id, this.deleteMedTarget.id).subscribe({
      next: () => { this.showDeleteMed = false; this.deleteMedTarget = null; this.load(this.patient!.id); },
      error: () => { this.showDeleteMed = false; }
    });
  }

  openImage(url: string): void { this.lightboxUrl = url; }
}
