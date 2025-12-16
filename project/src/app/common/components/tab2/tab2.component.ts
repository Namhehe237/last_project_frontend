import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  OnInit,
  output,
  viewChild
} from '@angular/core';


export interface TabInterface {
	name: string;
	value: string;
}


@Component({
  selector: 'app-tab2',
  imports: [],
  templateUrl: './tab2.component.html',
  styleUrl: './tab2.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Tab2Component implements OnInit, AfterViewInit  {
	readonly tabList = input.required<TabInterface[]>()
  readonly currentTab = input.required<TabInterface>()

  readonly cdr = inject(ChangeDetectorRef);
  readonly scrollContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');

	tabSelected = output<TabInterface>();
  protected name = ''

  ngOnInit(): void {
    this.name = Math.random().toString();
  }

	onChange(item: TabInterface){
		this.tabSelected.emit(item);
		setTimeout(() => {
			this.scrollToSelectedTab();
		}, 0);
	}

	private scrollToSelectedTab() {
		const el = this.scrollContainer()?.nativeElement;
		if (!el) return;

		const input = el.querySelector('input:checked');
  	if (!(input instanceof HTMLInputElement)) return;

		const selectedLabel = input.closest('label');
  	if (!(selectedLabel instanceof HTMLElement)) return;

		const containerRect = el.getBoundingClientRect();
		const selectedRect = selectedLabel.getBoundingClientRect();

		if (selectedRect.left >= containerRect.left && selectedRect.right <= containerRect.right) {
			return;
		}

		const scrollOffset = selectedLabel.offsetLeft - (el.clientWidth / 2) + (selectedLabel.offsetWidth / 2);
		el.scrollTo({ left: scrollOffset, behavior: 'smooth' });
	}

  disableLeft = true;
  disableRight = false;
  showArrows = false;

  ngAfterViewInit() {
    this.checkScroll();
  }

  scrollLeft() {
    this.scrollContainer()?.nativeElement.scrollBy({ left: -150, behavior: 'smooth' });
    setTimeout(() => this.checkScroll(), 300);
  }

  scrollRight() {
    this.scrollContainer()?.nativeElement.scrollBy({ left: 150, behavior: 'smooth' });
    setTimeout(() => this.checkScroll(), 300);
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScroll();
  }

  checkScroll() {
    const el = this.scrollContainer()?.nativeElement;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const maxScrollLeft = el.scrollWidth - el.clientWidth;

    this.showArrows = el.scrollWidth > el.clientWidth;
    this.disableLeft = scrollLeft <= 0;
    this.disableRight = scrollLeft >= maxScrollLeft - 1;
    this.cdr.markForCheck();
  }
}
