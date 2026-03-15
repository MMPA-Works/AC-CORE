import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router, type ActivatedRouteSnapshot } from '@angular/router';
import { filter, map, distinctUntilChanged, startWith } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PageTitleService {
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly appName = 'AC-CORE';

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        startWith(null),
        map(() => this.buildTitle(this.router.routerState.snapshot.root)),
        distinctUntilChanged(),
      )
      .subscribe((pageTitle) => {
        this.title.setTitle(pageTitle);
      });
  }

  private buildTitle(route: ActivatedRouteSnapshot): string {
    const routeTitle = this.findDeepestTitle(route);
    return routeTitle ? `${routeTitle} | ${this.appName}` : this.appName;
  }

  private findDeepestTitle(route: ActivatedRouteSnapshot): string | null {
    let currentRoute: ActivatedRouteSnapshot | null = route;
    let deepestTitle: string | null = null;

    while (currentRoute) {
      const routeTitle = currentRoute.data['title'];

      if (typeof routeTitle === 'string' && routeTitle.trim()) {
        deepestTitle = routeTitle;
      }

      currentRoute = currentRoute.firstChild ?? null;
    }

    return deepestTitle;
  }
}
