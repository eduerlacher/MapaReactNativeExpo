import { locations } from '../dados/locations';
import type { IHealthService, Location } from '../dominio/interfaces';

export class HealthServiceNockImp implements IHealthService {
  async getLocations(): Promise<Location[]> {
    return locations;
  }
}