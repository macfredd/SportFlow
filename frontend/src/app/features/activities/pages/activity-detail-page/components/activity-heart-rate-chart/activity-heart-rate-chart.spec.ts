import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityHeartRateChart } from './activity-heart-rate-chart';

describe('ActivityHeartRateChart', () => {
  let component: ActivityHeartRateChart;
  let fixture: ComponentFixture<ActivityHeartRateChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityHeartRateChart],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityHeartRateChart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
