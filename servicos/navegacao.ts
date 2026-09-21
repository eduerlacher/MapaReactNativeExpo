import { Linking } from 'react-native';
import type { Coordinates, NavigationApp, NavigationService } from '../dominio/interfaces';

// Serviço para abrir rotas em aplicativos de navegação
export class AppNavigationService implements NavigationService {
  // Abre a rota no aplicativo de navegação especificado
  async openRoute(
    app: NavigationApp,
    destination: Coordinates,
    origin?: Coordinates | null,
  ): Promise<void> {
    const url = this.buildUrl(app, destination, origin);
    await Linking.openURL(url);
  }
  // método de construção da URL baseado no app escolhido, destino e origem
  private buildUrl(
    app: NavigationApp,
    destination: Coordinates,
    origin?: Coordinates | null,
  ): string {
    const destinationValue = `${destination.lat},${destination.long}`;
    const originValue = origin ? `${origin.lat},${origin.long}` : null;

    switch (app) {
      case 'google-maps': {
        const originQuery = originValue
          ? `&origin=${encodeURIComponent(originValue)}`
          : '';
        return `https://www.google.com/maps/dir/?api=1${originQuery}&destination=${encodeURIComponent(destinationValue)}`;
      }
      case 'waze':
        return `https://waze.com/ul?ll=${encodeURIComponent(destinationValue)}&navigate=yes`;
      case 'uber':
        if (!origin) {
          throw new Error('LOCATION_REQUIRED_FOR_UBER');
        }

        return `uber://?action=setPickup&pickup[latitude]=${origin.lat}&pickup[longitude]=${origin.long}&dropoff[latitude]=${destination.lat}&dropoff[longitude]=${destination.long}`;
    }
  }
}
