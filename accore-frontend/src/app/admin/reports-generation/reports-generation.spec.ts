import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportsGeneration } from './reports-generation';

describe('ReportsGeneration', () => {
  let component: ReportsGeneration;
  let fixture: ComponentFixture<ReportsGeneration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportsGeneration]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportsGeneration);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
