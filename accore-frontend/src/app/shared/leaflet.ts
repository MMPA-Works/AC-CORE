import * as Leaflet from 'leaflet';

Leaflet.Icon.Default.imagePath = 'https://unpkg.com/leaflet@1.9.4/dist/images/';

let markerClusterLoader: Promise<typeof Leaflet> | null = null;

export const loadLeaflet = (): Promise<typeof Leaflet> => {
  if (!markerClusterLoader) {
    if (typeof window !== 'undefined') {
      (window as Window & typeof globalThis & { L?: typeof Leaflet }).L = Leaflet;
    }

    markerClusterLoader = import('leaflet.markercluster').then(() => Leaflet);
  }

  return markerClusterLoader;
};

export const L = Leaflet;
