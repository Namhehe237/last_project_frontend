import { Routes } from '@angular/router';
import { sessionGuard } from './auth.guard';

export const routes: Routes = [
	{
		path: 'login',
		loadComponent: () => import('./routes/login/login').then(c => c.Login)
	},
    {
		path: 'register',
		loadComponent: () => import('./routes/register/register').then(c => c.Register)
	},
	{
		path: 'main',
		loadChildren: () => import('./routes/main/main.routes'),
		canActivate: [sessionGuard]
	},
	{
		path:'',
		redirectTo: 'login', pathMatch: 'full'
	},
	{
		path: '**', loadComponent: () => import('./routes/page-404/page-404').then(c => c.Page404)
	}
];
