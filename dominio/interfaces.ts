export interface Coordinates {
  lat: number;
  long: number;
}

export interface OpeningHoursDay {
  open: string;
  close: string;
}

export type OpeningHours = '24/7' | Record<DayName, OpeningHoursDay | null>;

export type DayName =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface LocationAddress {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Location extends Coordinates {
  id: string;
  title: string;
  phone: string;
  address: LocationAddress;
  openingHours: OpeningHours;
}

export type NavigationApp = 'google-maps' | 'waze' | 'uber';

export interface NavigationService {
  openRoute(
    app: NavigationApp,
    destination: Coordinates,
    origin?: Coordinates | null,
  ): Promise<void>;
}
