// Interfaces do projeto

// Interface para coordenadas geográficas
export interface Coordinates {
  lat: number;
  long: number;
}

// Horários de um dia; valores nulos indicam que aquele horário não foi informado.
export interface OpeningHoursDay {
  open: string | null;
  close: string | null;
}

// A API retorna "24/7" para unidades com atendimento contínuo. Para as demais,
// retorna os horários por dia da semana; o dia ou seus horários podem ser nulos.
export type OpeningHours = '24/7' | Record<DayName, OpeningHoursDay | null>;

// Os nomes seguem as chaves em inglês usadas no objeto openingHours da API.
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

// Contrato para obter as unidades de saúde, independentemente da fonte dos dados.
export interface IHealthService {
  getLocations(): Promise<Location[]>;
}
