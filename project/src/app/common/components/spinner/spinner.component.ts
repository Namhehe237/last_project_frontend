import { ChangeDetectionStrategy, Component, ComponentRef, ElementRef, input, viewChild } from '@angular/core';

@Component({
  selector: 'app-spinner',
  imports: [],
  templateUrl: './spinner.component.html',
  styleUrl: './spinner.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpinnerComponent {
	readonly compRef = input.required<ComponentRef<SpinnerComponent>>();
	private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('_dialog');
	
	open() {
		this.dialog().nativeElement.showModal();
	}

	close() {
		this.dialog().nativeElement.close();
	}

	protected onClose() {
		this.compRef().destroy();
	}
}
