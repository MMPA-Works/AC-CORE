import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HazardList } from './hazard-list';

describe('HazardList', () => {
  let component: HazardList;
  let fixture: ComponentFixture<HazardList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HazardList],
    }).compileComponents();

    fixture = TestBed.createComponent(HazardList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
