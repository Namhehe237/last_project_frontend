import { ChangeDetectionStrategy, Component, ElementRef, input, output, viewChild, signal } from '@angular/core';
import { ImagePreviewDialogComponent, ImagePreviewData } from '../image-preview-dialog/image-preview-dialog.component';

export interface UploadedImage {
  id: string;
  file: File;
  url: string;
  name: string;
}

@Component({
  selector: 'app-image-uploader2',
  imports: [ImagePreviewDialogComponent],
  templateUrl: './image-uploader2.html',
  styleUrl: './image-uploader2.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageUploader2 {
  readonly images = input<UploadedImage[]>([]);
  readonly maxImages = input<number | null>(null); // null = unlimited
  readonly acceptedTypes = input<string>('image/*');
  readonly maxFileSize = input<number>(2 * 1024 * 1024); // 2MB default

  readonly imagesChanged = output<UploadedImage[]>();
  readonly imageRemoved = output<string>();

  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('_fileInput');
  
  // Dialog data signal
  readonly previewList = signal<ImagePreviewData[] | null>(null);
  readonly previewStartIndex = signal<number>(0);
  readonly showPreviewDialog = signal<boolean>(false);
  readonly isDragOver = signal<boolean>(false);

  protected onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    
    if (!files || files.length === 0) return;

    this.processFiles(files);
    target.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFiles(files);
    }
  }

  private processFiles(files: FileList): void {
    const currentImages = this.images();
    const maxImages = this.maxImages();
    
    // Check if there's a limit and if we've reached it
    if (maxImages !== null && currentImages.length >= maxImages) {
      return;
    }

    const newImages: UploadedImage[] = [];
    
    // Calculate how many files to process
    const maxFilesToProcess = maxImages !== null 
      ? Math.min(files.length, maxImages - currentImages.length)
      : files.length;
    
    for (let i = 0; i < maxFilesToProcess; i++) {
      const file = files[i];
      
      if (!file) continue;
      
      // Validate file type
      if (!file.type.match(this.acceptedTypes())) {
        alert(`File ${file.name} is not a valid image`);
        continue;
      }
      
      // Validate file size
      if (file.size > this.maxFileSize()) {
        alert(`File ${file.name} is too large. Maximum size is ${this.maxFileSize() / (1024 * 1024)}MB`);
        continue;
      }

      const image: UploadedImage = {
        id: this.generateId(),
        file: file,
        url: URL.createObjectURL(file),
        name: file.name
      };
      
      newImages.push(image);
    }

    if (newImages.length > 0) {
      this.imagesChanged.emit([...currentImages, ...newImages]);
    }
  }

  protected onRemoveImage(imageId: string): void {
    const currentImages = this.images();
    const imageToRemove = currentImages.find(img => img.id === imageId);
    
    if (imageToRemove) {
      // Revoke object URL to free memory
      URL.revokeObjectURL(imageToRemove.url);
      
      const updatedImages = currentImages.filter(img => img.id !== imageId);
      this.imagesChanged.emit(updatedImages);
      this.imageRemoved.emit(imageId);
    }
  }

  protected onUploadClick(): void {
    const maxImages = this.maxImages();
    const currentImages = this.images();
    
    // Don't allow upload if limit is reached
    if (maxImages !== null && currentImages.length >= maxImages) {
      return;
    }
    
    this.fileInput().nativeElement.click();
  }

  protected onImageClick(image: UploadedImage): void {
			const source = this.images();
			if (!source || source.length === 0) return;
	
			const list: ImagePreviewData[] = source.map(img => ({
				imageUrl: img.url,
				imageName: img.name,
				imageSize: `${(img.file.size / 1024).toFixed(1)}KB`
			}));
	
			const startIndex = Math.max(0, source.findIndex(i => i.id === image.id));
	
			this.previewList.set(list);
			this.previewStartIndex.set(startIndex);
			this.showPreviewDialog.set(true);
		}
	
		protected onPreviewDialogClosed(): void {
			this.showPreviewDialog.set(false);
			this.previewList.set(null);
			this.previewStartIndex.set(0);
		}

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
}
