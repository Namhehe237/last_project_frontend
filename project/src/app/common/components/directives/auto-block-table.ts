import {Directive, ElementRef, inject, Renderer2} from '@angular/core';

@Directive({
  selector: '[appAutoBlockTable]'
})
export class AutoBlockTable {
  readonly el = inject(ElementRef)
  readonly renderer = inject(Renderer2)

  checkOverflow(isReload?: boolean) {
		if (isReload) return;
    const table = this.el.nativeElement as HTMLTableElement;
    const thead = table.querySelector('thead') as HTMLElement;

    if (!thead) return;

    const tableWidth = table.scrollWidth;
    const theadWidth = thead.offsetWidth;

    if (theadWidth >= tableWidth) {
      this.renderer.setStyle(table, 'display', 'block');
      this.renderer.setStyle(table, 'overflowX', 'auto');
      this.renderer.setStyle(table, 'whiteSpace', 'nowrap');
      this.renderer.setStyle(table, 'width', 'auto');
    } else {
      this.renderer.setStyle(table, 'display', 'table');
      this.renderer.removeStyle(table, 'overflowX');
      this.renderer.removeStyle(table, 'whiteSpace');
      this.renderer.setStyle(table, 'width', '100%');
    }
  }
}
