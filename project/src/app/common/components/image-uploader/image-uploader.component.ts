import { ChangeDetectionStrategy, Component, ElementRef, input, output, viewChild, signal } from '@angular/core';
import { ImagePreviewDialogComponent, ImagePreviewData } from '../image-preview-dialog/image-preview-dialog.component';

export interface UploadedImage {
  id: string;
  file: File;
  url: string;
  name: string;
	base64String?: string;
}

@Component({
  selector: 'app-image-uploader',
  imports: [ImagePreviewDialogComponent],
  templateUrl: './image-uploader.component.html',
  styleUrl: './image-uploader.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageUploaderComponent {
  readonly images = input<UploadedImage[]>([]);
  readonly maxImages = input<number | null>(null); // null = unlimited
  readonly acceptedTypes = input<string[]>(['image/*']);
  readonly maxFileSize = input<number>(2 * 1024 * 1024); // 2MB default

  readonly imagesChanged = output<UploadedImage[]>();
  readonly imageRemoved = output<string>();

  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('_fileInput');
  private readonly previewDialog = viewChild<ImagePreviewDialogComponent>('_previewDialog');
  
  readonly previewList = signal<ImagePreviewData[] | null>(null);
  readonly previewStartIndex = signal<number>(0);
  readonly showPreviewDialog = signal<boolean>(false);

  protected async onFileSelected(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    
    if (!files || files.length === 0) return;

    const currentImages = this.images();
    const maxImages = this.maxImages();
    
    // Check if there's a limit and if we've reached it
    if (maxImages !== null && currentImages.length >= maxImages) {
      // Don't process files if limit is reached
      target.value = '';
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
      if (!this.acceptedTypes().some(type => file.type.match(type))) {
        alert(`File ${file.name} is not a valid image`);
        continue;
      }
      
      // Validate file size
      if (file.size > this.maxFileSize()) {
        alert(`File ${file.name} is too large. Maximum size is ${this.maxFileSize() / (1024 * 1024)}MB`);
        continue;
      }

			try {
				const base64String = await this.convertFileToBase64(file);

      	const image: UploadedImage = {
        	id: this.generateId(),
        	file: file,
        	url: URL.createObjectURL(file),
        	name: file.name,
					base64String: base64String
      	};
      
      	newImages.push(image);
			} catch (error) {
				console.error('Error converting file to base64:', error);
			}
    }

    if (newImages.length > 0) {
      this.imagesChanged.emit([...currentImages, ...newImages]);
    }

    // Reset input to allow selecting the same file again
    target.value = '';
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

	private convertFileToBase64(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				if (typeof reader.result === 'string') {
					const parts = reader.result.split(',');
					if (parts.length === 2 && parts[1]) {
						resolve(parts[1]);
					} else {
						reject(new Error('Invalid data URL format'));
					}
				} else {
					reject(new Error('FileReader result is not a string'));
				}
			};

			reader.onerror = () => {
				reject(new Error('Error reading file'));
			};

			reader.readAsDataURL(file);
		});
	}

	private getDataUrl(image: UploadedImage): string {
		return `data:${image.file.type};base64,${image.base64String}`;
	}
} 