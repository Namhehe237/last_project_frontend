import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TabInterface } from '#common/components/tab/tab.component';
import {CardHeaderComponent} from '#common/components/card-header/card-header.component';
import { StudentList } from "./student-list/student-list";
import { TeacherList } from "./teacher-list/teacher-list";
import { AdminList } from "./admin-list/admin-list";
import { DialogService } from '#common/services/dialog.service';
import { NotificationService } from '#common/services/notification.service';

@Component({
  selector: 'app-manage-user',
  imports: [StudentList, TeacherList, AdminList, CardHeaderComponent],
  templateUrl: './manage-user.html',
  styleUrl: './manage-user.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManageUser {
  readonly #dialogService = inject(DialogService);
  readonly #notificationService = inject(NotificationService);
  protected tabList: TabInterface[] = [
		{name: 'Học sinh', value: 'student'},
    {name: 'Giáo viên', value: 'teacher'},
    {name: 'Admin', value: 'admin'},
	];

	tab: TabInterface = {name: 'Học sinh', value: 'student'};

	onChangeTab(tab: TabInterface): void {
		this.tab = tab;
	}

  openAddUserDialog(): void {
    const dialog = this.#dialogService.openDialogAddUser();

    dialog.addUserResult.subscribe((result: boolean) => {
      if (result) {
      this.#notificationService.show('Thêm người dùng thành công', 'success');
      this.onChangeTab(this.tab);
      } else {
        this.#notificationService.show('Thêm người dùng thất bại', 'error');
      }
    });
    
  }
}
