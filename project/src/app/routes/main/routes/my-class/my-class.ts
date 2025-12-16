import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, viewChild, OnInit } from '@angular/core';
import { ColumnInterface, TableComponent, TableRowData } from '#common/components/table/table.component';
import { Router } from '@angular/router';
import { ListClassContent } from '#common/models/ListClassResponse';
import { ClassService } from '#common/services/class.service';
import { AuthService } from '#common/services/auth.service';
import { NotificationService } from '#common/services/notification.service';

interface ClassInterface extends ListClassContent, TableRowData {
  classCodeHref?: () => void;
}

@Component({
  selector: 'app-my-class',
  imports: [TableComponent],
  templateUrl: './my-class.html',
  styleUrl: './my-class.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyClass implements OnInit {
  readonly #classService = inject(ClassService);
  readonly #authService = inject(AuthService);
  readonly #notificationService = inject(NotificationService);
  readonly #cdr = inject(ChangeDetectorRef);
  readonly router = inject(Router);
  readonly dataTable = viewChild<TableComponent>('dataTable');
  isLoading = false;
  totalElements = 0;

  classes: ClassInterface[] = [];
  columns: ColumnInterface[] = [
    {
      title: 'MÃ LỚP',
      field: 'classCode',
      isStickyFirst: true,
      isHref: true,
    },
    {
      title: 'TÊN LỚP',
      field: 'className',
    },
    {
      title: 'MÔ TẢ',
      field: 'description',
    },
    {
      title: 'SỐ HỌC SINH',
      field: 'studentCount',
      isCount: true,
    },
    {
      title: 'THỜI GIAN TẠO',
      field: 'createdAt',
      isFormattedDate: true,
    }
  ];
    
  ngOnInit(): void {
    this.search(true);
  }

  search(isSearch: boolean) {
    if (isSearch) {
      const dataTable = this.dataTable();
      if (dataTable) {
        dataTable.page = 1;
      }
    }

    this.isLoading = true;
    const pageNumber = this.dataTable()?.page ?? 1;
    const pageSize = this.dataTable()?.pageSize ?? 10;
    const teacherId = this.#authService.userId;

    if (!teacherId) {
      this.#notificationService.show('Người dùng chưa được xác thực!', 'error');
      this.isLoading = false;
      this.#cdr.markForCheck();
      return;
    }

    this.#classService.listClassOfTeacher(teacherId, pageNumber - 1, pageSize).subscribe({
      next: (data) => {
        this.classes = (data.content ?? []).map(item => ({
          classCodeHref: () => this.router.navigate(['/main/class-detail', item.classId]),
          ...item,
        }));
        this.isLoading = false;
        this.totalElements = data.totalElements ?? 0;
        this.#cdr.markForCheck();
      },
      error: () => {
        this.classes = [];
        this.totalElements = 0;
        this.isLoading = false;
        this.#notificationService.show('Không thể tải danh sách lớp học!', 'error');
        this.#cdr.markForCheck();
      }
    });
  }

  reloadData() {
    this.search(false);
  }
}
