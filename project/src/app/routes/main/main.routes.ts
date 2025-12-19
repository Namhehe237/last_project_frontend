import { Route } from '@angular/router';
import { authoritiesGuard } from '../../auth.guard';
import { sessionGuard } from '../../auth.guard';

export default [
  {
    path: '',
    canActivate: [sessionGuard],
    loadComponent: () =>
      import('./main').then(c => c.Main),
    children: [
		{
			path: 'create-class',
			loadComponent: () => import('./routes/create-class/create-class').then(c => c.CreateClass),
			canActivate: [authoritiesGuard],
			data: {
				allow: ['TEACHER']
			}
		},
		{
			path: 'create-test',
			loadComponent: () => import('./routes/create-test/create-test').then(c => c.CreateTest),
			canActivate: [authoritiesGuard],
			data: {
				allow: ['TEACHER', 'ADMIN']
			}
		},
		{
			path: 'pre-test/:examId',
			loadComponent: () => import('./routes/pre-test/pre-test').then(c => c.PreTest),
			canActivate: [authoritiesGuard],
			data: {
				allow: ['STUDENT']
			}
		},
		{
			path: 'do-test/:examId',
			loadComponent: () => import('./routes/do-test/do-test').then(c => c.DoTest),
			canActivate: [authoritiesGuard],
			data: {
				allow: ['STUDENT']
			}
		},
		{
			path: 'my-test',
			loadComponent: () => import('./routes/my-test/my-test').then(c => c.MyTest),
			canActivate: [authoritiesGuard],
			data: {
				allow: ['STUDENT']
			}
		},
		{
			path: 'manage-account/:userId',
			loadComponent: () => import('./routes/manage-account/manage-account').then(c => c.ManageAccount),
			canActivate: [authoritiesGuard],
			data: {
				allow: true
			}
		},
		{
			path: 'manage-class',
        loadComponent: () => import('./routes/manage-class/manage-class').then(c => c.ManageClass),
        canActivate: [authoritiesGuard],
        data: {
          allow: ['ADMIN']
        }
      },
		{
			path: 'manage-user',
			loadComponent: () => import('./routes/manage-user/manage-user').then(c => c.ManageUser),
			canActivate: [authoritiesGuard],
			data: {
				allow: ['ADMIN']
			}
		},
		{
			path: 'my-class',
			loadComponent: () => import('./routes/my-class/my-class').then(c => c.MyClass),
			canActivate: [authoritiesGuard],
			data: {
				allow: ['TEACHER']
			}
		},
		{
			path: 'my-class-student',
			loadComponent: () => import('./routes/my-class-student/my-class-student').then(c => c.MyClassStudent),
			canActivate: [authoritiesGuard],
			data: {
				allow: ['STUDENT']
			}
		},
		{
			path: 'test-history',
			loadComponent: () => import('./routes/test-history/test-history').then(c => c.TestHistory),
			canActivate: [authoritiesGuard],
			data: {
				allow: ['STUDENT']
			}
		},
		{
			path: 'class-detail/:classId',
			loadComponent: () => import('./routes/class-detail/class-detail').then(c => c.ClassDetail),
			canActivate: [authoritiesGuard],
			data: {
				allow: true
			}
		},
		{
			path: 'notifications',
			loadComponent: () => import('./routes/notifications/notifications').then(c => c.Notifications),
			canActivate: [authoritiesGuard],
			data: {
				allow: true
			}
		},
		{
			path: 'exam-management',
			loadComponent: () => import('./routes/exam-management/exam-management').then(c => c.ExamManagement),
			canActivate: [authoritiesGuard],
			data: {
				allow: ['TEACHER', 'ADMIN']
			}
		},
	  
    ]
  }
] as Route[];
