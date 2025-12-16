import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {PagingComponent} from '../pagging/paging.component';
import {catchError, debounceTime, of, Subject, Subscription, switchMap} from 'rxjs';
import { TeacherService } from '#common/services/teacher.service';
import { TeacherOption } from '#common/models/TeacherOption';
import { ListTeacherResponse } from '#common/models/ListTeacherResponse';

@Component({
  selector: 'app-teacher-autocomplete-select',
  imports: [PagingComponent],
  templateUrl: './teacher-autocomplete-select.component.html',
  styleUrl: './teacher-autocomplete-select.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'handleClickOutside($event)'
  }
})
export class TeacherAutocompleteSelectComponent implements OnInit, OnDestroy {
  readonly dropdown = viewChild<ElementRef<HTMLElement>>('dropdown');
  readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  readonly #teacherService = inject(TeacherService);
  readonly disabled = input<boolean>(false);
  readonly selected = output<number | undefined>();
  readonly selectedTeacher = output<TeacherOption | undefined>();
  readonly selectedItem = signal<TeacherOption | null>(null);
  readonly searchTerm = signal('');
  readonly options = signal<TeacherOption[]>([]);
  readonly page = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);
  readonly loading = signal(false);
  readonly showDropdown = signal(false);
  readonly isFirstFocus = signal(false);

  private searchSubject = new Subject<string>();
  private sub: Subscription = Subscription.EMPTY;

  ngOnInit(): void {
    this.sub = this.searchSubject
      .pipe(
        debounceTime(300),
        switchMap((term) => {
          this.page.set(0);
          this.loading.set(true);
          return this.#teacherService.searchTeachers(this.page(), this.pageSize(), term).pipe(
            catchError(() => {
              return of({ content: [], totalElements: 0, totalPages: 0 });
            }));
        })
      )
      .subscribe((response: ListTeacherResponse) => {
        this.totalElements.set(response?.totalElements ?? 0);
        this.options.set(response.content ?? []);
        this.loading.set(false);
      });
  }

  handleClickOutside(event: MouseEvent) {
    const inputEl = this.searchInput()?.nativeElement;
    const dropdownEl = this.dropdown()?.nativeElement;
    if (
      !inputEl?.contains(event.target as Node) &&
      !dropdownEl?.contains(event.target as Node)
    ) {
      this.showDropdown.set(false);
      this.searchTerm.set(
        !this.searchTerm() ? '' : (this.selectedItem()?.fullName ?? '')
      );
      this.isFirstFocus.set(false);
    }
  }

  onInput(event: Event) {
    if (this.disabled()) return;
    this.searchTerm.set((event.target as HTMLInputElement)?.value ?? '');
    this.showDropdown.set(true);
    this.searchSubject.next(this.searchTerm());
  }

  loadOptions(term: string) {
    if (this.loading() || this.disabled()) return;

    this.loading.set(true);
    this.showDropdown.set(true);

    this.#teacherService.searchTeachers(this.page(), this.pageSize(), term).subscribe({
      next: (response) => {
        this.totalElements.set(response.totalElements ?? 0);
        this.options.set(response.content ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.totalElements.set(0);
        this.options.set([]);
        this.loading.set(false);
      }
    });
  }

  selectOption(option: TeacherOption) {
    if (this.disabled()) return;
    this.showDropdown.set(false);
    this.searchTerm.set(option.fullName ?? '');
    this.selectedItem.set(option);
    this.selected.emit(option.teacherId);
    this.selectedTeacher.emit(option);
  }

  changePage(value: number) {
    this.page.set(value - 1);
    this.loadOptions(this.searchTerm());
  }

  changePageSize(value: number) {
    this.pageSize.set(value);
    this.page.set(0);
    this.loadOptions(this.searchTerm());
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  onFocus() {
    if (this.disabled()) return;
    if (!this.isFirstFocus() && !this.showDropdown()) {
      this.isFirstFocus.set(true);
      this.loadOptions(this.searchTerm());
    } else {
      this.isFirstFocus.set(false);
    }
  }

  reset() {
    this.selectedItem.set(null);
    this.searchTerm.set('');
    this.showDropdown.set(false);
    this.isFirstFocus.set(false);
  }
}

