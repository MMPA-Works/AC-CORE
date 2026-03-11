import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Directory } from './directory';

describe('Directory', () => {
  let component: Directory;
  let fixture: ComponentFixture<Directory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Directory],
    }).compileComponents();

    fixture = TestBed.createComponent(Directory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
