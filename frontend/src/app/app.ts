import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly transloco = inject(TranslocoService);

  constructor() {
    this.syncHtmlLang();
    this.transloco.langChanges$.subscribe(() => this.syncHtmlLang());
  }

  private syncHtmlLang(): void {
    document.documentElement.lang = this.transloco.getActiveLang();
  }
}
