import { Routes } from '@angular/router';

import { AppLayoutComponent } from './core/layout/app-layout/app-layout.component';
import { ActivitiesListPageComponent } from './features/activities/pages/activities-list-page/activities-list-page.component';
import { ActivityDetailPageComponent } from './features/activities/pages/activity-detail-page/activity-detail-page.component';
import { SectionPlaceholderComponent } from './shared/containers/section-placeholder/section-placeholder.component';

export const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    children: [
      {
        path: '',
        component: SectionPlaceholderComponent,
        data: { titleKey: 'nav.home' },
      },
      {
        path: 'activities',
        component: ActivitiesListPageComponent,
        data: { titleKey: 'nav.activities' },
      },
      {
        path: 'activities/:activityId',
        component: ActivityDetailPageComponent,
        data: { titleKey: 'nav.activityDetail' },
      },
      {
        path: 'mapa',
        component: SectionPlaceholderComponent,
        data: { titleKey: 'nav.map' },
      },
      {
        path: 'fotos',
        component: SectionPlaceholderComponent,
        data: { titleKey: 'nav.photos' },
      },
      {
        path: 'retos',
        component: SectionPlaceholderComponent,
        data: { titleKey: 'nav.challenges' },
      },
    ],
  },
];
