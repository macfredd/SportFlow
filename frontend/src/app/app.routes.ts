import { Routes } from '@angular/router';

import { AppLayoutComponent } from './core/layout/app-layout/app-layout.component';
import { SectionPlaceholderComponent } from './shared/containers/section-placeholder/section-placeholder.component';

export const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    children: [
      {
        path: '',
        component: SectionPlaceholderComponent,
        data: { title: 'Home' },
      },
      {
        path: 'activities',
        component: SectionPlaceholderComponent,
        data: { title: 'Actividades' },
      },
      {
        path: 'mapa',
        component: SectionPlaceholderComponent,
        data: { title: 'Mapa' },
      },
      {
        path: 'fotos',
        component: SectionPlaceholderComponent,
        data: { title: 'Fotos' },
      },
      {
        path: 'retos',
        component: SectionPlaceholderComponent,
        data: { title: 'Retos' },
      },
    ],
  },
];
