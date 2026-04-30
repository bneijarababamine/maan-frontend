import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./shared/layout/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'members',
        loadComponent: () => import('./features/members/members-list/members-list.component').then(m => m.MembersListComponent)
      },
      {
        path: 'members/new',
        loadComponent: () => import('./features/members/member-form/member-form.component').then(m => m.MemberFormComponent)
      },
      {
        path: 'members/:id',
        loadComponent: () => import('./features/members/member-detail/member-detail.component').then(m => m.MemberDetailComponent)
      },
      {
        path: 'members/:id/edit',
        loadComponent: () => import('./features/members/member-form/member-form.component').then(m => m.MemberFormComponent)
      },
      {
        path: 'contributions',
        loadComponent: () => import('./features/contributions/contributions-list/contributions-list.component').then(m => m.ContributionsListComponent)
      },
      {
        path: 'contributions/new',
        loadComponent: () => import('./features/contributions/contribution-form/contribution-form.component').then(m => m.ContributionFormComponent)
      },
      {
        path: 'contributions/:id',
        loadComponent: () => import('./features/contributions/contribution-detail/contribution-detail.component').then(m => m.ContributionDetailComponent)
      },
      {
        path: 'contributions/:id/edit',
        loadComponent: () => import('./features/contributions/contribution-edit/contribution-edit.component').then(m => m.ContributionEditComponent)
      },
      {
        path: 'donors',
        loadComponent: () => import('./features/donors/donors-list/donors-list.component').then(m => m.DonorsListComponent)
      },
      {
        path: 'donors/new',
        loadComponent: () => import('./features/donors/donor-form/donor-form.component').then(m => m.DonorFormComponent)
      },
      {
        path: 'donors/:id',
        loadComponent: () => import('./features/donors/donor-detail/donor-detail.component').then(m => m.DonorDetailComponent)
      },
      {
        path: 'donors/:id/edit',
        loadComponent: () => import('./features/donors/donor-form/donor-form.component').then(m => m.DonorFormComponent)
      },
      {
        path: 'donations',
        loadComponent: () => import('./features/donations/donations-list/donations-list.component').then(m => m.DonationsListComponent)
      },
      {
        path: 'donations/new',
        loadComponent: () => import('./features/donations/donation-form/donation-form.component').then(m => m.DonationFormComponent)
      },
      {
        path: 'donations/:id',
        loadComponent: () => import('./features/donations/donation-detail/donation-detail.component').then(m => m.DonationDetailComponent)
      },
      {
        path: 'orphans',
        loadComponent: () => import('./features/orphans/orphans-list/orphans-list.component').then(m => m.OrphansListComponent)
      },
      {
        path: 'orphans/new',
        loadComponent: () => import('./features/orphans/orphan-form/orphan-form.component').then(m => m.OrphanFormComponent)
      },
      {
        path: 'orphans/:id',
        loadComponent: () => import('./features/orphans/orphan-detail/orphan-detail.component').then(m => m.OrphanDetailComponent)
      },
      {
        path: 'orphans/:id/edit',
        loadComponent: () => import('./features/orphans/orphan-form/orphan-form.component').then(m => m.OrphanFormComponent)
      },
      {
        path: 'families',
        loadComponent: () => import('./features/families/families-list/families-list.component').then(m => m.FamiliesListComponent)
      },
      {
        path: 'families/new',
        loadComponent: () => import('./features/families/family-form/family-form.component').then(m => m.FamilyFormComponent)
      },
      {
        path: 'families/:id',
        loadComponent: () => import('./features/families/family-detail/family-detail.component').then(m => m.FamilyDetailComponent)
      },
      {
        path: 'families/:id/edit',
        loadComponent: () => import('./features/families/family-form/family-form.component').then(m => m.FamilyFormComponent)
      },
      {
        path: 'activities',
        loadComponent: () => import('./features/activities/activities-list/activities-list.component').then(m => m.ActivitiesListComponent)
      },
      {
        path: 'activities/new',
        loadComponent: () => import('./features/activities/activity-form/activity-form.component').then(m => m.ActivityFormComponent)
      },
      {
        path: 'activities/:id',
        loadComponent: () => import('./features/activities/activity-detail/activity-detail.component').then(m => m.ActivityDetailComponent)
      },
      {
        path: 'activities/:id/edit',
        loadComponent: () => import('./features/activities/activity-form/activity-form.component').then(m => m.ActivityFormComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
      },
      {
        path: 'gestion',
        loadComponent: () => import('./features/gestion/gestion.component').then(m => m.GestionComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
