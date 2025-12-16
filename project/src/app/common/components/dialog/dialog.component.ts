import { ChangeDetectionStrategy, Component, ComponentRef, ElementRef, input, output, viewChild } from '@angular/core';

@Component({
  selector: 'app-dialog',
  imports: [],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogComponent  {
	readonly data = input.required<{title: string, content: string[]}>();
	readonly compRef = input.required<ComponentRef<DialogComponent>>();

	readonly closed = output<string | undefined>();
	
	private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('_dialog');
	
	
	open() {
		this.dialog().nativeElement.showModal();
	}


	protected onClose() {
		// console.log('event.target', (event.target as HTMLDialogElement).returnValue);
		this.compRef().destroy();
	}
	
	
	protected onOkCancel(val?: string) {
		this.closed.emit(val);
		this.dialog().nativeElement.close(val);
	}
}
