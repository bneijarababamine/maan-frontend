import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OrphanService } from '../../../core/services/orphan.service';
import { GuardianService, Guardian } from '../../../core/services/guardian.service';
import { Orphan } from '../../../core/models/orphan.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

interface FilterChip {
  key: string;
  labelKey: string;
  color: 'default' | 'success' | 'secondary' | 'orange' | 'danger';
}

@Component({
  selector: 'app-orphans-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule, ConfirmDialogComponent],
  template: `
    <!-- En-tête -->
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:10px">
        <h1 class="page-title">
          {{ (activeTab === 'orphans' ? 'ORPHANS.TITLE' : 'ORPHANS.TAB_BY_GUARDIAN') | translate }}
        </h1>
        <span class="count-badge">{{ activeTab === 'orphans' ? orphans.length : guardians.length }}</span>
      </div>
      <div style="display:flex;gap:10px">
        <div class="export-wrap" *ngIf="activeTab === 'orphans'" (click)="$event.stopPropagation()">
          <button class="btn btn-export" (click)="showExportMenu = !showExportMenu">
            <span class="ms-icon" style="font-size:16px">picture_as_pdf</span>
            {{ 'COMMON.EXPORT_PDF' | translate }} <span style="font-size:9px">▾</span>
          </button>
          <div class="export-dropdown" *ngIf="showExportMenu">
            <button class="export-opt" (click)="exportPdf('simple');   showExportMenu=false">📋 {{ 'COMMON.EXPORT_SIMPLE'   | translate }}</button>
            <button class="export-opt" (click)="exportPdf('complete'); showExportMenu=false">📊 {{ 'COMMON.EXPORT_COMPLETE' | translate }}</button>
          </div>
        </div>
        <div *ngIf="activeTab === 'guardians'" style="display:flex;gap:8px;align-items:center">
          <button class="btn btn-export-g" (click)="exportGuardianPdf()" [disabled]="pdfGuardianLoading">
            <span *ngIf="pdfGuardianLoading" class="spinner-sm-g"></span>
            <span *ngIf="!pdfGuardianLoading" class="ms-icon" style="font-size:16px">picture_as_pdf</span>
            <span *ngIf="!pdfGuardianLoading">{{ 'COMMON.EXPORT_PDF' | translate }}</span>
          </button>
          <button class="btn btn-primary" routerLink="/guardians/new">
            + {{ 'ORPHANS.ADD_GUARDIAN' | translate }}
          </button>
        </div>
      </div>
    </div>

    <!-- Onglets -->
    <div class="tabs-bar">
      <button class="tab-btn" [class.active]="activeTab === 'orphans'"   (click)="switchTab('orphans')">
        <span class="ms-icon">child_care</span> {{ 'ORPHANS.TAB_LIST' | translate }}
      </button>
      <button class="tab-btn" [class.active]="activeTab === 'guardians'" (click)="switchTab('guardians')">
        <span class="ms-icon">supervisor_account</span> {{ 'ORPHANS.TAB_BY_GUARDIAN' | translate }}
      </button>
    </div>

    <!-- ===== ONGLET ORPHELINS ===== -->
    <ng-container *ngIf="activeTab === 'orphans'">
      <div class="alert-bar" *ngIf="near18Count > 0">⚠ {{ near18Count }} {{ 'ORPHANS.NEAR_18' | translate }}</div>

      <div class="search-bar">
        <input class="search-input" [(ngModel)]="search" (input)="onSearch()" [placeholder]="'COMMON.SEARCH' | translate">
      </div>

      <div class="filter-chips">
        <button *ngFor="let f of filters" class="chip chip-{{ f.color }}"
                [class.active]="activeFilter === f.key" (click)="setFilter(f.key)">
          <span class="chip-dot"></span>{{ f.labelKey | translate }}
        </button>
      </div>
      <div class="filter-chips" style="margin-top:6px">
        <button class="chip chip-default" [class.active]="genderFilter === ''"       (click)="setGender('')">{{ 'ORPHANS.FILTER_ALL' | translate }}</button>
        <button class="chip chip-blue"    [class.active]="genderFilter === 'male'"   (click)="setGender('male')">♂ {{ 'ORPHANS.MALE' | translate }}</button>
        <button class="chip chip-pink"    [class.active]="genderFilter === 'female'" (click)="setGender('female')">♀ {{ 'ORPHANS.FEMALE' | translate }}</button>
      </div>

      <div *ngIf="loading" class="loading-state"><div class="spinner-lg"></div></div>
      <div class="table-card" *ngIf="!loading">
        <table class="data-table">
          <thead><tr>
            <th>{{ 'ORPHANS.FULL_NAME' | translate }}</th>
            <th>{{ 'ORPHANS.AGE' | translate }}</th>
            <th>{{ 'ORPHANS.GENDER' | translate }}</th>
            <th>{{ 'ORPHANS.FATHER_NAME' | translate }}</th>
            <th>{{ 'COMMON.STATUS' | translate }}</th>
            <th></th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let o of orphans" class="clickable-row" (click)="goDetail(o.id)">
              <td>
                <div class="orphan-cell">
                  <img *ngIf="o.photo_url" [src]="o.photo_url" class="o-avatar" [alt]="o.display_name">
                  <span *ngIf="!o.photo_url" class="o-initials">{{ o.full_name.charAt(0) }}</span>
                  <span class="fw-600">{{ o.display_name }}</span>
                </div>
              </td>
              <td>
                <div>{{ o.age }} {{ 'COMMON.YEARS' | translate }}</div>
                <span *ngIf="o.is_adult" class="badge danger">{{ 'ORPHANS.AGED_OUT' | translate }}</span>
                <span *ngIf="!o.is_adult && (o.months_until_18||99)<=6" class="badge warning">{{ o.months_until_18 }} {{ 'COMMON.MONTHS' | translate }}</span>
              </td>
              <td><span class="badge" [class]="o.gender==='male'?'blue':'purple'">{{ (o.gender==='male'?'ORPHANS.MALE':'ORPHANS.FEMALE')|translate }}</span></td>
              <td>
                <div class="father-cell" *ngIf="o.guardian?.father_name">{{ o.guardian?.father_name }}</div>
                <div class="father-cell text-muted" *ngIf="!o.guardian?.father_name">—</div>
              </td>
              <td><span class="badge" [class]="o.is_active?'success':'secondary'">{{ (o.is_active?'ORPHANS.STATUS_ACTIVE':'ORPHANS.STATUS_INACTIVE')|translate }}</span></td>
              <td (click)="$event.stopPropagation()">
                <div class="action-menu" (click)="toggleMenu(o.id, $event)">
                  <button class="btn-dots">⋮</button>
                  <div class="dropdown" *ngIf="openMenu===o.id" [class.drop-up]="dropUp" (click)="$event.stopPropagation()">
                    <a class="dropdown-item" [routerLink]="['/orphans', o.id]">{{ 'COMMON.VIEW' | translate }}</a>
                    <a class="dropdown-item" [routerLink]="['/orphans', o.id, 'edit']">{{ 'COMMON.EDIT' | translate }}</a>
                    <button class="dropdown-item danger" (click)="confirmDelete(o)">{{ 'COMMON.DELETE' | translate }}</button>
                  </div>
                </div>
              </td>
            </tr>
            <tr *ngIf="orphans.length===0"><td colspan="6" class="empty-cell">{{ 'ORPHANS.NO_DATA' | translate }}</td></tr>
          </tbody>
        </table>
      </div>
    </ng-container>

    <!-- ===== ONGLET PAR TUTEUR ===== -->
    <ng-container *ngIf="activeTab === 'guardians'">
      <div class="search-bar">
        <input class="search-input" [(ngModel)]="guardianSearch" (input)="onGuardianSearch()"
               [placeholder]="'COMMON.SEARCH' | translate">
      </div>

      <div *ngIf="guardianLoading" class="loading-state"><div class="spinner-lg"></div></div>

      <div class="guardians-list" *ngIf="!guardianLoading">

        <div *ngFor="let g of guardians" class="guardian-card">
          <!-- En-tête tuteur -->
          <div class="guardian-header" (click)="toggleGuardian(g.id)">
            <div class="g-left">
              <div class="g-avatar">{{ g.name.charAt(0) }}</div>
              <div class="g-info">
                <div class="g-name">{{ g.name }}</div>
                <div class="g-meta">
                  <span *ngIf="g.father_name" class="meta-tag"><strong>{{ g.father_name }}</strong></span>
                  <span class="meta-tag">📞 {{ g.phone }}</span>
                  <span *ngIf="g.whatsapp" class="meta-tag">📱 {{ g.whatsapp }}</span>
                  <span *ngIf="g.address" class="meta-tag">📍 {{ g.address }}</span>
                </div>
              </div>
            </div>
            <div class="g-right">
              <span class="count-chip">{{ g.orphans_count || 0 }} {{ 'ORPHANS.CHILDREN_COUNT' | translate }}</span>
              <button [routerLink]="['/guardians', g.id, 'orphans', 'new']"
                      class="btn-add-child" (click)="$event.stopPropagation()">
                {{ 'ORPHANS.ADD_CHILD' | translate }}
              </button>
              <button [routerLink]="['/guardians', g.id, 'edit']"
                      class="btn-icon-sm" (click)="$event.stopPropagation()" title="Modifier">✏️</button>
              <button (click)="$event.stopPropagation(); askDeleteGuardian(g)"
                      class="btn-icon-sm btn-del" title="Supprimer">🗑️</button>
              <span class="expand-arrow">{{ expandedGuardianId === g.id ? '▲' : '▼' }}</span>
            </div>
          </div>

          <!-- Sous-liste des enfants -->
          <div class="children-list" *ngIf="expandedGuardianId === g.id">
            <div *ngIf="!g.orphans || g.orphans.length === 0" class="no-children">
              {{ 'ORPHANS.NO_CHILDREN' | translate }}
              <a [routerLink]="['/guardians', g.id, 'orphans', 'new']" class="link-add">{{ 'ORPHANS.ADD_FIRST_CHILD' | translate }} →</a>
            </div>
            <table *ngIf="g.orphans && g.orphans.length > 0" class="children-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{{ 'ORPHANS.FULL_NAME' | translate }}</th>
                  <th>{{ 'ORPHANS.GENDER' | translate }}</th>
                  <th>{{ 'ORPHANS.BIRTH_YEAR' | translate }}</th>
                  <th>{{ 'ORPHANS.AGE' | translate }}</th>
                  <th>{{ 'ORPHANS.SCHOOL' | translate }}</th>
                  <th>{{ 'COMMON.STATUS' | translate }}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let o of g.orphans; let i = index" [class.inactive-row]="!o.is_active">
                  <td class="td-num">{{ i + 1 }}</td>
                  <td class="td-name">{{ o.display_name }}</td>
                  <td>
                    <span class="gender-chip" [class.male]="o.gender==='male'" [class.female]="o.gender==='female'">
                      {{ (o.gender === 'male' ? 'ORPHANS.MALE' : 'ORPHANS.FEMALE') | translate }}
                    </span>
                  </td>
                  <td class="mono">{{ o.birth_year }}</td>
                  <td>{{ o.age }} {{ 'COMMON.YEARS' | translate }}</td>
                  <td>{{ o.school_name || '—' }}</td>
                  <td>
                    <span class="dot" [class.dot-on]="o.is_active" [class.dot-off]="!o.is_active"></span>
                    {{ (o.is_active ? 'COMMON.ACTIVE' : 'COMMON.INACTIVE') | translate }}
                  </td>
                  <td class="td-acts">
                    <button [routerLink]="['/orphans', o.id]" class="btn-icon-sm">👁️</button>
                    <button [routerLink]="['/orphans', o.id, 'edit']" class="btn-icon-sm">✏️</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div *ngIf="guardians.length === 0" class="empty-state">
          <div style="font-size:48px;margin-bottom:12px">👤</div>
          <p>{{ 'ORPHANS.NO_GUARDIANS' | translate }}</p>
          <button class="btn btn-primary" routerLink="/guardians/new">+ {{ 'ORPHANS.ADD_FIRST_GUARDIAN' | translate }}</button>
        </div>
      </div>
    </ng-container>

    <app-confirm-dialog [visible]="showDelete" type="danger"
      [title]="'ORPHANS.DELETE_TITLE' | translate"
      [message]="'ORPHANS.DELETE_MSG' | translate"
      [confirmLabel]="'COMMON.DELETE' | translate" iconName="delete"
      (confirmed)="deleteConfirmed()" (cancelled)="showDelete=false">
    </app-confirm-dialog>

    <!-- Modal suppression tuteur -->
    <div class="modal-overlay" *ngIf="showDeleteGuardian" (click)="showDeleteGuardian=false">
      <div class="modal-box" (click)="$event.stopPropagation()">
        <div class="modal-icon">🗑️</div>
        <h3>{{ 'ORPHANS.DELETE_GUARDIAN_TITLE' | translate }}</h3>
        <p><strong>{{ deleteGuardianTarget?.name }}</strong> — {{ 'ORPHANS.DELETE_GUARDIAN_MSG' | translate }}</p>
        <div class="modal-actions">
          <button class="btn-cancel" (click)="showDeleteGuardian=false">{{ 'COMMON.CANCEL' | translate }}</button>
          <button class="btn-delete" (click)="confirmDeleteGuardian()">{{ 'COMMON.DELETE' | translate }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ---- Header & tabs ---- */
    .tabs-bar { display: flex; gap: 4px; margin-bottom: 20px; border-bottom: 2px solid #f0f0f0; }
    .tab-btn { padding: 10px 20px; border: none; background: none; cursor: pointer; font-size: 14px; font-weight: 600; color: #999; display: flex; align-items: center; gap: 6px; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.15s; font-family: inherit; }
    .tab-btn.active { color: #2E7D32; border-bottom-color: #2E7D32; }
    .tab-btn:hover { color: #2E7D32; }
    .ms-icon { font-family: 'Material Symbols Outlined'; font-size: 18px; font-style: normal; font-weight: normal; font-variation-settings: 'FILL' 0,'wght' 300; }
    .tab-btn.active .ms-icon { font-variation-settings: 'FILL' 1,'wght' 400; }

    /* ---- Orphan list ---- */
    .search-bar { margin-bottom: 12px; }
    .search-input { width: 100%; max-width: 420px; padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; box-sizing: border-box; }
    .search-input:focus { border-color: #2E7D32; }
    .alert-bar { background: #FFF8E1; color: #F57F17; border: 1px solid #FFE082; border-radius: 8px; padding: 10px 16px; margin-bottom: 14px; font-size: 13px; font-weight: 500; }
    .filter-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
    .chip { display: flex; align-items: center; gap: 6px; padding: 7px 16px; border-radius: 20px; border: 1.5px solid; cursor: pointer; font-size: 13px; font-weight: 600; background: transparent; transition: all .15s; font-family: inherit; }
    .chip-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
    .chip-default   { border-color: #9E9E9E; color: #757575; }
    .chip-default:hover, .chip-default.active   { background: #757575; color: #fff; border-color: #757575; }
    .chip-success   { border-color: #2E7D32; color: #2E7D32; }
    .chip-success:hover, .chip-success.active   { background: #2E7D32; color: #fff; }
    .chip-secondary { border-color: #9E9E9E; color: #616161; }
    .chip-secondary:hover, .chip-secondary.active { background: #616161; color: #fff; border-color: #616161; }
    .chip-orange  { border-color: #E65100; color: #E65100; }
    .chip-orange:hover, .chip-orange.active   { background: #E65100; color: #fff; }
    .chip-danger  { border-color: #C62828; color: #C62828; }
    .chip-danger:hover, .chip-danger.active   { background: #C62828; color: #fff; }
    .chip-blue    { border-color: #1565C0; color: #1565C0; }
    .chip-blue:hover, .chip-blue.active       { background: #1565C0; color: #fff; }
    .chip-pink    { border-color: #C2185B; color: #C2185B; }
    .chip-pink:hover, .chip-pink.active       { background: #C2185B; color: #fff; }

    .btn-export { background: #fff; border: 1.5px solid #C62828; color: #C62828; border-radius: 8px; padding: 9px 16px; cursor: pointer; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px; font-family: inherit; }
    .btn-export:hover { background: #FFEBEE; }
    .btn-export-g { background: #fff; border: 1.5px solid #2E7D32; color: #2E7D32; border-radius: 8px; padding: 9px 16px; cursor: pointer; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px; font-family: inherit; }
    .btn-export-g:hover { background: #E8F5E9; }
    .btn-export-g:disabled { opacity: 0.6; cursor: not-allowed; }
    .spinner-sm-g { width: 14px; height: 14px; border: 2px solid #c8e6c9; border-top-color: #2E7D32; border-radius: 50%; animation: spin-g .7s linear infinite; }
    @keyframes spin-g { to { transform: rotate(360deg); } }
    .export-wrap { position: relative; display: inline-block; }
    .export-dropdown { position: absolute; top: calc(100% + 4px); right: 0; background: #fff; border: 1px solid #E0E0E0; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.12); z-index: 100; min-width: 230px; overflow: hidden; }
    .export-opt { display: block; width: 100%; padding: 10px 14px; font-size: 13px; color: #212121; border: none; background: none; cursor: pointer; text-align: left; font-family: inherit; white-space: nowrap; }
    .export-opt:hover { background: #F5F5F5; }

    .orphan-cell { display: flex; align-items: center; gap: 10px; }
    .o-avatar { width: 32px; height: 32px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
    .o-initials { width: 32px; height: 32px; border-radius: 8px; background: #E64A19; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; flex-shrink: 0; }
    .father-cell { font-size: 13px; color: #333; }
    .text-muted { color: #999; }
    .text-sm { font-size: 11px; }
    .fw-600 { font-weight: 600; }

    .clickable-row { cursor: pointer; transition: background .12s; }
    .clickable-row:hover { background: #f9fafb; }
    .action-menu { position: relative; display: inline-block; }
    .btn-dots { background: none; border: none; cursor: pointer; font-size: 18px; color: #999; padding: 4px 8px; }
    .dropdown { position: absolute; right: 0; top: 100%; background: #fff; border: 1px solid #E0E0E0; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.12); z-index: 50; min-width: 130px; overflow: hidden; }
    .dropdown.drop-up { top: auto; bottom: 100%; }
    .dropdown-item { display: block; width: 100%; padding: 9px 14px; font-size: 13px; color: #212121; text-decoration: none; border: none; background: none; cursor: pointer; text-align: left; font-family: inherit; }
    .dropdown-item:hover { background: #F5F5F5; }
    .dropdown-item.danger { color: #C62828; }
    .dropdown-item.danger:hover { background: #FFEBEE; }
    .empty-cell { text-align: center; color: #BDBDBD; padding: 40px; }
    .loading-state { display: flex; justify-content: center; padding: 60px; }

    /* ---- Guardian list ---- */
    .guardians-list { display: flex; flex-direction: column; gap: 12px; }
    .guardian-card { background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); overflow: hidden; border: 1px solid #eee; }
    .guardian-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; cursor: pointer; gap: 12px; }
    .guardian-header:hover { background: #fafafa; }
    .g-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
    .g-avatar { width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg,#2E7D32,#66BB6A); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 700; flex-shrink: 0; }
    .g-info { min-width: 0; }
    .g-name { font-size: 15px; font-weight: 700; color: #1a1a2e; }
    .g-meta { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 3px; }
    .meta-tag { font-size: 12px; color: #666; }
    .g-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .count-chip { background: #E3F2FD; color: #1565C0; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap; }
    .btn-add-child { background: #2E7D32; color: #fff; border: none; border-radius: 6px; padding: 5px 12px; cursor: pointer; font-size: 12px; font-weight: 600; white-space: nowrap; }
    .btn-add-child:hover { background: #1B5E20; }
    .btn-icon-sm { width: 28px; height: 28px; border: 1px solid #eee; background: #fff; border-radius: 6px; cursor: pointer; font-size: 12px; display: inline-flex; align-items: center; justify-content: center; }
    .btn-icon-sm:hover { background: #f5f5f5; }
    .btn-icon-sm.btn-del:hover { background: #FFEBEE; }
    .expand-arrow { color: #bbb; font-size: 11px; width: 14px; text-align: center; }

    .children-list { border-top: 1px solid #f0f0f0; background: #FAFAFA; padding: 14px 18px; }
    .no-children { color: #aaa; font-size: 13px; font-style: italic; display: flex; align-items: center; gap: 12px; }
    .link-add { color: #2E7D32; font-weight: 600; text-decoration: none; }
    .link-add:hover { text-decoration: underline; }

    .children-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .children-table th { padding: 8px 10px; text-align: left; color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #eee; }
    .children-table td { padding: 10px; border-bottom: 1px solid #f5f5f5; }
    .children-table tr:last-child td { border-bottom: none; }
    .children-table tr.inactive-row td { color: #bbb; }
    .td-num { color: #bbb; width: 28px; }
    .td-name { font-weight: 600; color: #1a1a2e; }
    .mono { font-family: monospace; }
    .gender-chip { padding: 3px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .gender-chip.male   { background: #E3F2FD; color: #1565C0; }
    .gender-chip.female { background: #FCE4EC; color: #AD1457; }
    .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; }
    .dot-on  { background: #4CAF50; }
    .dot-off { background: #F44336; }
    .td-acts { display: flex; gap: 4px; }

    .empty-state { text-align: center; padding: 60px 20px; color: #bbb; }

    /* ---- Modal ---- */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-box { background: #fff; border-radius: 16px; padding: 32px 28px; max-width: 380px; width: 90%; text-align: center; box-shadow: 0 8px 40px rgba(0,0,0,0.2); }
    .modal-icon { font-size: 40px; margin-bottom: 12px; }
    .modal-box h3 { margin: 0 0 10px; font-size: 17px; color: #333; }
    .modal-box p { margin: 0 0 24px; font-size: 14px; color: #666; line-height: 1.5; }
    .modal-actions { display: flex; gap: 12px; }
    .btn-cancel { flex: 1; padding: 10px; background: #eee; color: #555; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-delete { flex: 1; padding: 10px; background: #C62828; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }

    @media (max-width: 768px) {
      .g-meta { display: none; }
      .g-right { flex-wrap: wrap; }
      .children-table { font-size: 11px; }
    }
  `]
})
export class OrphansListComponent implements OnInit {
  // Onglet actif
  activeTab: 'orphans' | 'guardians' = 'orphans';

