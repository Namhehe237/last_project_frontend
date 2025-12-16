import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, viewChild, OnInit} from '@angular/core';
import {ColumnInterface, TableComponent, TableRowData} from '../../../../../common/components/table/table.component';
import { AdminService } from '#common/services/admin.service';
import { ListUserContent } from '#common/models/ListUserResponse';
import { Router } from '@angular/router';
import { NotificationService } from '#common/services/notification.service';

interface StudentInterface extends ListUserContent, TableRowData {
  fullNameHref?: () => void;
}

@Component({
  selector: 'app-student-list',
  imports: [TableComponent],
  templateUrl: './student-list.html',
  styleUrl: './student-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentList implements OnInit {
  readonly #adminService = inject(AdminService);
  readonly #notificationService = inject(NotificationService);
  readonly #cdr = inject(ChangeDetectorRef)
  readonly router = inject(Router);
  readonly dataTable = viewChild<TableComponent>('dataTable');
  isLoading = false;
  totalElements = 0;

  students: StudentInterface[] = [];

  columns: ColumnInterface[] = [
		{
			title: 'HỌ TÊN',
			field: 'fullName',
			isHref: true,
			isStickyFirst: true
		},
		{
			title: 'EMAIL',
			field: 'email',
		},
		{
			title: 'SỐ ĐIỆN THOẠI',
      field: 'phoneNumber',
    },
		{
			title: 'XÓA',
			field: 'action',
			isStickyEnd: true,
			isAction: true,
			width: 250
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
		const pageSize = this.dataTable()?.pageSize ?? 20;

		this.#adminService.getListUser(pageNumber - 1, pageSize, 'STUDENT').subscribe({
			next: (data) => {
				this.students = (data?.content ?? []).map((student: ListUserContent): StudentInterface => ({
					fullNameHref: () => {
						void this.router.navigate(['/main/manage-account', student.userId]);
					},
					...student,
				}));
				this.isLoading = false;
				this.totalElements = data.totalElements ?? 0;
				this.#cdr.markForCheck();
			},
			error: () => {
				this.totalElements = 0;
				this.students = [];
				this.isLoading = false;
				this.#cdr.markForCheck();
			}
		});
	}

  reloadData() {
		this.search(false);
	}

  onActionClick(event: {action: string, data: StudentInterface}) {
		const {action, data} = event;

		if (action === 'delete-user') {
      this.isLoading = true;
			this.#adminService.deleteUser([data.userId ?? 0]).subscribe({
        next: () => {
          this.isLoading = false;
          this.#notificationService.show('Xóa người dùng thành công!', 'success');
          this.reloadData();
          this.#cdr.markForCheck();
        },
        error: () => {
          this.isLoading = false;
          this.#notificationService.show('Xóa người dùng thất bại!', 'error');
          this.#cdr.markForCheck();
        }
      });
		}
	}
}
