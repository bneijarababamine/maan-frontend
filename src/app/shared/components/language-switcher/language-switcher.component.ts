import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button class="lang-btn" (click)="lang.toggle()">
      <span class="lang-flag">{{ lang.isArabic() ? '🇫🇷' : '🇲🇷' }}</span>
      <span class="lang-text">{{ lang.isArabic() ? 'Français' : 'العربية' }}</span>
    </button>
  `,
  styles: [`
    .lang-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #F4F6F9;
      color: #424242;
      border: 1px solid #E0E0E0;
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
    }
    .lang-btn:hover {
      background: #EEEEEE;
      border-color: #BDBDBD;
    }
    .lang-flag { font-size: 16px; line-height: 1; }
    .lang-text { color: #424242; }
  `]
})
export class LanguageSwitcherComponent {
  constructor(public lang: LanguageService) {}
}
