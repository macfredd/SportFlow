import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityHeartRateZonesChart } from './activity-heart-rate-zones-chart';

describe('ActivityHeartRateZonesChart', () => {
  let component: ActivityHeartRateZonesChart;
  let fixture: ComponentFixture<ActivityHeartRateZonesChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityHeartRateZonesChart],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityHeartRateZonesChart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
