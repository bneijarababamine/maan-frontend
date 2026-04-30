import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-photo-upload',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => PhotoUploadComponent),
    multi: true
  }],
  template: `
    <div class="upload-zone" (click)="fileInput.click()" [class.has-image]="previewUrl">
      <img *ngIf="previewUrl" [src]="previewUrl" alt="preview" class="preview-img">
      <div *ngIf="!previewUrl" class="upload-placeholder">
        <span class="upload-icon">📎</span>
        <span>{{ label || ('COMMON.UPLOAD_PHOTO' | translate) }}</span>
        <small>JPG, PNG, WEBP</small>
      </div>
      <button *ngIf="previewUrl" class="remove-btn" type="button" (click)="removePhoto($event)">✕</button>
    </div>
    <input #fileInput type="file" [accept]="accept" hidden (change)="onFileSelected($event)">
  `,
  styles: [`
    .upload-zone {
      border: 2px dashed #ccc;
      border-radius: 10px;
      padding: 24px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
      min-height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .upload-zone:hover { border-color: var(--primary, #2E7D32); background: #f9fbe7; }
    .upload-zone.has-image { padding: 8px; }
    .upload-placeholder { display: flex; flex-direction: column; gap: 6px; color: #888; }
    .upload-icon { font-size: 28px; }
    small { font-size: 11px; color: #bbb; }
    .preview-img { max-width: 100%; max-height: 200px; border-radius: 8px; object-fit: cover; }
    .remove-btn {
      position: absolute; top: 6px; right: 6px;
      background: rgba(0,0,0,0.5); color: #fff;
      border: none; border-radius: 50%;
      width: 24px; height: 24px;
      cursor: pointer; font-size: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .remove-btn:hover { background: #c62828; }
  `]
})
export class PhotoUploadComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() accept = 'image/*';
  @Output() fileSelected = new EventEmitter<File | null>();

  previewUrl: string | null = null;
  private file: File | null = null;
  onChange: (file: File | null) => void = () => {};
  onTouched: () => void = () => {};

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    this.file = f;
    const reader = new FileReader();
    reader.onload = e => this.previewUrl = e.target?.result as string;
    reader.readAsDataURL(f);
    this.onChange(f);
    this.fileSelected.emit(f);
    input.value = '';
  }

  removePhoto(e: Event): void {
    e.stopPropagation();
    this.previewUrl = null;
    this.file = null;
    this.onChange(null);
    this.fileSelected.emit(null);
  }

  writeValue(value: string | null): void {
    this.previewUrl = value;
  }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
}
