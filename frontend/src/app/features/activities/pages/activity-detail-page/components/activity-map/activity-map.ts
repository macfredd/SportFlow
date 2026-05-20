import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  OnDestroy,
  signal,
  viewChild,
  input,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe } from '@ngneat/transloco';
import * as L from 'leaflet';

import type { TrackPointRoute } from '../../../../../../shared/models/activity.model';

export type ActivityMapBase = 'street' | 'satellite';

@Component({
  selector: 'app-activity-map',
  imports: [TranslocoPipe, MatIconModule, MatTooltipModule],
  templateUrl: './activity-map.html',
  styleUrl: './activity-map.scss',
})
export class ActivityMap implements OnDestroy {
  private readonly mapHost = viewChild.required<ElementRef<HTMLElement>>('mapHost');

  readonly route = input.required<TrackPointRoute[]>();
  readonly highlightedPointId = input<string | null>(null);
  /** Bumped on every chart hover tick so the marker moves even when the id is unchanged. */
  readonly highlightSeq = input(0);

  private readonly points = computed(() =>
    this.route().map((p) => [p.latitude, p.longitude] as [number, number]),
  );

  private readonly routeById = computed(() => {
    const map = new Map<string, TrackPointRoute>();
    for (const point of this.route()) {
      map.set(point.id, point);
    }
    return map;
  });

  private map: L.Map | null = null;
  private streetTiles: L.TileLayer | null = null;
  private satelliteTiles: L.TileLayer | null = null;
  readonly activeBase = signal<ActivityMapBase>('street');

  private polyline: L.Polyline | null = null;
  private readonly mapReady = signal(false);

  private startMarker: L.Marker | null = null;
  private endMarker: L.Marker | null = null;
  private hoverMarker: L.Marker | null = null;

  constructor() {
    afterNextRender(() => {
      const el = this.mapHost().nativeElement;
      this.map = L.map(el, { attributionControl: true }).setView([12.13, -86.25], 13);

      this.streetTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      });

      this.satelliteTiles = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution:
            'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and others',
          maxZoom: 19,
        },
      );

      this.streetTiles.addTo(this.map);
      this.activeBase.set('street');

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
        this.removeHoverMarker(map);
        return;
      }
      this.drawRoute(pts, map);
    });

    effect(() => {
      this.mapReady();
      this.highlightSeq();
      const map = this.map;
      if (!map) {
        return;
      }
      this.updateHoverMarker(map, this.highlightedPointId());
    });
  }

  setActiveBase(kind: ActivityMapBase): void {
    const m = this.map;
    const st = this.streetTiles;
    const sat = this.satelliteTiles;
    if (!m || !st || !sat || this.activeBase() === kind) {
      return;
    }
    this.activeBase.set(kind);
    if (kind === 'street') {
      m.removeLayer(sat);
      st.addTo(m);
    } else {
      m.removeLayer(st);
      sat.addTo(m);
    }
    queueMicrotask(() => m.invalidateSize());
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
    this.updateHoverMarker(map, this.highlightedPointId());
    queueMicrotask(() => map.invalidateSize());
  }

  private updateHoverMarker(map: L.Map, pointId: string | null): void {
    if (!pointId) {
      this.removeHoverMarker(map);
      return;
    }

    const point = this.routeById().get(pointId);
    if (!point) {
      this.removeHoverMarker(map);
      return;
    }

    const latLng: L.LatLngExpression = [point.latitude, point.longitude];
    if (!this.hoverMarker) {
      this.hoverMarker = L.marker(latLng, {
        icon: L.divIcon({
          className: 'activity-map-hover-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
          html: '<span class="activity-map-hover-marker__dot"></span>',
        }),
        interactive: false,
        zIndexOffset: 1000,
      });
      this.hoverMarker.addTo(map);
      return;
    }

    this.hoverMarker.setLatLng(latLng);
    if (!map.hasLayer(this.hoverMarker)) {
      this.hoverMarker.addTo(map);
    }
  }

  private removeHoverMarker(map: L.Map): void {
    if (this.hoverMarker) {
      map.removeLayer(this.hoverMarker);
      this.hoverMarker = null;
    }
  }

  ngOnDestroy(): void {
    this.hoverMarker = null;
    this.map?.remove();
    this.map = null;
    this.streetTiles = null;
    this.satelliteTiles = null;
  }
}
