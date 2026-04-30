import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ContributionService } from '../../../core/services/contribution.service';
import { Contribution } from '../../../core/models/contribution.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

@Component({
  selector: 'app-contribution-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, PageHeaderComponent],
  template: `
    <app-page-header [title]="'CONTRIBUTIONS.DETAIL' | translate" backLink="/contributions">
      <div style="display:flex;gap:8px">
        <button class="btn btn-receipt" (click)="printReceipt()" *ngIf="contribution">
          <span class="ms-icon" style="font-size:16px">receipt_long</span>
          {{ 'CONTRIBUTIONS.VIEW_RECEIPT' | translate }}
        </button>
        <a *ngIf="contribution" class="btn btn-edit" [routerLink]="['/contributions', contribution.id, 'edit']">
          ✏️ {{ 'COMMON.EDIT' | translate }}
        </a>
      </div>
    </app-page-header>

    <div *ngIf="loading" class="loading-state"><div class="spinner-lg"></div></div>

    <div *ngIf="!loading && contribution" class="detail-layout" [class.has-images]="images.length > 0">

      <!-- LEFT column -->
      <div class="col-left">
        <!-- Info card -->
        <div class="card info-card">
          <div class="member-row">
            <div class="avatar">{{ contribution.member?.full_name?.charAt(0) || '?' }}</div>
            <div>
              <div class="member-name">{{ contribution.member?.full_name || '—' }}</div>
              <div class="member-phone">{{ contribution.member?.phone || '' }}</div>
            </div>
            <a class="btn-link" [routerLink]="['/members', contribution.member_id]">
              {{ 'COMMON.VIEW' | translate }} →
            </a>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">{{ 'CONTRIBUTIONS.TOTAL' | translate }}</span>
              <span class="info-value text-green">{{ contribution.total_amount | number:'1.0-0' }} {{ 'COMMON.MRU' | translate }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ 'CONTRIBUTIONS.MONTHS_COUNT' | translate }}</span>
              <span class="info-value">{{ contribution.months_count }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ 'CONTRIBUTIONS.PAYMENT_METHOD' | translate }}</span>
              <span class="badge" [ngClass]="{
                'success': contribution.payment_method === 'cash',
                'blue':    contribution.payment_method === 'bankily',
                'orange':  contribution.payment_method === 'sadad',
                'purple':  contribution.payment_method === 'masrafi'
              }">{{ contribution.payment_method }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ 'CONTRIBUTIONS.PAID_AT' | translate }}</span>
              <span class="info-value">{{ contribution.paid_at | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="info-item" *ngIf="contribution.transaction_ref">
              <span class="info-label">{{ 'CONTRIBUTIONS.REF' | translate }}</span>
              <span class="info-value ref">{{ contribution.transaction_ref }}</span>
            </div>
            <div class="info-item" *ngIf="contribution.notes">
              <span class="info-label">{{ 'COMMON.NOTES' | translate }}</span>
              <span class="info-value">{{ contribution.notes }}</span>
            </div>
          </div>
        </div>

        <!-- Months covered -->
        <div class="card">
          <h3 class="card-title">{{ 'CONTRIBUTIONS.MONTHS_COVERED' | translate }}</h3>
          <div class="months-list">
            <ng-container *ngFor="let group of groupedMonths">
              <div class="year-group">
                <div class="year-label">{{ group.year }}</div>
                <div class="month-chips">
                  <span *ngFor="let m of group.months" class="month-chip">{{ m }}</span>
                </div>
              </div>
            </ng-container>
          </div>
        </div>
      </div>

      <!-- RIGHT column — image gallery -->
      <div *ngIf="images.length > 0" class="col-right">
        <div class="card gallery-card">
          <h3 class="card-title">🧾 {{ 'CONTRIBUTIONS.RECEIPTS' | translate }}</h3>
          <div class="gallery-grid">
            <div *ngFor="let img of images; let i = index" class="gallery-thumb" (click)="openLightbox(i)">
              <img [src]="img" alt="reçu {{ i + 1 }}" loading="lazy">
              <div class="thumb-overlay"><span class="ms-icon">zoom_in</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Lightbox -->
    <div *ngIf="lightboxIndex !== null" class="lightbox" (click)="closeLightbox()">
      <button class="lb-close" (click)="closeLightbox()">✕</button>
      <button *ngIf="images.length > 1" class="lb-nav lb-prev" (click)="$event.stopPropagation(); prevImage()">‹</button>
      <img class="lb-img" [src]="images[lightboxIndex!]" (click)="$event.stopPropagation()" alt="reçu">
      <button *ngIf="images.length > 1" class="lb-nav lb-next" (click)="$event.stopPropagation(); nextImage()">›</button>
      <div class="lb-counter" *ngIf="images.length > 1">{{ lightboxIndex! + 1 }} / {{ images.length }}</div>
    </div>
  `,
  styles: [`
    .detail-layout { display: grid; grid-template-columns: 1fr; gap: 20px; }
    .detail-layout.has-images { grid-template-columns: 1fr 340px; align-items: start; }
    @media (max-width: 900px) { .detail-layout.has-images { grid-template-columns: 1fr; } }
    .col-left { display: flex; flex-direction: column; gap: 20px; }
    .col-right { position: sticky; top: 80px; }
    .card { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .member-row { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0; }
    .avatar { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #2E7D32, #1565C0); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; flex-shrink: 0; }
    .member-name { font-weight: 700; font-size: 16px; color: #212121; }
    .member-phone { font-size: 13px; color: #888; margin-top: 2px; }
    .btn-link { margin-left: auto; color: #2E7D32; font-size: 13px; font-weight: 600; text-decoration: none; padding: 6px 12px; border: 1px solid #2E7D32; border-radius: 8px; white-space: nowrap; }
    .btn-link:hover { background: #E8F5E9; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .info-item { display: flex; flex-direction: column; gap: 4px; }
    .info-label { font-size: 12px; color: #999; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-size: 15px; font-weight: 600; color: #333; }
    .info-value.text-green { color: #2E7D32; font-size: 18px; }
    .info-value.ref { font-family: monospace; font-size: 13px; color: #555; }
    .badge { padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; display: inline-block; }
    .badge.success { background: #E8F5E9; color: #2E7D32; }
    .badge.blue { background: #E3F2FD; color: #1565C0; }
    .badge.orange { background: #FFF3E0; color: #E65100; }
    .badge.purple { background: #F3E5F5; color: #7B1FA2; }
    .card-title { font-size: 15px; font-weight: 700; color: #444; margin: 0 0 16px; }
    .year-group { margin-bottom: 16px; }
    .year-label { font-size: 13px; font-weight: 700; color: #888; margin-bottom: 8px; text-transform: uppercase; }
    .month-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .month-chip { padding: 6px 14px; background: #E8F5E9; color: #2E7D32; border-radius: 20px; font-size: 13px; font-weight: 600; }
    .btn-edit { background: #2E7D32; color: #fff; border: none; border-radius: 8px; padding: 10px 18px; cursor: pointer; font-size: 14px; font-weight: 500; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
    .btn-receipt { background: #fff; border: 1.5px solid #1565C0; color: #1565C0; border-radius: 8px; padding: 9px 16px; cursor: pointer; font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; transition: all .15s; font-family: inherit; }
    .btn-receipt:hover { background: #E3F2FD; }
    .ms-icon { font-family: 'Material Symbols Outlined'; font-style: normal; font-weight: normal; font-variation-settings: 'FILL' 1,'wght' 400; display: inline-block; line-height: 1; }
    .loading-state { display: flex; justify-content: center; padding: 60px; }
    .spinner-lg { width: 40px; height: 40px; border: 4px solid #eee; border-top-color: #2E7D32; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .gallery-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .gallery-grid:has(:only-child) { grid-template-columns: 1fr; }
    .gallery-thumb { position: relative; border-radius: 10px; overflow: hidden; cursor: zoom-in; aspect-ratio: 4/3; background: #f5f5f5; }
    .gallery-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .2s; }
    .gallery-thumb:hover img { transform: scale(1.04); }
    .thumb-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0); display: flex; align-items: center; justify-content: center; transition: background .2s; }
    .gallery-thumb:hover .thumb-overlay { background: rgba(0,0,0,0.25); }
    .thumb-overlay .ms-icon { font-family: 'Material Symbols Outlined'; font-size: 32px; color: #fff; opacity: 0; transition: opacity .2s; }
    .gallery-thumb:hover .thumb-overlay .ms-icon { opacity: 1; }
    .lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.88); z-index: 9999; display: flex; align-items: center; justify-content: center; }
    .lb-img { max-width: 90vw; max-height: 88vh; border-radius: 8px; box-shadow: 0 8px 40px rgba(0,0,0,0.5); object-fit: contain; }
    .lb-close { position: absolute; top: 16px; right: 20px; background: rgba(255,255,255,0.15); border: none; color: #fff; font-size: 22px; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; line-height: 1; }
    .lb-close:hover { background: rgba(255,255,255,0.3); }
    .lb-nav { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.15); border: none; color: #fff; font-size: 36px; width: 48px; height: 48px; border-radius: 50%; cursor: pointer; line-height: 1; display: flex; align-items: center; justify-content: center; }
    .lb-nav:hover { background: rgba(255,255,255,0.3); }
    .lb-prev { left: 20px; }
    .lb-next { right: 20px; }
    .lb-counter { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); color: rgba(255,255,255,0.7); font-size: 13px; background: rgba(0,0,0,0.4); padding: 4px 12px; border-radius: 20px; }
  `]
})
export class ContributionDetailComponent implements OnInit {
  contribution: Contribution | null = null;
  loading = true;
  groupedMonths: { year: number; months: string[] }[] = [];
  images: string[] = [];
  lightboxIndex: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private service: ContributionService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.service.getById(id).subscribe({
      next: res => {
        this.contribution = res.data;
        this.buildGroupedMonths();
        this.buildImages();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  private buildGroupedMonths(): void {
    if (!this.contribution?.months) return;
    const map = new Map<number, number[]>();
    for (const m of this.contribution.months) {
      if (!map.has(m.year)) map.set(m.year, []);
      map.get(m.year)!.push(m.month);
    }
    this.groupedMonths = Array.from(map.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([year, months]) => ({
        year,
        months: months.sort((a, b) => a - b).map(m => MONTHS_FR[m - 1])
      }));
  }

  private buildImages(): void {
    if (this.contribution?.screenshots?.length) {
      this.images = this.contribution.screenshots.map(s => s.url);
    } else if (this.contribution?.screenshot_url) {
      this.images = [this.contribution.screenshot_url];
    } else {
      this.images = [];
    }
  }

  /** Returns the first month after the last paid month (as reminder date string). */
  private getReminderDate(isAr: boolean): string {
    if (!this.contribution?.months?.length) return '—';
    const sorted = [...this.contribution.months].sort((a, b) =>
      a.year !== b.year ? b.year - a.year : b.month - a.month
    );
    const last = sorted[0];
    let nm = last.month + 1, ny = last.year;
    if (nm > 12) { nm = 1; ny++; }
    const months = isAr ? MONTHS_AR : MONTHS_FR;
    return `${months[nm - 1]} ${ny}`;
  }

  /** Build month list HTML for the receipt. Full years show as "Année XXXX" chip. */
  private buildMonthsHtml(isAr: boolean, textAlign: string): string {
    if (!this.contribution?.months?.length) return '—';
    const map = new Map<number, number[]>();
    for (const m of this.contribution.months) {
      if (!map.has(m.year)) map.set(m.year, []);
      map.get(m.year)!.push(m.month);
    }
    const monthNames = isAr ? MONTHS_AR : MONTHS_FR;
    const yearWord = isAr ? 'سنة' : 'Année';
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, months]) => {
        const sorted = months.sort((a, b) => a - b);
        if (sorted.length === 12) {
          return `<div style="margin-bottom:6px;text-align:${textAlign}">
            <span style="display:inline-block;background:#C8E6C9;color:#1B5E20;border-radius:12px;padding:3px 16px;font-size:12px;font-weight:700;margin:2px">${yearWord} ${year}</span>
          </div>`;
        }
        const chips = sorted
          .map(m => `<span style="display:inline-block;background:#E8F5E9;color:#2E7D32;border-radius:12px;padding:2px 10px;font-size:11px;font-weight:700;margin:2px">${monthNames[m - 1]}</span>`)
          .join(' ');
        return `<div style="margin-bottom:6px;text-align:${textAlign}"><span style="font-size:11px;color:#888;font-weight:600">${year}&nbsp;</span>${chips}</div>`;
      }).join('');
  }

