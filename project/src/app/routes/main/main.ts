import { ChangeDetectionStrategy, Component, effect, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MenuItem1Component } from './menu-item-1/menu-item-1.component';
import { MenuItem2Component } from './menu-item-2/menu-item-2.component';
import { MenuItemInterface } from './main.interface';
import { ExMenuItemInterface } from './menu-item-2/menu-item-2.interface';
import { AuthoritiesCheck, AuthService } from '#common/services/auth.service';
import { DialogService } from '../../common/services/dialog.service';
import { HttpErrorResponse } from '@angular/common/http';
import { MessageService } from '../../common/services/message.service';
import { NotificationBellComponent } from '../../common/components/notification-bell/notification-bell.component';
import mainRoutes from './main.routes';

@Component({
  selector: 'app-main',
  imports: [RouterOutlet, MenuItem1Component, MenuItem2Component, NotificationBellComponent],
  templateUrl: './main.html',
  styleUrl: './main.css',
  providers: [DialogService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Main implements OnInit {
  protected readonly menu_manage: MenuItemInterface[];
  protected readonly menu_class: MenuItemInterface[];
  protected readonly menu_test: MenuItemInterface[];
  readonly #menu_1: MenuItemInterface[];
  protected menu_1: ExMenuItemInterface[] = [];

  readonly #authSvc = inject(AuthService);
  readonly #dialog = inject(DialogService);
  readonly #message = inject(MessageService);
  readonly #router = inject(Router);

  #setAuthorities(menus: MenuItemInterface[]): void {
    menus.forEach(menu => {
      let route = mainRoutes[0]?.children?.find(v => v.path === menu.link);
      
      route ??= mainRoutes[0]?.children?.find(v => {
          if (v.path?.includes(':')) {
            const routePattern = v.path.split('/');
            const linkPattern = menu.link.split('/');
            
            if (routePattern.length === linkPattern.length) {
              return routePattern.every((segment, index) => {
                return segment.startsWith(':') || segment === linkPattern[index];
              });
            }
          }
          return false;
        });
      
      menu.authorities.allow = (route?.data as AuthoritiesCheck | undefined)?.allow
    })
  }

  constructor() {
    const currentUserId: number = this.#authSvc.userId ?? 0;
    
    this.menu_manage = [
      {label: 'Quản lý tài khoản', link: `manage-account/${currentUserId}`, authorities: {allow: true}},
      {label: 'Quản lý người dùng', link: 'manage-user', authorities: {allow: true}},
      {label: 'Quản lý lớp học', link: 'manage-class', authorities: {allow: true}},
    ];

    this.#menu_1 = [  
      {label: 'Placeholder', link: '', authorities: {allow: true}},
    ]
    
    this.menu_test = [
      {label: 'Bài kiểm tra của tôi', link: 'my-test', authorities: {allow: true}},
      {label: 'Lịch sử bài làm', link: 'test-history', authorities: {allow: true}},
      {label: 'Tạo đề thi', link: 'create-test', authorities: {allow: true}},
      {label: 'Quản lý bài thi', link: 'exam-management', authorities: {allow: true}},
    ]

    this.menu_class = [
      {label: 'Tạo lớp học', link: 'create-class', authorities: {allow: true}},
      {label: 'Lớp học của tôi', link: 'my-class', authorities: {allow: true}},
      {label: 'Lớp học của tôi', link: 'my-class-student', authorities: {allow: true}},
    ]
    

    effect(() => {
      this.menu_1 = this.#menu_1.map<ExMenuItemInterface>(v => {
        return {...v, isShow: this.#authSvc.getAuthoritiesCheck(v.authorities) }
      });
    });
  }

  ngOnInit(): void {
    this.#setAuthorities(this.#menu_1);
    this.#setAuthorities(this.menu_manage);
    this.#setAuthorities(this.menu_test);
    this.#setAuthorities(this.menu_class);
  }

  onSignOut() {
    const spinner = this.#dialog.openSpinner();

    this.#authSvc.signOut().subscribe({
      next: () => {
        spinner.close();
        
        void this.#router.navigateByUrl('/login');
      },
      error: (err: HttpErrorResponse) => {
        this.#message.error(err, () => {
          spinner.close();
        })
      }
    })
  }
}