  // Orphelins
  orphans: Orphan[] = [];
  loading = false;
  search = '';
  activeFilter = '';
  genderFilter = '';
  showDelete = false;
  selectedId: number | null = null;
  openMenu: number | null = null;
  showExportMenu = false;
  dropUp = false;
  private debounce: any;

  // Tuteurs
  guardians: Guardian[] = [];
  guardianLoading = false;
  guardianSearch = '';
  expandedGuardianId: number | null = null;
  showDeleteGuardian = false;
  deleteGuardianTarget: Guardian | null = null;
  pdfGuardianLoading = false;
  private guardianDebounce: any;

  readonly filters: FilterChip[] = [
    { key: '',           labelKey: 'ORPHANS.FILTER_ALL',      color: 'default'   },
    { key: 'active',     labelKey: 'ORPHANS.FILTER_ACTIVE',   color: 'success'   },
    { key: 'inactive',   labelKey: 'ORPHANS.FILTER_INACTIVE', color: 'secondary' },
    { key: 'near_adult', labelKey: 'ORPHANS.FILTER_NEAR_18',  color: 'orange'    },
    { key: 'aged_out',   labelKey: 'ORPHANS.FILTER_AGED_OUT', color: 'danger'    },
  ];

  get near18Count(): number { return this.orphans.filter(o => !o.is_adult && (o.months_until_18 || 99) <= 6).length; }

