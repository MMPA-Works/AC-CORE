import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HazardDetails } from './hazard-details';

describe('HazardDetails', () => {
  let component: HazardDetails;
  let fixture: ComponentFixture<HazardDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HazardDetails],
    }).compileComponents();

    fixture = TestBed.createComponent(HazardDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
