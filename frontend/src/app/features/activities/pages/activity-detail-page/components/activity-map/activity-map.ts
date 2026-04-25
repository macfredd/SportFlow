import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  OnDestroy,
  viewChild,
  input,
  signal,
} from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';
import * as L from 'leaflet';

import type { TrackPointRoute } from '../../../../../../shared/models/activity.model';

@Component({
  selector: 'app-activity-map',
  imports: [TranslocoPipe],
  templateUrl: './activity-map.html',
  styleUrl: './activity-map.scss',
})
export class ActivityMap implements OnDestroy {
  private readonly mapHost = viewChild.required<ElementRef<HTMLElement>>('mapHost');

  readonly route = input.required<TrackPointRoute[]>();

  private readonly points = computed(() =>
    this.route().map((p) => [p.latitude, p.longitude] as [number, number]),
  );

  private map: L.Map | null = null;
  private polyline: L.Polyline | null = null;
  private readonly mapReady = signal(false);

  constructor() {
    afterNextRender(() => {
      const el = this.mapHost().nativeElement;
      this.map = L.map(el, { attributionControl: true }).setView([12.13, -86.25], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(this.map);
      this.mapReady.set(true);
      queueMicrotask(() => {
        this.map?.invalidateSize();
      });
    });

    effect(() => {
      this.mapReady();
      const pts = this.points();
      const map = this.map;
      if (!map) {
        return;
      }
      if (pts.length === 0) {
        if (this.polyline) {
          map.removeLayer(this.polyline);
          this.polyline = null;
        }
        return;
      }
      this.drawRoute(pts, map);
    });
  }

  private drawRoute(points: [number, number][], map: L.Map): void {
    if (this.polyline) {
      map.removeLayer(this.polyline);
    }
    this.polyline = L.polyline(points, {
      color: '#2563eb',
      weight: 4,
    }).addTo(map);
    map.fitBounds(this.polyline.getBounds(), { padding: [24, 24] });
    queueMicrotask(() => map.invalidateSize());
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }
}
