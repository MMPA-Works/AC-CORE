import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalyticsDashboard } from './analytics-dashboard';

describe('AnalyticsDashboard', () => {
  let component: AnalyticsDashboard;
  let fixture: ComponentFixture<AnalyticsDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalyticsDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalyticsDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
