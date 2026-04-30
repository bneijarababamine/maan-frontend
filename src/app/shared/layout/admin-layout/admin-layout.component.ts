import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    <div class="layout">
      <app-sidebar></app-sidebar>
      <div class="layout-main">
        <app-topbar></app-topbar>
        <main class="layout-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .layout { display: flex; min-height: 100vh; background: #F4F6F9; }
    .layout-main { flex: 1; margin-left: 200px; display: flex; flex-direction: column; }
    :host-context(body.rtl) .layout-main { margin-left: 0; margin-right: 200px; }
    .layout-content { margin-top: 60px; padding: 24px; min-height: calc(100vh - 60px); }
  `]
})
export class AdminLayoutComponent implements OnInit {
  constructor(private lang: LanguageService) {}
  ngOnInit(): void { this.lang.init(); }
}