  constructor(
    private svc: OrphanService,
    private guardianSvc: GuardianService,
    private router: Router,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.loadOrphans();
    document.addEventListener('click', () => { this.openMenu = null; this.showExportMenu = false; });
  }

  switchTab(tab: 'orphans' | 'guardians'): void {
    this.activeTab = tab;
    if (tab === 'guardians' && this.guardians.length === 0) this.loadGuardians();
  }

  // --- Orphelins ---
  setFilter(key: string): void { this.activeFilter = key; this.loadOrphans(); }
  setGender(g: string): void   { this.genderFilter = g;  this.loadOrphans(); }
  onSearch(): void { clearTimeout(this.debounce); this.debounce = setTimeout(() => this.loadOrphans(), 400); }

  loadOrphans(): void {
    this.loading = true;
    const p: any = {};
    if (this.search)       p.search = this.search;
    if (this.activeFilter) p.status = this.activeFilter;
    if (this.genderFilter) p.gender = this.genderFilter;
    this.svc.getAll(p).subscribe({
      next: res => { this.orphans = res.data; this.loading = false; },
      error: ()  => { this.loading = false; }
    });
  }

  toggleMenu(id: number, event: MouseEvent): void {
    if (this.openMenu === id) { this.openMenu = null; return; }
    this.openMenu = id;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.dropUp = rect.bottom > window.innerHeight - 180;
  }
  goDetail(id: number): void { this.router.navigate(['/orphans', id]); }
  confirmDelete(o: Orphan): void { this.selectedId = o.id; this.showDelete = true; this.openMenu = null; }
  deleteConfirmed(): void {
    if (!this.selectedId) return;
    this.svc.delete(this.selectedId).subscribe({
      next: () => { this.showDelete = false; this.loadOrphans(); },
      error: ()  => { this.showDelete = false; }
    });
  }

