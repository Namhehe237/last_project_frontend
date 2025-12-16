import {ChangeDetectionStrategy, ComponentRef, ElementRef, Component, input, output, viewChild} from '@angular/core';

interface DialogData {
	value: string;
	items: string[];
	orderId?: string;
}

@Component({
  selector: 'app-dialog-show-more',
  imports: [],
  templateUrl: './dialog-show-more.html',
  styleUrl: './dialog-show-more.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogShowMore {
	readonly data = input.required<DialogData>();
	readonly compRef = input.required<ComponentRef<DialogShowMore>>();
	readonly closed = output<string | undefined>();

	private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('_dialog');

	open() {
		this.dialog().nativeElement.showModal();
	}

	protected onClose() {
		this.compRef().destroy();
	}

	protected onOkCancel(val?: string) {
		this.closed.emit(val);
		this.dialog().nativeElement.close(val);
	}
}
