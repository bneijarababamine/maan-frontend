import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div class="page-header">
      <div class="page-header-left">
        <button *ngIf="backLink" class="back-btn" [routerLink]="backLink">
          ← {{ 'COMMON.BACK' | translate }}
        </button>
        <div>
          <h1 class="page-title">{{ title }}</h1>
          <p *ngIf="subtitle" class="page-subtitle">{{ subtitle }}</p>
        </div>
      </div>
      <div class="page-header-actions">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .page-header-left { display: flex; align-items: center; gap: 12px; }
    .back-btn {
      background: none;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 6px 12px;
      cursor: pointer;
      color: #555;
      font-size: 14px;
    }
    .back-btn:hover { background: #f5f5f5; }
    .page-title { margin: 0; font-size: 24px; font-weight: 700; color: #1a1a2e; }
    .page-subtitle { margin: 4px 0 0; color: #888; font-size: 14px; }
    .page-header-actions { display: flex; gap: 8px; align-items: center; }
  `]
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() backLink: string | null = null;
}
