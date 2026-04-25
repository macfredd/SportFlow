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

  private startMarker: L.Marker | null = null;
  private endMarker: L.Marker | null = null;

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
        this.clearMarkers(map);
        return;
      }
      this.drawRoute(pts, map);
    });
  }

  private clearMarkers(map: L.Map): void {
    if (this.startMarker) {
      map.removeLayer(this.startMarker);
      this.startMarker = null;
    }
    if (this.endMarker) {
      map.removeLayer(this.endMarker);
      this.endMarker = null;
    }
  }

  private drawRoute(points: [number, number][], map: L.Map): void {
    if (this.polyline) {
      map.removeLayer(this.polyline);
    }
    this.clearMarkers(map);

    this.startMarker = L.marker([points[0][0], points[0][1]], {
      icon: L.icon({
        /** Ruta absoluta desde el origen para que cargue en rutas anidadas (p. ej. /activities/:id). */
        iconUrl: '/assets/icons/map/map-marker-start.svg',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      }),
    }).addTo(map);

    this.endMarker = L.marker([points[points.length - 1][0], points[points.length - 1][1]], {
      icon: L.icon({
        iconUrl: '/assets/icons/map/map-marker-finish.svg',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      }),
    }).addTo(map);

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
