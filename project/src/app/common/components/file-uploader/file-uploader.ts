import { ChangeDetectionStrategy, Component, ElementRef, input, output, viewChild, signal } from '@angular/core';

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  type: string;
}

@Component({
  selector: 'app-file-uploader',
  imports: [],
  templateUrl: './file-uploader.html',
  styleUrl: './file-uploader.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileUploader {
	readonly files = input<UploadedFile[]>([]);
  readonly maxFiles = input<number | null>(1);
  readonly acceptedTypes = input<string[]>(['application/pdf', 'application/csv']); 
  readonly maxFileSize = input<number>(2 * 1024 * 1024); // 2MB

  readonly filesChanged = output<UploadedFile[]>();
  readonly fileRemoved = output<string>();

  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('_fileInput');
  readonly isDragOver = signal<boolean>(false);

	protected onUploadClick(): void {
    if (this.isLimitReached()) return;
    this.fileInput().nativeElement.click();
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const list = input.files;
    if (!list || list.length === 0) return;
    this.processFiles(list);
    input.value = ''; // reset for same-file re-select
  }

  protected onDragOver(ev: DragEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.isDragOver.set(true);
  }

  protected onDragLeave(ev: DragEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.isDragOver.set(false);
  }

  protected onDrop(ev: DragEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.isDragOver.set(false);

    const list = ev.dataTransfer?.files;
    if (list && list.length > 0) this.processFiles(list);
  }

	private fileStore = new Map<string, File>();

  private processFiles(list: FileList): void {
    const cur = this.files();
    const max = this.maxFiles();

    if (max !== null && cur.length >= max) return;

    const toTake = max !== null ? Math.min(list.length, max - cur.length) : list.length;
    const next: UploadedFile[] = [];

    for (let i = 0; i < toTake; i++) {
      const file = list.item(i);
      if (!file) continue;

      if (!this.matchesAccept(file.type, this.acceptedTypes().join(','))) {
        alert(`File "${file.name}" is not an accepted type.`);
        continue;
      }

      if (file.size > this.maxFileSize()) {
        const mb = (this.maxFileSize() / (1024 * 1024)).toFixed(0);
        alert(`"${file.name}" is too large. Max size is ${mb}MB.`);
        continue;
      }

			const id = this.makeId();
    	this.fileStore.set(id, file);
      next.push({
        id,
        file,
        name: file.name,
        type: file.type || 'application/octet-stream',
      });
    }

    if (next.length) this.filesChanged.emit([...cur, ...next]);
  }

  protected removeFile(id: string): void {
    const cur = this.files();
    const updated = cur.filter(f => f.id !== id);
    if (updated.length !== cur.length) {
			this.fileStore.delete(id); 
      this.filesChanged.emit(updated);
      this.fileRemoved.emit(id);

			const el = this.fileInput().nativeElement;
    	if (el.value) el.value = '';
    }
  }

  protected isLimitReached(): boolean {
    const max = this.maxFiles();
    return max !== null && this.files().length >= max;
  }

  protected iconFor(type: string): string {
    if (type === 'application/pdf') return '/image/pdf.svg';
		if (type === 'text/csv')  return 'image/csv-icon.svg';
    return '/image/pdf.svg';
  }

  private matchesAccept(mime: string, accept: string): boolean {
    const parts = accept.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length === 0) return true;
    return parts.some(p => {
      if (p.endsWith('/*')) {
        const prefix = p.slice(0, -2);
        return mime.startsWith(prefix + '/');
      }
      return p.toLowerCase() === mime.toLowerCase();
    });
  }

  private makeId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
}