  printReceipt(): void {
    if (!this.contribution) return;
    const lang = this.translate.currentLang || 'fr';
    const isAr = lang === 'ar';
    const dir = isAr ? 'rtl' : 'ltr';
    const valAlign = isAr ? 'left' : 'right';
    const c = this.contribution;

    const lbl = isAr ? {
      title:       'جمعية معا للمستقبل الخيرية',
      subtitle:    'وصل اشتراك',
      receiptNo:   'رقم الوصل',
      date:        'التاريخ',
      memberName:  'اسم المنتسب',
      phone:       'رقم الهاتف',
      totalPaid:   'المبلغ المدفوع',
      currency:    'أوقية جديدة',
      monthsCount: 'عدد الأشهر',
      monthUnit:   'شهر',
      perMonth:    'أوقية جديدة/شهر',
      payMethod:   'طريقة الدفع',
      ref:         'رقم المعاملة',
      monthsCov:   'الفترة المغطاة',
      reminderMsg: 'انتهاء الاشتراك',
      note:        'يمكنك دفع شهر واحد أو عدة أشهر. سيتم إشعارك عند انتهاء الفترة المدفوعة.',
      footer:      'تقبل الله منا ومنكم صالح الأعمال 🤲',
      contact:     '44947777 | جمعية معا للمستقبل الخيرية',
    } : {
      title:       'جمعية معا للمستقبل الخيرية',
      subtitle:    'Reçu de cotisation',
      receiptNo:   'N° Reçu',
      date:        'Date',
      memberName:  'Nom du membre',
      phone:       'Téléphone',
      totalPaid:   'Montant payé',
      currency:    'MRU',
      monthsCount: 'Nombre de mois',
      monthUnit:   'mois',
      perMonth:    'MRU/mois',
      payMethod:   'Mode de paiement',
      ref:         'Réf. transaction',
      monthsCov:   'Période couverte',
      reminderMsg: 'Rappel prévu fin',
      note:        'Vous pouvez payer un ou plusieurs mois. Un rappel sera envoyé à l\'échéance.',
      footer:      'Qu\'Allah accepte nos bonnes actions 🤲',
      contact:     '44947777 | Association Maa Lil Moustaqbal',
    };

    const paidAt = c.paid_at
      ? new Date(c.paid_at).toLocaleDateString('fr-FR')
      : '—';

    const amountPerMonth = c.months_count > 0
      ? Math.round(c.total_amount / c.months_count)
      : (c as any).amount_per_month || 200;

    const payMethodLabel: Record<string, string> = isAr
      ? { cash: 'نقداً', bankily: 'بنكيلي', sadad: 'سداد', masrafi: 'مصرفي' }
      : { cash: 'Espèces', bankily: 'Bankily', sadad: 'Sadad', masrafi: 'Masrafi' };

    const logoUrl = `${window.location.origin}/assets/images/logo.png`;
    const reminderDate = this.getReminderDate(isAr);
    const monthsHtml = this.buildMonthsHtml(isAr, isAr ? 'right' : 'left');

    const refRow = c.transaction_ref
      ? `<tr><td style="padding:4px 0;color:#666;font-size:11px">${lbl.ref}</td><td style="padding:4px 0;font-weight:600;text-align:${valAlign};font-family:monospace;font-size:11px">${c.transaction_ref}</td></tr>`
      : '';

    const contactText = isAr
      ? `سنتواصل معكم في نهاية شهر ${reminderDate}`
      : `Nous vous contacterons fin ${reminderDate}`;

    const container = document.createElement('div');
    container.style.cssText = [
      'position:fixed', 'top:-99999px', 'left:-99999px',
      'width:520px', 'background:#fff', 'padding:22px 28px',
      `font-family:'Cairo',Arial,sans-serif`,
      'font-size:12px', 'color:#212121', `direction:${dir}`,
      'display:flex', 'flex-direction:column', 'min-height:735px',
    ].join(';');

    container.innerHTML = `
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">

      <!-- HEADER -->
      <div style="display:flex;align-items:center;gap:14px;border-bottom:2px solid #2E7D32;padding-bottom:14px;margin-bottom:14px;${isAr ? 'flex-direction:row-reverse' : ''}">
        <img src="${logoUrl}" style="height:82px;width:82px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'">
        <div style="flex:1;text-align:center">
          <div style="font-size:17px;font-weight:700;color:#2E7D32">${lbl.title}</div>
          <div style="font-size:14px;font-weight:700;color:#333;border:1.5px solid #2E7D32;display:inline-block;padding:3px 18px;border-radius:6px;margin-top:5px">${lbl.subtitle}</div>
        </div>
      </div>

      <!-- RECEIPT # + DATE -->
      <div style="display:flex;justify-content:space-between;margin-bottom:10px;background:#F1F8E9;border-radius:6px;padding:7px 12px">
        <span style="font-size:11px;color:#555">${lbl.receiptNo}: <strong style="color:#2E7D32">#${c.receipt_number ?? c.id}</strong></span>
        <span style="font-size:11px;color:#555">${lbl.date}: <strong>${paidAt}</strong></span>
      </div>

      <!-- MEMBER INFO -->
      <table style="width:100%;margin-bottom:10px;background:#f9f9f9;border-radius:6px;padding:4px 12px">
        <tr>
          <td style="padding:4px 0;color:#666;font-size:11px;width:45%">${lbl.memberName}</td>
          <td style="padding:4px 0;font-weight:700;font-size:13px;text-align:${valAlign}">${c.member?.full_name || '—'}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#666;font-size:11px">${lbl.phone}</td>
          <td style="padding:4px 0;font-weight:600;font-size:12px;text-align:${valAlign}">${c.member?.phone || '—'}</td>
        </tr>
      </table>

      <!-- PAYMENT DETAILS -->
      <div style="background:#F1F8E9;border-radius:8px;padding:10px 14px;margin-bottom:10px;border:1px solid #C8E6C9">
        <table style="width:100%">
          <tr>
            <td style="padding:4px 0;color:#555;font-size:11px">${lbl.totalPaid}</td>
            <td style="padding:4px 0;font-weight:700;font-size:15px;color:#2E7D32;text-align:${valAlign}">${Math.round(c.total_amount).toLocaleString('fr-FR')} ${lbl.currency}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#555;font-size:11px">${lbl.monthsCount}</td>
            <td style="padding:4px 0;font-weight:600;text-align:${valAlign}">${c.months_count} ${lbl.monthUnit} <span style="font-size:10px;color:#888">(${amountPerMonth} ${lbl.perMonth})</span></td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#555;font-size:11px">${lbl.payMethod}</td>
            <td style="padding:4px 0;font-weight:600;text-align:${valAlign}">${payMethodLabel[c.payment_method] || c.payment_method}</td>
          </tr>
          ${refRow}
        </table>
      </div>

      <!-- MONTHS COVERED -->
      <div style="background:#E8F5E9;border-radius:8px;padding:10px 14px;margin-bottom:10px;border:1px solid #C8E6C9">
        <div style="font-weight:700;font-size:12px;color:#2E7D32;margin-bottom:6px">${lbl.monthsCov}</div>
        ${monthsHtml}
      </div>

      <!-- REMINDER -->
      <div style="background:#F1F8E9;border-radius:8px;padding:8px 14px;margin-bottom:6px;border:1px solid #A5D6A7;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:11px;color:#555;font-weight:600">${lbl.reminderMsg}</span>
        <span style="font-size:13px;font-weight:700;color:#2E7D32">${reminderDate}</span>
      </div>

      <!-- CONTACT RED TEXT -->
      <div style="color:#C62828;font-size:11px;font-weight:700;margin-bottom:10px;text-align:${isAr ? 'right' : 'left'}">
        ⚠ ${contactText}
      </div>

      <!-- NOTE -->
      <div style="font-size:10px;color:#999;font-style:italic;margin-bottom:0;text-align:${isAr ? 'right' : 'left'}">
        ${lbl.note}
      </div>

      <!-- SPACER pushes footer to bottom -->
      <div style="flex:1"></div>

      <!-- FOOTER -->
      <div style="border-top:2px solid #2E7D32;padding-top:10px;text-align:center">
        <div style="font-size:13px;font-weight:700;color:#2E7D32;margin-bottom:3px">${lbl.footer}</div>
        <div style="font-size:10px;color:#999">${lbl.contact}</div>
      </div>`;

    document.body.appendChild(container);

    document.fonts.load('600 12px Cairo').then(() => {
      html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(canvas => {
        document.body.removeChild(container);

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const imgH = (canvas.height / canvas.width) * pageW;

        if (imgH <= pageH) {
          pdf.addImage(imgData, 'PNG', 0, 0, pageW, imgH);
        } else {
          // scale down to fit on one page
          const scale = pageH / imgH;
          const fW = pageW * scale;
          const fH = pageH;
          const xOff = (pageW - fW) / 2;
          pdf.addImage(imgData, 'PNG', xOff, 0, fW, fH);
        }

        const safeName = (c.member?.full_name || String(c.id)).replace(/\s+/g, '_');
        const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
        const prefix = isAr ? `وصل_انتساب_${safeName}` : `recu_cotisation_${safeName}`;
        pdf.save(`${prefix}_${dateStr}.pdf`);
      });
    });
  }

  openLightbox(index: number): void { this.lightboxIndex = index; }
  closeLightbox(): void { this.lightboxIndex = null; }
  prevImage(): void { if (this.lightboxIndex !== null) this.lightboxIndex = (this.lightboxIndex - 1 + this.images.length) % this.images.length; }
  nextImage(): void { if (this.lightboxIndex !== null) this.lightboxIndex = (this.lightboxIndex + 1) % this.images.length; }
}