  // --- Tuteurs ---
  onGuardianSearch(): void {
    clearTimeout(this.guardianDebounce);
    this.guardianDebounce = setTimeout(() => this.loadGuardians(), 400);
  }

  loadGuardians(): void {
    this.guardianLoading = true;
    const p: any = {};
    if (this.guardianSearch) p.search = this.guardianSearch;
    this.guardianSvc.getAll(p).subscribe({
      next: res => { this.guardians = res.data; this.guardianLoading = false; },
      error: ()  => { this.guardianLoading = false; }
    });
  }

  toggleGuardian(id: number): void {
    if (this.expandedGuardianId === id) { this.expandedGuardianId = null; return; }
    this.expandedGuardianId = id;
    const g = this.guardians.find(x => x.id === id);
    if (g && !g.orphans) {
      this.guardianSvc.getOrphans(id).subscribe({ next: orphans => g.orphans = orphans });
    }
  }

  exportGuardianPdf(): void {
    this.pdfGuardianLoading = true;
    const toLoad = this.guardians.filter(g => (g.orphans_count ?? 0) > 0 && !g.orphans);
    if (toLoad.length === 0) { this.generateGuardianPdf(); return; }
    const requests = toLoad.map(g =>
      this.guardianSvc.getOrphans(g.id).pipe(map(orphans => ({ id: g.id, orphans })))
    );
    forkJoin(requests).subscribe({
      next: results => {
        results.forEach(r => { const g = this.guardians.find(x => x.id === r.id); if (g) g.orphans = r.orphans; });
        this.generateGuardianPdf();
      },
      error: () => { this.pdfGuardianLoading = false; }
    });
  }

