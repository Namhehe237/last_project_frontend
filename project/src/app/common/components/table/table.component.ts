import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, inject, input, OnChanges, output, SimpleChanges, viewChild} from '@angular/core';
import {PagingComponent} from '../pagging/paging.component';
import {AutoBlockTable} from '../directives/auto-block-table';
import {StatusStreamComponent, StatusInterface} from '../status-stream/status-stream.component';
import {formatDate} from '../../shared/helpers';

export interface ColumnInterface {
  title: string,
  field: string,
  isHref?: boolean,
  isStickyFirst?: boolean,
  isStickyEnd?: boolean,
  isAction?: boolean,
  isColor?: boolean,
  width?: number,
	isShowStatusStream?: boolean,
	isList?: boolean,
	showDashWhenEmpty?: boolean,
	isViewImage?: boolean,
	isCheckbox?: boolean,
	isGrid?: boolean,
	gridConfig?: GridConfig;
	isFormattedDate?: boolean;
	isCount?: boolean;
}

export interface GridConfig {
  fields: GridField[];
}

export interface GridField {
  label: string;
  key: string;
  displayWhenEmpty?: boolean;
  emptyText?: string;
}

export interface TableRowData {
  [key: string]: unknown;
  statusStream?: StatusInterface[];
  isShowStatus?: boolean;
  status?: string;
  isSelected?: boolean;
}

