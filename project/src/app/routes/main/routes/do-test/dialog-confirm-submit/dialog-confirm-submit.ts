import { ChangeDetectionStrategy, Component, ComponentRef, ElementRef, input, output, viewChild } from '@angular/core';

@Component({
  selector: 'app-dialog-confirm-submit',
  imports: [],
  templateUrl: './dialog-confirm-submit.html',
  styleUrl: './dialog-confirm-submit.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogConfirmSubmit {
  readonly compRef = input.required<ComponentRef<DialogConfirmSubmit>>();
  readonly remainingTime = input.required<string>();
  readonly closed = output<boolean>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('_dialog');

  open(): void {
    this.dialog().nativeElement.showModal();
  }

  protected onClose(): void {
    this.compRef().destroy();
  }

  protected onConfirm(): void {
    this.closed.emit(true);
    this.dialog().nativeElement.close('confirmed');
    this.onClose();
  }

  protected onCancel(): void {
    this.closed.emit(false);
    this.dialog().nativeElement.close('cancelled');
    this.onClose();
  }
}
