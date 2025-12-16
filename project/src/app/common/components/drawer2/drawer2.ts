import { ChangeDetectionStrategy, Component, DOCUMENT, ElementRef, inject, OnDestroy, Renderer2, viewChild } from '@angular/core';

@Component({
  selector: 'app-drawer2',
  imports: [],
  templateUrl: './drawer2.html',
  styleUrl: './drawer2.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Drawer2 implements OnDestroy {
	readonly #render = inject(Renderer2);
	readonly #docu = inject(DOCUMENT);
	
	protected readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('_dialog');


	ngOnDestroy(): void {
		// If routing is done while the dialog is open
		this.#render.removeStyle(this.#docu.body, 'overflow');
	}


	// open drawer
	open(): void {
		this.#render.setStyle(this.#docu.body, 'overflow', 'hidden');
		this.dialog().nativeElement.showModal();
	}


	// close drawer
	close(): void {
		this.dialog().nativeElement.close();
	}


	// left close button
	onClose(): void {
		this.close();
	}


	// <dialog> close event
	onDialogClose(): void {
		this.#render.removeStyle(this.#docu.body, 'overflow');
	}
}
