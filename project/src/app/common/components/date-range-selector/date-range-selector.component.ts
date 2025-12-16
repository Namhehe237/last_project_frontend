import {ChangeDetectionStrategy, Component, input, OnInit, output} from '@angular/core';
import {ReactiveFormsModule, UntypedFormControl} from '@angular/forms';
import {DatePipe} from '@angular/common';

export interface DateRangeOutput {
  range: string;
  fromDate: string | null;
  toDate: string | null;
}

@Component({
  selector: 'app-date-range-selector',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './date-range-selector.component.html',
  styleUrl: './date-range-selector.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DateRangeSelectorComponent implements OnInit {
  readonly defaultRange = input('30d');
  readonly showLabel = input(true);
  readonly showDates = input(true);
  
  dateRangeChanged = output<DateRangeOutput>();

  dateRanges = [{
    value: '30d',
    label: 'last 30 days'
  }, {
    value: '60d',
    label: 'last 60 days'
  }, {
    value: '90d',
    label: 'last 90 days'
  }, {
    value: '6m',
    label: 'last 6 months'
  }, {
    value: 'custom',
    label: 'Custom'
  }, {
    value: 'all',
    label: 'All Orders'
  }];

  selectedDateRange = new UntypedFormControl('30d');
  fromDate = new UntypedFormControl(null);
  toDate = new UntypedFormControl(null);

	customFromDate = new UntypedFormControl(this.formatDate(new Date()));
  customToDate = new UntypedFormControl(this.formatDate(new Date()));

	constructor() {
    this.customFromDate.valueChanges.subscribe(() => {
      if (this.selectedDateRange.value === 'custom') {
        this.updateFromCustomDates();
      }
    });

    this.customToDate.valueChanges.subscribe(() => {
      if (this.selectedDateRange.value === 'custom') {
        this.updateFromCustomDates();
      }
    });
  }

  ngOnInit(): void {
    this.selectedDateRange.setValue(this.defaultRange());
    this.initializeDateRange(this.defaultRange());
    
    this.selectedDateRange.valueChanges.subscribe(value => {
      this.handleDateRangeChange(value as string);
    });
  }

  private initializeDateRange(value: string): void {
    switch (value) {
      case '30d': {
        this.changeDate('d', 30);
        break;
      }
      case '60d': {
        this.changeDate('d', 60);
        break;
      }
      case '90d': {
        this.changeDate('d', 90);
        break;
      }
      case '6m': {
        this.changeDate('m', 6);
        break;
      }
			case 'custom': {
        this.customFromDate.setValue(this.fromDate.value ?? this.formatDate(new Date()));
        this.customToDate.setValue(this.toDate.value ?? this.formatDate(new Date()));
        this.updateFromCustomDates();
        break;
      }
      case 'all': {
        this.fromDate.setValue(null);
        this.toDate.setValue(null);
        break;
      }
    }
    this.emitDateRangeChange();
  }

  private handleDateRangeChange(value: string): void {
    this.initializeDateRange(value);
  }

  private formatDate(date: Date): string {
    const parts = date.toISOString().split('T');
    return parts[0] ?? '';
  }

  private changeDate(type: string, range: number): void {
    const date = new Date();
    this.toDate.setValue(this.formatDate(date));
    switch (type) {
      case 'd': {
        date.setDate(date.getDate() - range);
        break;
      }
      case 'm': {
        date.setMonth(date.getMonth() - range);
        break;
      }
    }
    this.fromDate.setValue(this.formatDate(date));
  }

	private updateFromCustomDates(): void {
    this.fromDate.setValue(this.customFromDate.value);
    this.toDate.setValue(this.customToDate.value);
    this.emitDateRangeChange();
  }

  private emitDateRangeChange(): void {
    const range = (this.selectedDateRange.value as string) ?? 'all';
    this.dateRangeChanged.emit({
      range,
      fromDate: this.fromDate.value as string | null,
      toDate: this.toDate.value as string | null
    });
  }
} 