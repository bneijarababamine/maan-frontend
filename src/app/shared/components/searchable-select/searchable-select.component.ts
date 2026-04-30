import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

export interface SelectOption {
  id: number | string;
  label: string;
  sublabel?: string;
}

@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="ss-wrap" [class.open]="isOpen" [class.has-error]="hasError">
      <div class="ss-input-row" (click)="toggleOpen($event)">
        <span *ngIf="selectedOption" class="ss-selected">{{ selectedOption.label }}</span>
        <span *ngIf="!selectedOption" class="ss-placeholder">{{ placeholder }}</span>
        <span class="ss-arrow">▾</span>
      </div>

      <div *ngIf="isOpen" class="ss-dropdown" (click)="$event.stopPropagation(); $event.preventDefault()">
        <input #searchInput class="ss-search" [(ngModel)]="searchTerm" (input)="onSearch()"
               [placeholder]="'COMMON.SEARCH' | translate" autocomplete="off">
        <div class="ss-list">
          <div *ngFor="let opt of filtered" class="ss-option" [class.selected]="opt.id === value"
               (click)="selectOption(opt)">
            <span class="ss-opt-label">{{ opt.label }}</span>
            <span *ngIf="opt.sublabel" class="ss-opt-sub">{{ opt.sublabel }}</span>
          </div>
          <div *ngIf="filtered.length === 0" class="ss-empty">{{ 'COMMON.NO_RESULTS' | translate }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ss-wrap { position: relative; width: 100%; }
    .ss-input-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px;
      background: #fff; cursor: pointer; font-size: 14px; min-height: 42px;
      transition: border-color .15s;
    }
    .ss-wrap.open .ss-input-row { border-color: #2E7D32; border-bottom-left-radius: 0; border-bottom-right-radius: 0; }
    .ss-wrap.has-error .ss-input-row { border-color: #C62828; }
    .ss-selected { color: #212121; font-weight: 500; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ss-placeholder { color: #BDBDBD; flex: 1; }
    .ss-arrow { color: #999; font-size: 11px; flex-shrink: 0; margin-left: 6px; }
    .ss-dropdown {
      position: absolute; top: 100%; left: 0; right: 0; z-index: 200;
      background: #fff; border: 1px solid #2E7D32; border-top: none;
      border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;
      box-shadow: 0 6px 16px rgba(0,0,0,.12);
    }
    .ss-search {
      width: 100%; box-sizing: border-box; padding: 9px 12px;
      border: none; border-bottom: 1px solid #eee; outline: none;
      font-size: 13px; background: #f9fafb;
    }
    .ss-list { max-height: 280px; overflow-y: auto; }
    .ss-option {
      display: flex; flex-direction: column; gap: 1px;
      padding: 9px 14px; cursor: pointer; transition: background .1s;
    }
    .ss-option:hover { background: #F1F8E9; }
    .ss-option.selected { background: #E8F5E9; }
    .ss-opt-label { font-size: 14px; color: #212121; font-weight: 500; }
    .ss-opt-sub { font-size: 12px; color: #999; }
    .ss-empty { padding: 12px 14px; color: #BDBDBD; font-size: 13px; text-align: center; }
  `]
})
export class SearchableSelectComponent implements OnChanges {
  @Input() options: SelectOption[] = [];
  @Input() value: number | string | null = null;
  @Input() placeholder = '— Sélectionner —';
  @Input() hasError = false;
  @Output() valueChange = new EventEmitter<number | string | null>();

  searchTerm = '';
  filtered: SelectOption[] = [];
  isOpen = false;

  get selectedOption(): SelectOption | undefined {
    return this.options.find(o => o.id === this.value);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options']) {
      this.filtered = [...this.options];
    }
  }

  toggleOpen(event: MouseEvent): void {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.searchTerm = '';
      this.filtered = [...this.options];
    }
  }

  onSearch(): void {
    const t = this.searchTerm.toLowerCase();
    this.filtered = this.options.filter(o =>
      o.label.toLowerCase().includes(t) || (o.sublabel || '').toLowerCase().includes(t)
    );
  }

  selectOption(opt: SelectOption): void {
    this.valueChange.emit(opt.id);
    this.isOpen = false;
    this.searchTerm = '';
  }

  @HostListener('document:click')
  onOutsideClick(): void { this.isOpen = false; }
}
