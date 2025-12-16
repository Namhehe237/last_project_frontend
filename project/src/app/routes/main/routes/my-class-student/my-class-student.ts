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
      title: 'CLASS CODE',
      field: 'classCode',
      isStickyFirst: true,
      isHref: true,
    },
    {
      title: 'CLASS NAME',
      field: 'className',
    },
    {
      title: 'DESCRIPTION',
      field: 'description',
    },
    {
      title: 'STUDENT COUNT',
      field: 'studentCount',
      isCount: true,
    },
    {
      title: 'CREATED AT',
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
      this.#notificationService.show('User not authenticated!', 'error');
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
        this.#notificationService.show('Failed to load classes!', 'error');
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
        this.#notificationService.show('Join class request sent successfully', 'success');
        this.reloadData();
      } else {
        this.#notificationService.show('Failed to send join class request', 'error');
      }
    });
  }
}
