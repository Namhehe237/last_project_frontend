import { Component, ComponentRef, ElementRef, InputSignal, OutputEmitterRef, viewChild } from '@angular/core';

@Component({
  imports: [],
  template: '<dialog #_dialog class="__dialog-1" (close)="onDialogClose()"></dialog>',
})
export abstract class DialogFactory<C, O>{
	abstract readonly _compRef: InputSignal<ComponentRef<C>>;

	abstract readonly closed: OutputEmitterRef<O>;

	protected readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('_dialog');


	open(): void {
		this.dialog().nativeElement.showModal();
	}



	close(): void {
		this.dialog().nativeElement.close();
	}



	onDialogClose() {
		this._compRef().destroy();
	}
}
