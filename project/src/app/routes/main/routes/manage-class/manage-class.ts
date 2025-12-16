import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, viewChild, OnInit} from '@angular/core';
import {ColumnInterface, TableComponent, TableRowData} from '#common/components/table/table.component';
import { Router } from '@angular/router';
import { ListClassContent } from '#common/models/ListClassResponse';
import { AdminService } from '#common/services/admin.service';
import { ClassService } from '#common/services/class.service';
import { NotificationService } from '#common/services/notification.service';
import { DialogService } from '#common/services/dialog.service';
import { DrawerComponent } from '#common/components/drawer/drawer';
import { UpdateClassDrawerComponent } from './update-class-drawer/update-class-drawer';

interface ClassInterface extends ListClassContent, TableRowData {
  classCodeHref?: () => void;
}

@Component({
  selector: 'app-manage-class',
  imports: [TableComponent, DrawerComponent, UpdateClassDrawerComponent],
  templateUrl: './manage-class.html',
  styleUrl: './manage-class.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManageClass implements OnInit {
  readonly #adminService = inject(AdminService);
  readonly #notificationService = inject(NotificationService);
  readonly #classService = inject(ClassService);
  readonly #dialogService = inject(DialogService);
  readonly #cdr = inject(ChangeDetectorRef);
  readonly router = inject(Router);
  readonly dataTable = viewChild<TableComponent>('dataTable');
  isLoading = false;
  totalElements = 0;
  isUpdateDrawerOpen = false;
  selectedClassForUpdate: ClassInterface | null = null;

  classes: ClassInterface[] = [];
  columns: ColumnInterface[] = [
    {
      title: 'Mã lớp',
      field: 'classCode',
      isStickyFirst: true,
      isHref: true,
    },
    {
      title: 'Tên lớp',
      field: 'className',
    },
    {
      title: 'Tên giáo viên',
      field: 'teacherName',
    },
    {
      title: 'Email giáo viên',
      field: 'teacherEmail',
    },
    {
      title: 'Mô tả',
      field: 'description',
    },
    {
      title: 'Hành động',
      field: 'action',
      isStickyEnd: true,
      isAction: true,
      width: 300
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

    this.#adminService.getListClass(pageNumber - 1, pageSize).subscribe({
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
        this.#cdr.markForCheck();
      }
    });
  }

  reloadData() {
    this.search(false);
  }

  onActionClick(event: {action: string, data: ClassInterface}) {
    const {action, data} = event;

    if (action === 'delete-class') {
      this.isLoading = true;
      this.#classService.deleteClass([data.classId ?? 0]).subscribe({
        next: () => {
          this.isLoading = false;
          this.#notificationService.show('Xóa lớp học thành công!', 'success');
          this.reloadData();
        },
        error: () => {
          this.isLoading = false;
          this.#notificationService.show('Xóa lớp học thất bại', 'error');
          this.#cdr.markForCheck();
        }
      });
    } else if (action === 'update-class') {
      this.selectedClassForUpdate = data;
      this.isUpdateDrawerOpen = true;
      this.#cdr.markForCheck();
    }
  }

  openCreateClassDialog() {
    const dialog = this.#dialogService.openDialogAddClass();

    dialog.createClassResult.subscribe((result: boolean) => {
      if (result) {
        this.#notificationService.show('Tạo lớp học thành công', 'success');
        this.reloadData();
      } else {
        this.#notificationService.show('Tạo lớp học thất bại', 'error');
      }
    });
  }

  onUpdateClassResult(result: boolean) {
    if (result) {
      this.reloadData();
    }
  }

  onCloseUpdateDrawer() {
    this.isUpdateDrawerOpen = false;
    this.selectedClassForUpdate = null;
    this.#cdr.markForCheck();
  }
}
