import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@ngneat/transloco';
import { map } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-activity-detail-page',
  imports: [TranslocoPipe],
  templateUrl: './activity-detail-page.component.html',
})
export class ActivityDetailPageComponent {
  private readonly route = inject(ActivatedRoute);

  readonly activityId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('activityId'))),
    { initialValue: null },
  );
}
