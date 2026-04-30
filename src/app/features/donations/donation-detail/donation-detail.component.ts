import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DonationService } from '../../../core/services/donation.service';
import { Donation } from '../../../core/models/donation.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-donation-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, PageHeaderComponent],
  template: `
    <app-page-header [title]="'DONATIONS.DETAIL' | translate" backLink="/donations">
      <div style="display:flex;gap:8px">
        <button class="btn btn-receipt" (click)="printReceipt()" *ngIf="donation">
          <span class="ms-icon" style="font-size:16px">receipt_long</span>
          {{ 'DONATIONS.DOWNLOAD_RECEIPT' | translate }}
        </button>
        <a *ngIf="donation" class="btn btn-edit" [routerLink]="['/donations', donation.id, 'edit']">
          ✏️ {{ 'COMMON.EDIT' | translate }}
        </a>
      </div>
    </app-page-header>

    <div *ngIf="loading" class="loading-state"><div class="spinner-lg"></div></div>

    <div *ngIf="!loading && donation" class="detail-layout" [class.has-images]="images.length > 0">

      <!-- LEFT -->
      <div class="col-left">
        <div class="card">
          <div class="donor-row">
            <div class="avatar">{{ donation.donor?.full_name?.charAt(0) || '?' }}</div>
            <div>
              <div class="donor-name">{{ donation.donor?.full_name || '—' }}</div>
            </div>
            <a class="btn-link" [routerLink]="['/donors', donation.donor_id]">
              {{ 'COMMON.VIEW' | translate }} →
            </a>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">{{ 'COMMON.AMOUNT' | translate }}</span>
              <span class="info-value text-blue">{{ donation.amount | number:'1.0-0' }} {{ 'COMMON.MRU' | translate }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ 'CONTRIBUTIONS.PAYMENT_METHOD' | translate }}</span>
              <span class="badge" [ngClass]="{
                'success': donation.payment_method === 'cash',
                'blue':    donation.payment_method === 'bankily',
                'orange':  donation.payment_method === 'sadad',
                'purple':  donation.payment_method === 'masrafi'
              }">{{ donation.payment_method || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ 'DONATIONS.PAID_AT' | translate }}</span>
              <span class="info-value">{{ donation.donated_at | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="info-item" *ngIf="donation.transaction_ref">
              <span class="info-label">{{ 'CONTRIBUTIONS.REF' | translate }}</span>
              <span class="info-value ref">{{ donation.transaction_ref }}</span>
            </div>
            <div class="info-item full-width" *ngIf="donation.notes">
              <span class="info-label">{{ 'COMMON.NOTES' | translate }}</span>
              <span class="info-value">{{ donation.notes }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT — gallery -->
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
    .donor-row { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0; }
    .avatar { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #1565C0, #7B1FA2); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; flex-shrink: 0; }
    .donor-name { font-weight: 700; font-size: 16px; color: #212121; }
    .btn-link { margin-left: auto; color: #1565C0; font-size: 13px; font-weight: 600; text-decoration: none; padding: 6px 12px; border: 1px solid #1565C0; border-radius: 8px; white-space: nowrap; }
    .btn-link:hover { background: #E3F2FD; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .info-item { display: flex; flex-direction: column; gap: 4px; }
    .info-item.full-width { grid-column: 1/-1; }
    .info-label { font-size: 12px; color: #999; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-size: 15px; font-weight: 600; color: #333; }
    .info-value.text-blue { color: #1565C0; font-size: 20px; }
    .info-value.ref { font-family: monospace; font-size: 13px; color: #555; }
    .badge { padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; display: inline-block; }
    .badge.success { background: #E8F5E9; color: #2E7D32; }
    .badge.blue { background: #E3F2FD; color: #1565C0; }
    .badge.orange { background: #FFF3E0; color: #E65100; }
    .badge.purple { background: #F3E5F5; color: #7B1FA2; }
    .card-title { font-size: 15px; font-weight: 700; color: #444; margin: 0 0 16px; }
    .btn-edit { background: #2E7D32; color: #fff; border: none; border-radius: 8px; padding: 10px 18px; cursor: pointer; font-size: 14px; font-weight: 500; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
    .btn-receipt { background: #fff; border: 1.5px solid #1565C0; color: #1565C0; border-radius: 8px; padding: 9px 16px; cursor: pointer; font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; transition: all .15s; font-family: inherit; }
    .btn-receipt:hover { background: #E3F2FD; }
    .ms-icon { font-family: 'Material Symbols Outlined'; font-style: normal; font-weight: normal; font-variation-settings: 'FILL' 1,'wght' 400; display: inline-block; line-height: 1; }
    .loading-state { display: flex; justify-content: center; padding: 60px; }
    .spinner-lg { width: 40px; height: 40px; border: 4px solid #eee; border-top-color: #1565C0; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .gallery-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .gallery-thumb { position: relative; border-radius: 10px; overflow: hidden; cursor: zoom-in; aspect-ratio: 4/3; background: #f5f5f5; }
    .gallery-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .2s; }
    .gallery-thumb:hover img { transform: scale(1.04); }
    .thumb-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0); display: flex; align-items: center; justify-content: center; transition: background .2s; }
    .gallery-thumb:hover .thumb-overlay { background: rgba(0,0,0,0.25); }
    .thumb-overlay .ms-icon { font-family: 'Material Symbols Outlined'; font-size: 32px; color: #fff; opacity: 0; transition: opacity .2s; }
    .gallery-thumb:hover .thumb-overlay .ms-icon { opacity: 1; }
    .lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.88); z-index: 9999; display: flex; align-items: center; justify-content: center; }
    .lb-img { max-width: 90vw; max-height: 88vh; border-radius: 8px; box-shadow: 0 8px 40px rgba(0,0,0,0.5); object-fit: contain; }
    .lb-close { position: absolute; top: 16px; right: 20px; background: rgba(255,255,255,0.15); border: none; color: #fff; font-size: 22px; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; }
    .lb-close:hover { background: rgba(255,255,255,0.3); }
    .lb-nav { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.15); border: none; color: #fff; font-size: 36px; width: 48px; height: 48px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .lb-nav:hover { background: rgba(255,255,255,0.3); }
    .lb-prev { left: 20px; }
    .lb-next { right: 20px; }
    .lb-counter { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); color: rgba(255,255,255,0.7); font-size: 13px; background: rgba(0,0,0,0.4); padding: 4px 12px; border-radius: 20px; }
  `]
})
export class DonationDetailComponent implements OnInit {
  donation: Donation | null = null;
  loading = true;
  images: string[] = [];
  lightboxIndex: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private service: DonationService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.service.getById(id).subscribe({
      next: res => {
        this.donation = res.data;
        this.images = res.data.screenshots?.map((s: {url: string}) => s.url)
          ?? (res.data.screenshot_url ? [res.data.screenshot_url] : []);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  printReceipt(): void {
    if (!this.donation) return;
    const lang = this.translate.currentLang || 'fr';
    const isAr = lang === 'ar';
    const dir = isAr ? 'rtl' : 'ltr';
    const valAlign = isAr ? 'left' : 'right';
    const d = this.donation;

    const lbl = isAr ? {
      title:      'جمعية معا للمستقبل الخيرية',
      subtitle:   'وصل تبرع',
      receiptNo:  'رقم الوصل',
      date:       'التاريخ',
      donorName:  'اسم المتبرع',
      phone:      'رقم الهاتف',
      amount:     'المبلغ المدفوع',
      currency:   'أوقية جديدة',
      payMethod:  'طريقة الدفع',
      ref:        'رقم المعاملة',
      notes:      'ملاحظات',
      footer:     'تقبل الله منا ومنكم صالح الأعمال 🤲',
      contact:    '44947777 | جمعية معا للمستقبل الخيرية',
    } : {
      title:      'جمعية معا للمستقبل الخيرية',
      subtitle:   'Reçu de don',
      receiptNo:  'N° Reçu',
      date:       'Date',
      donorName:  'Nom du donateur',
      phone:      'Téléphone',
      amount:     'Montant du don',
      currency:   'MRU',
      payMethod:  'Mode de paiement',
      ref:        'Réf. transaction',
      notes:      'Notes',
      footer:     "Qu'Allah accepte nos bonnes actions 🤲",
      contact:    '44947777 | Association Maa Lil Moustaqbal',
    };

    const donatedAt = d.donated_at
      ? new Date(d.donated_at).toLocaleDateString('fr-FR')
      : '—';

    const payMethodLabel: Record<string, string> = isAr
      ? { cash: 'نقداً', bankily: 'بنكيلي', sadad: 'سداد', masrafi: 'مصرفي' }
      : { cash: 'Espèces', bankily: 'Bankily', sadad: 'Sadad', masrafi: 'Masrafi' };

    const logoUrl = `${window.location.origin}/assets/images/logo.png`;

    const refRow = d.transaction_ref
      ? `<tr><td style="padding:4px 0;color:#555;font-size:11px">${lbl.ref}</td><td style="padding:4px 0;font-weight:600;text-align:${valAlign};font-family:monospace;font-size:11px">${d.transaction_ref}</td></tr>`
      : '';
    const notesRow = d.notes
      ? `<tr><td style="padding:4px 0;color:#555;font-size:11px">${lbl.notes}</td><td style="padding:4px 0;font-size:11px;text-align:${valAlign}">${d.notes}</td></tr>`
      : '';

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
        <span style="font-size:11px;color:#555">${lbl.receiptNo}: <strong style="color:#2E7D32">#${d.receipt_number ?? d.id}</strong></span>
        <span style="font-size:11px;color:#555">${lbl.date}: <strong>${donatedAt}</strong></span>
      </div>

      <!-- DONOR INFO -->
      <table style="width:100%;margin-bottom:10px;background:#f9f9f9;border-radius:6px;padding:4px 12px">
        <tr>
          <td style="padding:4px 0;color:#666;font-size:11px;width:45%">${lbl.donorName}</td>
          <td style="padding:4px 0;font-weight:700;font-size:13px;text-align:${valAlign}">${d.donor?.full_name || '—'}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#666;font-size:11px">${lbl.phone}</td>
          <td style="padding:4px 0;font-weight:600;font-size:12px;text-align:${valAlign}">${(d.donor as any)?.phone || '—'}</td>
        </tr>
      </table>

      <!-- PAYMENT DETAILS -->
      <div style="background:#F1F8E9;border-radius:8px;padding:10px 14px;margin-bottom:10px;border:1px solid #C8E6C9">
        <table style="width:100%">
          <tr>
            <td style="padding:4px 0;color:#555;font-size:11px">${lbl.amount}</td>
            <td style="padding:4px 0;font-weight:700;font-size:16px;color:#2E7D32;text-align:${valAlign}">${Math.round(d.amount).toLocaleString('fr-FR')} ${lbl.currency}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#555;font-size:11px">${lbl.payMethod}</td>
            <td style="padding:4px 0;font-weight:600;text-align:${valAlign}">${d.payment_method ? (payMethodLabel[d.payment_method] || d.payment_method) : '—'}</td>
          </tr>
          ${refRow}
          ${notesRow}
        </table>
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
          const scale = pageH / imgH;
          const fW = pageW * scale;
          const xOff = (pageW - fW) / 2;
          pdf.addImage(imgData, 'PNG', xOff, 0, fW, pageH);
        }

        const safeName = (d.donor?.full_name || String(d.id)).replace(/\s+/g, '_');
        const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
        const prefix = isAr ? `وصل_تبرع_${safeName}` : `recu_don_${safeName}`;
        pdf.save(`${prefix}_${dateStr}.pdf`);
      });
    });
  }

  openLightbox(i: number): void { this.lightboxIndex = i; }
  closeLightbox(): void { this.lightboxIndex = null; }
  prevImage(): void { if (this.lightboxIndex !== null) this.lightboxIndex = (this.lightboxIndex - 1 + this.images.length) % this.images.length; }
  nextImage(): void { if (this.lightboxIndex !== null) this.lightboxIndex = (this.lightboxIndex + 1) % this.images.length; }
}
