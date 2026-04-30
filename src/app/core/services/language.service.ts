import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private currentLangSubject = new BehaviorSubject<string>('fr');
  currentLang$ = this.currentLangSubject.asObservable();

  constructor(private translate: TranslateService) {}

  init(): void {
    const saved = localStorage.getItem('lang') || 'fr';
    this.setLanguage(saved as 'fr' | 'ar');
  }

  setLanguage(lang: 'fr' | 'ar'): void {
    this.currentLangSubject.next(lang);
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.body.classList.toggle('rtl', lang === 'ar');
    document.body.classList.toggle('ltr', lang !== 'ar');
  }

  toggle(): void {
    this.setLanguage(this.currentLangSubject.value === 'fr' ? 'ar' : 'fr');
  }

  isArabic(): boolean {
    return this.currentLangSubject.value === 'ar';
  }

  get currentLang(): string {
    return this.currentLangSubject.value;
  }
}
