import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { LanguageSwitcherComponent } from '../../../shared/components/language-switcher/language-switcher.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, LanguageSwitcherComponent],
  template: `
    <div class="login-page">

      <!-- Animated background blobs -->
      <div class="bg-blob blob1"></div>
      <div class="bg-blob blob2"></div>
      <div class="bg-blob blob3"></div>

      <!-- Lang switcher -->
      <div class="lang-top">
        <app-language-switcher></app-language-switcher>
      </div>

      <!-- Card -->
      <div class="login-card">

        <!-- Logo + Name -->
        <div class="brand">
          <img src="assets/images/logo.jpg" alt="Logo" class="brand-logo"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
          <div class="brand-logo-fallback" style="display:none">🕌</div>
          <div class="brand-text">
            <div class="brand-ar">جمعية معا للمستقبل</div>
            <div class="brand-sub">{{ 'AUTH.SUBTITLE' | translate }}</div>
          </div>
        </div>

        <div class="divider"></div>

        <h2 class="login-title">{{ 'AUTH.LOGIN' | translate }}</h2>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="login-form" autocomplete="off">

          <!-- Email -->
          <div class="field">
            <label>{{ 'AUTH.EMAIL' | translate }}</label>
            <div class="input-wrap">
              <span class="input-icon">✉️</span>
              <input type="email" formControlName="email"
                     [class.error]="hasError('email')"
                     [placeholder]="'AUTH.EMAIL' | translate">
            </div>
          </div>

          <!-- Password -->
          <div class="field">
            <label>{{ 'AUTH.PASSWORD' | translate }}</label>
            <div class="input-wrap">
              <span class="input-icon">🔒</span>
              <input [type]="showPwd ? 'text' : 'password'" formControlName="password"
                     [class.error]="hasError('password')"
                     [placeholder]="'AUTH.PASSWORD' | translate">
              <button type="button" class="toggle-pwd" (click)="showPwd = !showPwd">
                {{ showPwd ? '🙈' : '👁' }}
              </button>
            </div>
          </div>

          <!-- Error -->
          <div class="alert-error" *ngIf="errorMsg">
            ⚠️ {{ 'AUTH.ERROR' | translate }}
          </div>

          <!-- Submit -->
          <button type="submit" class="btn-login" [disabled]="loading">
            <span *ngIf="loading" class="spinner"></span>
            <span *ngIf="!loading">{{ 'AUTH.SIGN_IN' | translate }}</span>
            <span *ngIf="loading">{{ 'COMMON.LOADING' | translate }}</span>
          </button>

        </form>

        <div class="login-footer">
          جمعية معا للمستقبل الخيرية &copy; {{ year }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(145deg, #0D2B5E 0%, #0D6B3C 60%, #E8A020 100%);
      position: relative;
      overflow: hidden;
    }

    /* Animated background blobs */
    .bg-blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.18;
      animation: blobMove 12s ease-in-out infinite alternate;
    }
    .blob1 { width: 500px; height: 500px; background: #27AE60; top: -100px; left: -100px; animation-delay: 0s; }
    .blob2 { width: 400px; height: 400px; background: #E8A020; bottom: -80px; right: -80px; animation-delay: 3s; }
    .blob3 { width: 300px; height: 300px; background: #1A4A9B; top: 50%; left: 50%; transform: translate(-50%,-50%); animation-delay: 6s; }
    @keyframes blobMove {
      from { transform: scale(1) translate(0,0); }
      to   { transform: scale(1.15) translate(20px, 20px); }
    }

    .lang-top { position: absolute; top: 20px; right: 24px; z-index: 10; }
    :host-context(body.rtl) .lang-top { right: auto; left: 24px; }

    /* Card */
    .login-card {
      background: rgba(255,255,255,0.97);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      padding: 44px 40px 32px;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 30px 80px rgba(0,0,0,0.35);
      position: relative;
      z-index: 1;
      animation: slideUp 0.4s ease;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* Brand */
    .brand {
      display: flex;
      align-items: center;
      gap: 16px;
      justify-content: center;
      margin-bottom: 20px;
    }
    .brand-logo {
      width: 72px;
      height: 72px;
      object-fit: contain;
      drop-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .brand-logo-fallback {
      width: 72px; height: 72px;
      background: linear-gradient(135deg, #1A8A4A, #1A4A9B);
      border-radius: 18px;
      display: flex; align-items: center; justify-content: center;
      font-size: 36px;
    }
    .brand-text { text-align: left; }
    :host-context(body.rtl) .brand-text { text-align: right; }
    .brand-ar {
      font-family: 'Tajawal', 'Noto Sans Arabic', sans-serif;
      font-size: 20px;
      font-weight: 800;
      background: linear-gradient(135deg, #0D6B3C, #1A4A9B);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1.2;
    }
    .brand-sub { font-size: 12px; color: #8a9ab0; margin-top: 2px; }

    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
      margin-bottom: 20px;
    }

    .login-title {
      margin: 0 0 24px;
      font-size: 18px;
      font-weight: 700;
      color: #1A2A40;
      text-align: center;
    }

    /* Form */
    .login-form { display: flex; flex-direction: column; gap: 18px; }

    .field { display: flex; flex-direction: column; gap: 7px; }
    .field label { font-size: 13px; font-weight: 600; color: #4a5568; }

    .input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .input-icon {
      position: absolute;
      left: 14px;
      font-size: 15px;
      pointer-events: none;
    }
    :host-context(body.rtl) .input-icon { left: auto; right: 14px; }

    .input-wrap input {
      width: 100%;
      padding: 12px 44px;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      font-size: 14px;
      font-family: inherit;
      outline: none;
      background: #f8fafc;
      color: #1A2A40;
      transition: all 0.2s;
    }
    .input-wrap input:focus {
      border-color: #1A8A4A;
      background: #fff;
      box-shadow: 0 0 0 4px rgba(26,138,74,0.10);
    }
    .input-wrap input.error { border-color: #C62828; }

    .toggle-pwd {
      position: absolute;
      right: 12px;
      background: none; border: none;
      font-size: 16px; cursor: pointer; padding: 4px;
    }
    :host-context(body.rtl) .toggle-pwd { right: auto; left: 12px; }

    .alert-error {
      background: #FFEBEE;
      color: #C62828;
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 13px;
      font-weight: 500;
    }

    .btn-login {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #1A8A4A 0%, #0D6B3C 50%, #1A4A9B 100%);
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
      box-shadow: 0 4px 20px rgba(26,138,74,0.35);
      margin-top: 6px;
    }
    .btn-login:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(26,138,74,0.45);
    }
    .btn-login:disabled { opacity: 0.65; cursor: not-allowed; }

    .spinner {
      width: 18px; height: 18px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .login-footer {
      text-align: center;
      margin-top: 24px;
      font-size: 11px;
      color: #a0aec0;
    }

    @media (max-width: 480px) {
      .login-card { padding: 32px 20px 24px; margin: 16px; border-radius: 20px; }
    }
  `]
})
export class LoginComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  errorMsg = false;
  showPwd = false;
  year = new Date().getFullYear();

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private lang: LanguageService
  ) {}

  ngOnInit(): void {
    this.lang.init();
    if (this.auth.isLoggedIn()) this.router.navigate(['/dashboard']);
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  hasError(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMsg = false;
    const { email, password } = this.form.value;
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => { this.loading = false; this.errorMsg = true; }
    });
  }
}