  private generateGuardianPdf(): void {
    const lang = this.translate.currentLang || 'fr';
    const isAr = lang === 'ar';
    const dir = isAr ? 'rtl' : 'ltr';
    const t = (key: string) => this.translate.instant(key);
    const thAlign = isAr ? 'right' : 'left';

    let totalOrphans = 0;
    let guardiansHtml = '';

    for (const guardian of this.guardians) {
      const orphans = guardian.orphans ?? [];
      if (orphans.length === 0) continue;
      totalOrphans += orphans.length;

      const rowsHtml = orphans.map((o: any, i: number) => {
        const gColor = o.gender === 'male' ? '#1565C0' : '#AD1457';
        const sColor = o.is_active ? '#2E7D32' : '#C62828';
        return `<tr style="background:${i % 2 === 0 ? '#fff' : '#F1F8E9'}">
          <td style="padding:6px 8px;text-align:center;color:#999;font-size:11px">${i + 1}</td>
          <td style="padding:6px 8px;font-weight:600;color:#1a1a2e">${o.display_name || '—'}</td>
          <td style="padding:6px 8px;text-align:center;color:${gColor};font-weight:700">${o.gender === 'male' ? t('ORPHANS.MALE') : t('ORPHANS.FEMALE')}</td>
          <td style="padding:6px 8px;text-align:center;color:#555">${o.birth_year || '—'}</td>
          <td style="padding:6px 8px;text-align:center;color:#555">${o.age != null ? o.age + ' ' + t('COMMON.YEARS') : '—'}</td>
          <td style="padding:6px 8px;color:#555">${o.school_name || '—'}</td>
          <td style="padding:6px 8px;text-align:center;color:${sColor};font-weight:600">${o.is_active ? t('COMMON.ACTIVE') : t('COMMON.INACTIVE')}</td>
        </tr>`;
      }).join('');

      guardiansHtml += `
        <div style="margin-bottom:18px">
          <div style="background:#E8F5E9;border-radius:6px;padding:10px 14px;margin-bottom:6px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <strong style="color:#1B5E20;font-size:14px">${guardian.name}</strong>
              <span style="color:#666;font-size:12px">${guardian.phone}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">
              ${guardian.father_name ? `<span style="color:#666;font-size:12px">${t('ORPHANS.FATHER_NAME')} : ${guardian.father_name}</span>` : '<span></span>'}
              <span style="color:#1565C0;font-size:12px;font-weight:600">${orphans.length} ${t('ORPHANS.CHILDREN_COUNT')}</span>
            </div>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead><tr>
              <th style="background:#2E7D32;color:#fff;padding:7px 8px;text-align:center;font-size:11px;width:28px">#</th>
              <th style="background:#2E7D32;color:#fff;padding:7px 8px;text-align:${thAlign};font-size:11px">${t('ORPHANS.FULL_NAME')}</th>
              <th style="background:#2E7D32;color:#fff;padding:7px 8px;text-align:center;font-size:11px;width:70px">${t('ORPHANS.GENDER')}</th>
              <th style="background:#2E7D32;color:#fff;padding:7px 8px;text-align:center;font-size:11px;width:80px">${t('ORPHANS.BIRTH_YEAR')}</th>
              <th style="background:#2E7D32;color:#fff;padding:7px 8px;text-align:center;font-size:11px;width:55px">${t('ORPHANS.AGE')}</th>
              <th style="background:#2E7D32;color:#fff;padding:7px 8px;text-align:${thAlign};font-size:11px">${t('ORPHANS.SCHOOL')}</th>
              <th style="background:#2E7D32;color:#fff;padding:7px 8px;text-align:center;font-size:11px;width:60px">${t('COMMON.STATUS')}</th>
            </tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>`;
    }

    const container = document.createElement('div');
    container.style.cssText = `position:fixed;top:-99999px;left:-99999px;width:794px;background:#fff;padding:28px 32px;font-family:'Cairo',Arial,sans-serif;font-size:12px;color:#212121;direction:${dir}`;
    container.innerHTML = `
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
        <h1 style="color:#2E7D32;font-size:18px;margin:0">${t('ORPHANS.TAB_BY_GUARDIAN')}</h1>
        <span style="color:#999;font-size:11px">${new Date().toLocaleDateString('fr-FR')}</span>
      </div>
      ${guardiansHtml}
      <div style="margin-top:14px;padding-top:12px;border-top:2px solid #2E7D32;color:#2E7D32;font-weight:700;font-size:14px">
        ${t('COMMON.TOTAL')} : ${totalOrphans} ${t('ORPHANS.TAB_LIST')}
      </div>`;

    document.body.appendChild(container);
    document.fonts.load('600 12px Cairo').then(() => {
      html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(canvas => {
        document.body.removeChild(container);
        const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const imgH = (canvas.height / canvas.width) * pageW;
        if (imgH <= pageH) {
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pageW, imgH);
        } else {
          const ratio = canvas.width / pageW;
          const sliceH = Math.floor(pageH * ratio);
          let y = 0;
          while (y < canvas.height) {
            const sc = document.createElement('canvas');
            sc.width = canvas.width;
            sc.height = Math.min(sliceH, canvas.height - y);
            sc.getContext('2d')!.drawImage(canvas, 0, -y);
            pdf.addImage(sc.toDataURL('image/png'), 'PNG', 0, 0, pageW, pageH);
            y += sliceH;
            if (y < canvas.height) pdf.addPage();
          }
        }
        pdf.save(`orphelins-par-tuteur-${new Date().toISOString().slice(0, 10)}.pdf`);
        this.pdfGuardianLoading = false;
      }).catch(() => { this.pdfGuardianLoading = false; });
    }).catch(() => { this.pdfGuardianLoading = false; });
  }

  askDeleteGuardian(g: Guardian): void { this.deleteGuardianTarget = g; this.showDeleteGuardian = true; }
  confirmDeleteGuardian(): void {
    if (!this.deleteGuardianTarget) return;
    this.guardianSvc.delete(this.deleteGuardianTarget.id).subscribe({
      next: () => { this.showDeleteGuardian = false; this.deleteGuardianTarget = null; this.loadGuardians(); },
      error: ()  => { this.showDeleteGuardian = false; }
    });
  }

  // --- PDF export ---
  exportPdf(mode: 'simple' | 'complete' = 'complete'): void {
    const lang = this.translate.currentLang || 'fr';
    const isAr = lang === 'ar';
    const dir = isAr ? 'rtl' : 'ltr';
    const t = (key: string) => this.translate.instant(key);
    const date = new Date().toLocaleDateString('fr-FR');
    const filterLabel = this.activeFilter
      ? t(this.filters.find(f => f.key === this.activeFilter)?.labelKey ?? '')
      : t('ORPHANS.FILTER_ALL');

    if (mode === 'simple') {
      const names = this.orphans.map(o => o.display_name || o.full_name);
      this.generateSimplePdf(names, t('ORPHANS.TITLE'), filterLabel, '#E64A19', `orphelins_simple_${date.replace(/\//g,'-')}.pdf`, dir);
      return;
    }

    const thAlign = isAr ? 'right' : 'left';
    const headers = [t('ORPHANS.TITLE'), t('ORPHANS.AGE'), t('ORPHANS.GENDER'), 'Nom du père', t('COMMON.STATUS')];
    const container = document.createElement('div');
    container.style.cssText = `position:fixed;top:-99999px;left:-99999px;width:1122px;background:#fff;padding:24px 28px;font-family:'Cairo',Arial,sans-serif;font-size:12px;color:#212121;direction:${dir}`;
    container.innerHTML = `
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
      <h1 style="color:#E64A19;font-size:18px;margin-bottom:4px">${t('ORPHANS.TITLE')}</h1>
      <div style="color:#757575;font-size:11px;margin-bottom:16px">${t('COMMON.DATE')}: ${date} | ${filterLabel} | ${this.orphans.length} ${t('COMMON.TOTAL')}</div>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr>${headers.map(h => `<th style="background:#E64A19;color:#fff;padding:8px 10px;text-align:${thAlign};font-weight:600;font-size:11px">${h}</th>`).join('')}</tr></thead>
        <tbody>${this.orphans.map((o, i) => {
          const ageSuffix = o.is_adult ? `<span style="color:#C62828;font-size:10px">(${t('ORPHANS.AGED_OUT')})</span>` : '';
          return `<tr style="background:${i%2===0?'#fff':'#fff8f5'}">
            <td style="padding:6px 10px"><strong>${o.display_name || o.full_name}</strong></td>
            <td style="padding:6px 10px">${o.age} ${t('COMMON.YEARS')} ${ageSuffix}</td>
            <td style="padding:6px 10px">${o.gender==='male'?t('ORPHANS.MALE'):t('ORPHANS.FEMALE')}</td>
            <td style="padding:6px 10px">${o.guardian?.father_name || '—'}</td>
            <td style="padding:6px 10px;color:${o.is_active?'#2E7D32':'#757575'};font-weight:600">${o.is_active?t('ORPHANS.STATUS_ACTIVE'):t('ORPHANS.STATUS_INACTIVE')}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>`;
    document.body.appendChild(container);
    document.fonts.load('600 12px Cairo').then(() => {
      html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(canvas => {
        document.body.removeChild(container);
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const imgH = (canvas.height / canvas.width) * pageW;
        if (imgH <= pageH) { pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pageW, imgH); }
        else {
          const ratio = canvas.width / pageW;
          const sliceH = Math.floor(pageH * ratio);
          let y = 0;
          while (y < canvas.height) {
            const sc = document.createElement('canvas');
            sc.width = canvas.width; sc.height = Math.min(sliceH, canvas.height - y);
            sc.getContext('2d')!.drawImage(canvas, 0, -y);
            pdf.addImage(sc.toDataURL('image/png'), 'PNG', 0, 0, pageW, pageH);
            y += sliceH; if (y < canvas.height) pdf.addPage();
          }
        }
        pdf.save(`orphelins_${new Date().toISOString().slice(0,10)}.pdf`);
      });
    });
  }

  generateSimplePdf(names: string[], title: string, filterLabel: string, color: string, filename: string, dir: string): void {
    const t = (key: string) => this.translate.instant(key);
    const date = new Date().toLocaleDateString('fr-FR');
    const rows = names.map((n, i) =>
      `<tr style="border-bottom:1px solid #EEEEEE">
        <td style="padding:8px 10px;width:55%"><span style="color:${color};font-weight:700;min-width:22px;display:inline-block">${i+1}.</span> ${n}</td>
        <td style="width:45%;border-left:1px solid #EEEEEE"></td>
      </tr>`).join('');
    const container = document.createElement('div');
    container.style.cssText = `position:fixed;top:-99999px;left:-99999px;width:794px;background:#fff;padding:28px 32px;font-family:'Cairo',Arial,sans-serif;font-size:12px;color:#212121;direction:${dir}`;
    container.innerHTML = `
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <h1 style="color:${color};font-size:18px;margin:0">${title}</h1>
        <span style="font-size:22px;font-weight:800;color:${color}">${names.length}</span>
      </div>
      <div style="color:#999;font-size:11px;margin-bottom:12px">${t('COMMON.DATE')}: ${date} | ${filterLabel}</div>
      <hr style="border:none;border-top:2px solid ${color};margin-bottom:16px">
      <table style="width:100%;border-collapse:collapse">${rows}</table>`;
    document.body.appendChild(container);
    document.fonts.load('600 12px Cairo').then(() => {
      html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(canvas => {
        document.body.removeChild(container);
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const imgH = (canvas.height / canvas.width) * pageW;
        if (imgH <= pageH) { pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pageW, imgH); }
        else {
          const ratio = canvas.width / pageW;
          const sliceH = Math.floor(pageH * ratio);
          let y = 0;
          while (y < canvas.height) {
            const sc = document.createElement('canvas');
            sc.width = canvas.width; sc.height = Math.min(sliceH, canvas.height - y);
            sc.getContext('2d')!.drawImage(canvas, 0, -y);
            pdf.addImage(sc.toDataURL('image/png'), 'PNG', 0, 0, pageW, pageH);
            y += sliceH; if (y < canvas.height) pdf.addPage();
          }
        }
        pdf.save(filename);
      });
    });
  }
}
