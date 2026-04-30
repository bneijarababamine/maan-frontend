import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

interface NavItem {
  icon: string;
  labelKey: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLinkActive, TranslateModule],
  template: `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <img src="assets/images/logo.png" alt="Logo" class="sidebar-logo"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
        <div class="sidebar-logo-fallback" style="display:none">م</div>
        <div class="sidebar-brand-text">
          <div class="brand-name">معا للمستقبل</div>
          <div class="brand-sub">الجمعية الخيرية</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <a *ngFor="let item of navItems"
           [routerLink]="item.route"
           routerLinkActive="active"
           [routerLinkActiveOptions]="{exact: item.route === '/dashboard'}"
           class="nav-item">
          <span class="icon nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.labelKey | translate }}</span>
        </a>
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 200px;
      height: 100vh;
      background: #2D5A27;
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0; left: 0;
      z-index: 100;
      overflow-y: auto;
      overflow-x: hidden;
    }
    :host-context(body.rtl) .sidebar { left: auto; right: 0; }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 18px 14px;
      border-bottom: 1px solid rgba(255,255,255,0.10);
    }
    .sidebar-logo {
      width: 36px; height: 36px;
      object-fit: contain;
      border-radius: 8px;
      background: rgba(255,255,255,0.12);
      padding: 3px;
      flex-shrink: 0;
    }
    .sidebar-logo-fallback {
      width: 36px; height: 36px;
      background: rgba(255,255,255,0.15);
      border-radius: 8px;
      align-items: center; justify-content: center;
      font-size: 16px; color: #fff; font-weight: 700;
      flex-shrink: 0;
    }
    .brand-name {
      font-family: 'Tajawal', 'Noto Sans Arabic', sans-serif;
      font-size: 13px; font-weight: 700; color: #fff;
      line-height: 1.2; white-space: nowrap;
    }
    .brand-sub { font-size: 10px; color: rgba(255,255,255,0.50); white-space: nowrap; }

    .sidebar-nav {
      flex: 1;
      padding: 10px 8px;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      color: rgba(255,255,255,0.68);
      text-decoration: none;
      border-radius: 7px;
      transition: all 0.15s;
      font-size: 13px;
      font-weight: 400;
    }
    .nav-item:hover {
      background: rgba(255,255,255,0.10);
      color: rgba(255,255,255,0.95);
    }
    .nav-item.active {
      background: rgba(255,255,255,0.18);
      color: #fff;
      font-weight: 600;
    }
    .nav-icon {
      font-family: 'Material Symbols Outlined';
      font-size: 19px;
      flex-shrink: 0;
      font-variation-settings: 'FILL' 0, 'wght' 300;
    }
    .nav-item.active .nav-icon { font-variation-settings: 'FILL' 1, 'wght' 400; }
    .nav-label { flex: 1; }
  `]
})
export class SidebarComponent {
  navItems: NavItem[] = [
    { icon: 'dashboard',          labelKey: 'MENU.DASHBOARD',    route: '/dashboard'     },
    { icon: 'people',             labelKey: 'MENU.MEMBERS',       route: '/members'       },
    { icon: 'payments',           labelKey: 'MENU.CONTRIBUTIONS', route: '/contributions' },
    { icon: 'volunteer_activism', labelKey: 'MENU.DONORS',        route: '/donors'        },
    { icon: 'redeem',             labelKey: 'MENU.DONATIONS',     route: '/donations'     },
    { icon: 'child_care',         labelKey: 'MENU.ORPHANS',       route: '/orphans'       },
    { icon: 'family_restroom',    labelKey: 'MENU.FAMILIES',      route: '/families'      },
    { icon: 'event',              labelKey: 'MENU.ACTIVITIES',    route: '/activities'    },
    { icon: 'settings',           labelKey: 'MENU.SETTINGS',      route: '/settings'      },
    { icon: 'swap_horiz',         labelKey: 'MENU.GESTION',       route: '/gestion'       },
  ];
}
