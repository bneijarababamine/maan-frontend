import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageSwitcherComponent } from '../../components/language-switcher/language-switcher.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, TranslateModule, LanguageSwitcherComponent, ConfirmDialogComponent],
  template: `
    <header class="topbar">
      <div class="topbar-right">
        <app-language-switcher></app-language-switcher>

        <div class="user-info" *ngIf="user$ | async as user">
          <div class="user-details">
            <div class="user-name">{{ user.name }}</div>
            <div class="user-role">{{ 'AUTH_EXTRA.ROLE_ADMIN' | translate }}</div>
          </div>
          <div class="user-avatar">{{ (user.name || '?').charAt(0).toUpperCase() }}</div>
        </div>

        <button class="logout-btn" (click)="showLogout = true" [title]="'AUTH_EXTRA.LOGOUT' | translate">
          <span class="mat-icon">logout</span>
        </button>
      </div>
    </header>

    <!-- Logout confirmation -->
    <app-confirm-dialog
      [visible]="showLogout"
      type="warning"
      [title]="'AUTH_EXTRA.LOGOUT' | translate"
      [message]="'AUTH_EXTRA.LOGOUT_MSG' | translate"
      [confirmLabel]="'AUTH_EXTRA.LOGOUT_CONFIRM' | translate"
      iconName="logout"
      (confirmed)="doLogout()"
      (cancelled)="showLogout = false">
    </app-confirm-dialog>
  `,
  styles: [`
    .topbar {
      height: 60px;
      background: #fff;
      border-bottom: 1px solid #EEEEEE;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 24px;
      position: fixed;
      top: 0; left: 200px; right: 0;
      z-index: 99;
    }
    :host-context(body.rtl) .topbar { left: 0; right: 200px; }

    .topbar-right { display: flex; align-items: center; gap: 12px; }

    .user-info { display: flex; align-items: center; gap: 10px; }
    .user-details { text-align: right; }
    :host-context(body.rtl) .user-details { text-align: left; }
    .user-name { font-size: 13px; font-weight: 600; color: #212121; line-height: 1.2; }
    .user-role { font-size: 11px; color: #9E9E9E; }

    .user-avatar {
      width: 34px; height: 34px;
      border-radius: 50%;
      background: #2D5A27;
      color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 14px;
      flex-shrink: 0;
    }

    .logout-btn {
      width: 34px; height: 34px;
      border-radius: 8px;
      background: none;
      border: 1px solid #E0E0E0;
      color: #757575;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.15s;
    }
    .logout-btn:hover { background: #FFEBEE; border-color: #FFCDD2; color: #C62828; }

    .mat-icon {
      font-family: 'Material Symbols Outlined';
      font-size: 18px;
      font-variation-settings: 'FILL' 0, 'wght' 300;
    }
  `]
})
export class TopbarComponent {
  user$ = this.auth.user$;
  showLogout = false;

  constructor(private auth: AuthService) {}

  doLogout(): void {
    this.showLogout = false;
    this.auth.logout();
  }
}
