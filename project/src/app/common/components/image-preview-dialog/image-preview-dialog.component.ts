import { ChangeDetectionStrategy, Component, ElementRef, input, output, viewChild, OnDestroy, OnInit, signal, computed } from '@angular/core';

export interface ImagePreviewData {
  imageUrl: string;
  imageName: string;
  imageSize: string;
}

@Component({
  selector: 'app-image-preview-dialog',
  imports: [],
  templateUrl: './image-preview-dialog.component.html',
  styleUrl: './image-preview-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImagePreviewDialogComponent implements OnDestroy, OnInit {
  readonly images = input.required<ImagePreviewData[]>();
	readonly startIndex = input<number>(0);
  readonly closed = output<void>();
  
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('_dialog');

	readonly index = signal(0);
	readonly current = computed(() => {
    const arr = this.images();
    const i = this.index();
    return arr[Math.min(Math.max(i, 0), Math.max(arr.length - 1, 0))];
  });
  readonly hasPrev = computed(() => this.index() > 0);
  readonly hasNext = computed(() => this.index() < this.images().length - 1);
	readonly rotation = signal<number>(0);

	readonly sideways = computed(() => {
  	const r = ((this.rotation() % 360) + 360) % 360;
  	return r === 90 || r === 270;
	});
  
  ngOnInit() {
    this.index.set(Math.max(0, Math.min(this.startIndex(), Math.max(this.images().length - 1, 0))));
    setTimeout(() => {
      this.dialog().nativeElement.showModal();
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden';
    }, 0);
  }

  protected onClose() {
		this.resetRotation();
    this.dialog().nativeElement.close();
    // Restore body scroll when dialog is closed
    document.body.style.overflow = '';
  }
  
  protected onOkCancel() {
    this.closed.emit();
		this.resetRotation();
    this.dialog().nativeElement.close();
    // Restore body scroll when dialog is closed
    document.body.style.overflow = '';
  }

  protected onImageClick(event: Event) {
    // Prevent dialog from closing when clicking on image
    event.stopPropagation();
  }

  protected onDialogWheel(event: WheelEvent) {
    // Prevent scroll propagation to background
    event.stopPropagation();
  }

  protected onContentWheel(event: WheelEvent) {
    // Allow scroll within dialog content but prevent background scroll
    event.stopPropagation();
  }

	protected prev() {
    if (this.hasPrev()) { 
			this.index.update(i => i - 1);
			this.rotation.set(0);
		}
  }
  protected next() {
    if (this.hasNext()) {
			this.index.update(i => i + 1);
			this.rotation.set(0);
		}
  }

	protected rotateCCW() {
    this.rotation.update(r => r - 90);
  }

  protected resetRotation() {
		this.rotation.set(0);
	}

  ngOnDestroy() {
    // Ensure body scroll is restored when component is destroyed
    document.body.style.overflow = '';
  }
} 