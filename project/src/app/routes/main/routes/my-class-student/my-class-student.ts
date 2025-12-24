import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, viewChild, OnInit, ViewContainerRef } from '@angular/core';
import { ColumnInterface, TableComponent, TableRowData } from '#common/components/table/table.component';
import { Router } from '@angular/router';
import { ListClassContent } from '#common/models/ListClassResponse';
import { StudentService } from '#common/services/student.service';
import { AuthService } from '#common/services/auth.service';
import { NotificationService } from '#common/services/notification.service';
import { DialogJoinClass } from './dialog-join-class/dialog-join-class';

interface ClassInterface extends ListClassContent, TableRowData {
  classCodeHref?: () => void;
}

@Component({
  selector: 'app-my-class-student',
  imports: [TableComponent],
  templateUrl: './my-class-student.html',
  styleUrl: './my-class-student.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyClassStudent implements OnInit {
  readonly #studentService = inject(StudentService);
  readonly #authService = inject(AuthService);
  readonly #notificationService = inject(NotificationService);
  readonly #vcr = inject(ViewContainerRef);
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
      title: 'SỐ LƯỢNG HỌC SINH',
      field: 'studentCount',
      isCount: true,
    },
    {
      title: 'NGÀY TẠO',
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
    const studentId = this.#authService.userId;

    if (!studentId) {
      this.#notificationService.show('Người dùng chưa được xác thực!', 'error');
      this.isLoading = false;
      this.#cdr.markForCheck();
      return;
    }

    this.#studentService.getStudentClassList(studentId).subscribe({
      next: (data) => {
        this.classes = (data ?? []).map(item => ({
          classCodeHref: () => this.router.navigate(['/main/class-detail', item.classId]),
          ...item,
        }));
        this.isLoading = false;
        this.totalElements = data.length ?? 0;
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

  openJoinClassDialog() {
    const compRef = this.#vcr.createComponent(DialogJoinClass);
    compRef.setInput('compRef', compRef);
    compRef.instance.open();

    compRef.instance.joinClassResult.subscribe((result: boolean) => {
      if (result) {
        this.#notificationService.show('Yêu cầu tham gia lớp học đã được gửi thành công', 'success');
        this.reloadData();
      } else {
        this.#notificationService.show('Không thể gửi yêu cầu tham gia lớp học', 'error');
      }
    });
  }
}
