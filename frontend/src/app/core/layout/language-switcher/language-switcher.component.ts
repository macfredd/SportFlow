import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { map, merge, of } from 'rxjs';

import { APP_LANG_STORAGE_KEY } from '../../i18n/lang-storage';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule, TranslocoPipe],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss',
})
export class LanguageSwitcherComponent {
  private readonly transloco = inject(TranslocoService);

  readonly activeLang = toSignal(
    merge(of(this.transloco.getActiveLang()), this.transloco.langChanges$).pipe(
      map(() => this.transloco.getActiveLang()),
    ),
    { initialValue: this.transloco.getActiveLang() },
  );

  setLang(lang: 'es' | 'en'): void {
    this.transloco.setActiveLang(lang);
    try {
      localStorage.setItem(APP_LANG_STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
  }
}
