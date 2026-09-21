// Interfaces do projeto

// Interface para coordenadas geográficas
export interface Coordinates {
  lat: number;
  long: number;
}

// Interface de abertura/fechamento
export interface OpeningHoursDay {
  open: string;
  close: string;
}

// Interface para abertura 24/7
export type OpeningHours = '24/7' | Record<DayName, OpeningHoursDay | null>;

// Tipos de dias da semana
export type DayName =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

// Interface para endereço de uma localização
export interface LocationAddress {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

// Interface extendida para uma localização
export interface Location extends Coordinates {
  id: string;
  title: string;
  phone: string;
  address: LocationAddress;
  openingHours: OpeningHours;
}

// Tipos de aplicativos de navegação suportados
export type NavigationApp = 'google-maps' | 'waze' | 'uber';

// Interface para o serviço de navegação
export interface NavigationService {
  openRoute(
    app: NavigationApp,
    destination: Coordinates,
    origin?: Coordinates | null,
  ): Promise<void>;
}