@Component({
  selector: 'app-table',
  imports: [PagingComponent, AutoBlockTable, StatusStreamComponent],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableComponent implements OnChanges {
  readonly autoBlockDirective = viewChild<AutoBlockTable>(AutoBlockTable);
  readonly tableWrapper = viewChild<ElementRef<HTMLDivElement>>('tableWrapper');
  readonly dataTable = viewChild<ElementRef<HTMLDivElement>>('dataTable');
	readonly actionClicked = output<{action: string, data: TableRowData, field?: string, anchor?: HTMLElement;}>();
  readonly classMore = input<string>()
  readonly type = input<string>()
  readonly columns = input.required<ColumnInterface[]>()
  readonly dataSource = input.required<TableRowData[]>();
  readonly showPaging = input.required<boolean>();
  readonly isLoading = input.required<boolean>();
  readonly totalElements = input.required<number>();
  reloadData = output<void>();
  page = 1;
  pageSize = 20;
  needSticky = false;
  private tableWidth = 0;
  private tableTop = 0;
  private isScrolling = false;
	isReload = false;
	
	private selectedRowIds = new Set<string | number>();
	private rowIdField = 'id';

  private cdr = inject(ChangeDetectorRef);

  changePage(event: number) {
    this.page = event;
		this.isReload = true;
    this.reloadData.emit()
  }

  changePageSize(event: number) {
    const newPageSize = event;
    const currentPage = this.page;
    const total = this.totalElements ? (this.totalElements() ?? 0) : 0;
    const newTotalPages = Math.max(1, Math.ceil(total / newPageSize));
    const newPage = currentPage > newTotalPages ? Math.max(1, newTotalPages) : currentPage;

    this.pageSize = newPageSize;
    this.page = newPage;
		this.isReload = true;
    this.reloadData.emit()
  }

  callHref(event: Event, data: TableRowData, field: string) {
    event.preventDefault();
    const map = new Map<string, unknown>(Object.entries(data));
    const hrefFn = map.get(field + 'Href');
    if (typeof hrefFn === 'function') {
      (hrefFn as () => void)();
    } else {
      console.warn(`${field + 'Href'} is not a function`, hrefFn);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columns']) {
      this.needSticky = this.columns().filter(c => c.isStickyFirst ?? c.isStickyEnd).length > 0;
    }

    if (changes['dataSource']) {
      setTimeout(() => {
        this.updateTableDimensions();
        const previousValue = changes['dataSource']?.previousValue as TableRowData[] | undefined;
        this.isReload = Array.isArray(previousValue) && previousValue.length > 0;
				this.autoBlockDirective()?.checkOverflow(this.isReload);
				this.isReload = false;
				
				this.restoreSelectionState();
      }, 0);
    }
  }

  onTableScroll(event: Event): void {
    if (this.isScrolling) return;

    this.isScrolling = true;
    requestAnimationFrame(() => {
      const table = event.target as HTMLElement;
      if (table) {
        const scrollLeft = table.scrollLeft;

            const wrapper = this.tableWrapper()?.nativeElement;
        if (wrapper) {
          const statusWrappers = wrapper.querySelectorAll('._status-stream-wrapper');

          statusWrappers.forEach((element: Element) => {
            const htmlElement = element as HTMLElement;

                    htmlElement.style.transform = `translateX(${scrollLeft}px)`;
            htmlElement.style.width = `${this.getTableWidth()}px`;
          });
        }
      }

      this.isScrolling = false;
    });
  }

  private updateTableDimensions(): void {
    const table = this.dataTable()?.nativeElement;
    const wrapper = this.tableWrapper()?.nativeElement;
    if (table && wrapper) {
      this.tableWidth = table.offsetWidth;
      this.tableTop = wrapper.offsetTop;
      this.cdr.detectChanges();
    }
  }

  getStatusStreamLeft(): number {
    return 0;
  }

  getStatusStreamTop(): number {
    return 0;
  }

  getTableWidth(): number {
    return this.tableWidth || 0;
  }

  getColor(data: TableRowData, column: ColumnInterface, field: string) {
    const map = new Map<string, unknown>(Object.entries(data));
    return column.isColor ? map.get(field + 'Color') : ''
  }

  getValue(data: TableRowData, field: string) {
    const map = new Map<string, unknown>(Object.entries(data));
    return map.get(field);
  }

  getDisplayValue(data: TableRowData, column: ColumnInterface): unknown {
    const value = this.getValue(data, column.field);
    
    if (column.isCount) {
      if (value === null || value === undefined || value === '') {
        return 0;
      }
    }
    
    if (column.isFormattedDate && typeof value === 'string') {
      return formatDate(value);
    }
    
    return value;
  }

	onActionClick(action: string, data: TableRowData, field?: string) {
  	this.actionClicked.emit({ action, data, field });
	}

	getList(data: TableRowData, field: string): unknown[] {
  	const v = this.getValue(data, field);
  	if (Array.isArray(v)) return v;
  	if (v == null) return [];
  	return [v];
	}

	hasList(data: TableRowData, field: string): boolean {
  	return this.getList(data, field).length > 0;
	}

	onRowCheckboxChange(row: TableRowData): void {
		const rowId = this.getRowId(row);
		const isCurrentlySelected = this.selectedRowIds.has(rowId);
		
		if (isCurrentlySelected) {
			this.selectedRowIds.delete(rowId);
		} else {
			this.selectedRowIds.add(rowId);
		}
		
		row.isSelected = !isCurrentlySelected;

		this.actionClicked.emit({
    	action: 'selectionChanged',
    	data: row
  	});

  	this.cdr.markForCheck();
	}

	isSelectAll(): boolean {
  	const rows = this.dataSource() ?? [];
  	return rows.length > 0 && rows.every(r => this.selectedRowIds.has(this.getRowId(r)));
	}

	toggleSelectAll(): void {
  	const rows = this.dataSource() ?? [];
  	const allSelected = this.isSelectAll();
  
  	rows.forEach(r => {
			const rowId = this.getRowId(r);
			
			if (allSelected) {
				this.selectedRowIds.delete(rowId);
				r.isSelected = false;
			} else {
				this.selectedRowIds.add(rowId);
				r.isSelected = true;
			}
    
    	this.actionClicked.emit({
      	action: 'selectionChanged',
      	data: r
    	});
  	});
  
  	this.cdr.markForCheck();
	}

	get hasSelected(): boolean {
  	return this.selectedRowIds.size > 0;
	}
	
	getRowId(row: TableRowData): string | number {
		const idFields = ['questionId', 'id', 'userId', 'examId', 'classId', 'assignmentId', 'postId', 'requestId', 'submissionId'];
		
		for (const field of idFields) {
			if (row[field] !== undefined && row[field] !== null) {
				return row[field] as string | number;
			}
		}
		
		return JSON.stringify(row);
	}

	trackByRowId(index: number, row: TableRowData): string | number {
		return this.getRowId(row);
	}
	
	private restoreSelectionState(): void {
		const rows = this.dataSource() ?? [];
		
		rows.forEach(row => {
			const rowId = this.getRowId(row);
			const isSelected = this.selectedRowIds.has(rowId);
			row.isSelected = isSelected;
		});
		
		this.cdr.markForCheck();
	}
	
	getSelectedRowIds(): (string | number)[] {
		return Array.from(this.selectedRowIds);
	}
	
	clearSelection(): void {
		this.selectedRowIds.clear();
		const rows = this.dataSource() ?? [];
		rows.forEach(row => {
			row.isSelected = false;
		});
		this.cdr.markForCheck();
	}
}
