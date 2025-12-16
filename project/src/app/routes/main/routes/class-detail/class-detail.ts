import { ChangeDetectionStrategy, Component, ChangeDetectorRef, inject, OnInit, viewChild, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClassService } from '#common/services/class.service';
import { ActivatedRoute } from '@angular/router';
import { ClassDetailResponse } from '#common/models/ClassDetailResponse';
import { NotificationService } from '#common/services/notification.service';
import { TableComponent, ColumnInterface, TableRowData } from '#common/components/table/table.component';
import { ListUserContent } from '#common/models/ListUserResponse';
import { ListRequestContent } from '#common/models/ListRequestResponse';
import { AuthService } from '#common/services/auth.service';
import { ClassFeedComponent } from './class-feed/class-feed';
import { CreatePostDialog } from './create-post-dialog/create-post-dialog';
import { CardHeaderComponent, TabInterface } from '#common/components/card-header/card-header.component';

interface StudentInterface extends ListUserContent, TableRowData {
  userIdHref?: () => void;
}

interface RequestInterface extends ListRequestContent, TableRowData {
  requestId: number;
  studentName: string;
  studentEmail: string;
  studentCode: string;
  className: string;
  classCode: string;
  requestedAt: string;
}

@Component({
  selector: 'app-class-detail',
  imports: [CommonModule, TableComponent, ClassFeedComponent, CardHeaderComponent],
  templateUrl: './class-detail.html',
  styleUrl: './class-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClassDetail implements OnInit {
  readonly #classService = inject(ClassService);
  readonly #notificationService = inject(NotificationService);
  readonly #cdr = inject(ChangeDetectorRef);
  readonly #route = inject(ActivatedRoute);
  readonly #auth = inject(AuthService);
  readonly #vcr = inject(ViewContainerRef);
  readonly studentTable = viewChild<TableComponent>('studentTable');
  readonly requestTable = viewChild<TableComponent>('requestTable');
  readonly feedComponent = viewChild<ClassFeedComponent>('feedComponent');

  classDetail: ClassDetailResponse | null = null;
  isLoading = false;
  classId: number | null = null;
  
  students: StudentInterface[] = [];
  totalStudents = 0;
  isLoadingStudents = false;

  requests: RequestInterface[] = [];
  totalRequests = 0;
  isLoadingRequests = false;

  protected get tabList(): TabInterface[] {
    const allTabs: TabInterface[] = [
      { name: 'Thông tin lớp học', value: 'class-info' },
      { name: 'Bảng tin', value: 'feed' },
      { name: 'Danh sách học sinh', value: 'students' },
      { name: 'Danh sách yêu cầu', value: 'requests' }
    ];
    
    if (this.isStudent) {
      return allTabs.filter(t => t.value !== 'requests');
    }
    
    return allTabs;
  }

  tab: TabInterface = { name: 'Thông tin lớp học', value: 'class-info' };

  get studentColumns(): ColumnInterface[] {
    const columns: ColumnInterface[] = [
      {
        title: 'MÃ NGƯỜI DÙNG',
        field: 'userId',
        isHref: true,
        isStickyFirst: true
      },
      {
        title: 'EMAIL',
        field: 'email',
      },
      {
        title: 'HỌ VÀ TÊN',
        field: 'fullName',
      },
      {
        title: 'SỐ ĐIỆN THOẠI',
        field: 'phoneNumber',
      },
    ];
    
    if (!this.isStudent) {
      columns.push({
        title: 'XÓA',
        field: 'action',
        isStickyEnd: true,
        isAction: true,
        width: 200
      });
    }
    
    return columns;
  }

  requestColumns: ColumnInterface[] = [
    {
      title: 'TÊN HỌC SINH',
      field: 'studentName',
    },
    {
      title: 'EMAIL HỌC SINH',
      field: 'studentEmail',
    },
    {
      title: 'MÃ HỌC SINH',
      field: 'studentCode',
    },
    {
      title: 'THỜI GIAN YÊU CẦU',
      field: 'requestedAt',
      isFormattedDate: true
    },
    {
      title: 'HÀNH ĐỘNG',
      field: 'action',
      isStickyEnd: true,
      isAction: true,
      width: 240
    }
  ];

  ngOnInit(): void {
    this.classId = Number(this.#route.snapshot.paramMap.get('classId'));
    if (this.classId) {
      this.loadClassDetail();
    }
  }

  get isStudent(): boolean {
    return this.#auth.role === 'STUDENT';
  }

  onChangeTab(tab: TabInterface): void {
    this.tab = tab;
    this.#cdr.markForCheck();
    
    this.loadTabData(tab.value);
  }

  private loadTabData(tabValue: string): void {
    if (!this.classId) return;

    switch (tabValue) {
      case 'feed':
        setTimeout(() => {
          const feed = this.feedComponent();
          if (feed) {
            feed.loadFeed();
          }
        }, 0);
        break;
      case 'students':
        this.loadStudents();
        break;
      case 'requests':
        if (!this.isStudent) {
          this.loadRequests();
        }
        break;
      case 'class-info':
        break;
    }
  }

  openCreatePostDialog(): void {
    const dialogRef = this.#vcr.createComponent(CreatePostDialog);
    
    if (!this.classId) return;
    
    dialogRef.setInput('classId', this.classId);
    dialogRef.setInput('compRef', dialogRef);

    dialogRef.instance.createPostResult.subscribe((success: boolean) => {
      if (success) {
        const feed = this.feedComponent();
        if (feed) {
          feed.loadFeed();
        }
      }
    });

    dialogRef.instance.closed.subscribe(() => {
      dialogRef.destroy();
    });

    dialogRef.instance.open();
    this.#cdr.markForCheck();
  }

  loadClassDetail(): void {
    if (!this.classId) return;

    this.isLoading = true;
    this.#classService.classDetail(this.classId).subscribe({
      next: (data) => {
        this.classDetail = data;
        this.isLoading = false;
        this.#cdr.markForCheck();
      },
      error: () => {
        this.#notificationService.show('Không thể tải thông tin lớp học!', 'error');
        this.isLoading = false;
        this.#cdr.markForCheck();
      }
    });
  }

  loadStudents(): void {
    if (!this.classId) return;

    this.isLoadingStudents = true;
    const pageNumber = this.studentTable()?.page ?? 1;
    const pageSize = this.studentTable()?.pageSize ?? 20;

    this.#classService.getListStudentOfClass(this.classId, pageNumber - 1, pageSize).subscribe({
      next: (data) => {
        this.students = (data?.content ?? []).map((student: ListUserContent): StudentInterface => ({
          userIdHref: () => {
            console.log('Điều hướng đến học sinh:', student.userId);
          },
          ...student,
        }));
        this.isLoadingStudents = false;
        this.totalStudents = data.totalElements ?? 0;
        this.#cdr.markForCheck();
      },
      error: () => {
        this.#notificationService.show('Không thể tải danh sách học sinh!', 'error');
        this.totalStudents = 0;
        this.students = [];
        this.isLoadingStudents = false;
        this.#cdr.markForCheck();
      }
    });
  }

  loadRequests(): void {
    if (!this.classId) return;

    this.isLoadingRequests = true;
    const pageNumber = this.requestTable()?.page ?? 1;
    const pageSize = this.requestTable()?.pageSize ?? 20;

    this.#classService.getListRequest(this.classId, pageNumber - 1, pageSize).subscribe({
      next: (data) => {
        this.requests = (data?.content ?? []).map((request: ListRequestContent): RequestInterface => ({
          ...request,
        }));
        this.isLoadingRequests = false;
        this.totalRequests = data.totalElements ?? 0;
        this.#cdr.markForCheck();
      },
      error: () => {
        this.#notificationService.show('Không thể tải danh sách yêu cầu!', 'error');
        this.totalRequests = 0;
        this.requests = [];
        this.isLoadingRequests = false;
        this.#cdr.markForCheck();
      }
    });
  }

  onStudentActionClick(event: {action: string, data: StudentInterface}): void {
    const {action, data} = event;

    if (action === 'delete-user') {
      if (!this.classId || !data.userId) return;
      
      this.isLoadingStudents = true;
      this.#classService.removeStudentFromClass(this.classId, [data.userId]).subscribe({
        next: () => {
          this.isLoadingStudents = false;
          this.#notificationService.show('Xóa học sinh thành công!', 'success');
          this.loadStudents();
          this.#cdr.markForCheck();
        },
        error: () => {
          this.isLoadingStudents = false;
          this.#notificationService.show('Không thể xóa học sinh!', 'error');
          this.#cdr.markForCheck();
        }
      });
    }
  }

  onRequestActionClick(event: {action: string, data: TableRowData}): void {
    const {action, data} = event;
    const requestData = data as RequestInterface;

    if (action === 'approve-request') {
      if (!requestData.requestId) return;
      
      this.isLoadingRequests = true;
      this.#classService.responseRequest([requestData.requestId], 'APPROVED').subscribe({
        next: () => {
          this.isLoadingRequests = false;
          this.#notificationService.show('Phê duyệt yêu cầu thành công!', 'success');
          this.loadRequests();
          this.#cdr.markForCheck();
        },
        error: () => {
          this.isLoadingRequests = false;
          this.#notificationService.show('Không thể phê duyệt yêu cầu!', 'error');
          this.#cdr.markForCheck();
        }
      });
    } else if (action === 'reject-request') {
      if (!requestData.requestId) return;
      
      this.isLoadingRequests = true;
      this.#classService.responseRequest([requestData.requestId], 'REJECTED').subscribe({
        next: () => {
          this.isLoadingRequests = false;
          this.#notificationService.show('Từ chối yêu cầu thành công!', 'success');
          this.loadRequests();
          this.#cdr.markForCheck();
        },
        error: () => {
          this.isLoadingRequests = false;
          this.#notificationService.show('Không thể từ chối yêu cầu!', 'error');
          this.#cdr.markForCheck();
        }
      });
    }
  }
}
