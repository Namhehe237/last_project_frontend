import {ChangeDetectionStrategy, Component, input, OnChanges, output} from '@angular/core';

@Component({
  selector: 'app-paging',
  imports: [],
  templateUrl: './paging.component.html',
  styleUrl: './paging.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PagingComponent implements OnChanges {
  readonly page = input.required<number>()
  readonly pageSize = input.required<number>()
  readonly totalElements = input.required<number>();
  readonly showPageSize = input.required<boolean>();
  pageChange = output<number>()
  pageSizeChange = output<number>()

  totalPages = 0;
  pages:(number | string | undefined)[] = []

  onChangePageSize(event: Event) {
    this.pageSizeChange.emit(+(event.target as HTMLInputElement)?.value);
  }

  onPageChange(event: number | string | undefined) {
    if (typeof event !== 'number') return;
    if (event > 0 && event <= this.totalPages && event != this.page()) {
      this.pageChange.emit(event);
    }
  }

  getSmartPaginationRange(): (number | string | undefined)[] {
    this.totalPages = Math.ceil(this.totalElements() / this.pageSize());
    const pages: (number | string)[] = [];

    if (this.totalPages <= 7) {
      for (let i = 1; i <= this.totalPages; i++) pages.push(i);
      return pages;
    }

    if (this.page() <= 3) {
      pages.push(1, 2, 3, '...', this.totalPages);
    } else if (this.page() >= this.totalPages - 2) {
      pages.push(1, '...', this.totalPages - 2, this.totalPages - 1, this.totalPages);
    } else {
      pages.push(1, '...', this.page() - 1, this.page(), this.page() + 1, '...', this.totalPages);
    }

    return pages;
  }

  ngOnChanges(): void {
	  this.pages = this.getSmartPaginationRange();
  }
}
