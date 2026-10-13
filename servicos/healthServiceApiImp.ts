import type {
  DayName,
  IHealthService,
  Location,
  OpeningHours,
} from '../dominio/interfaces';

const dayNames: DayName[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOpeningHours(value: unknown): value is OpeningHours {
  if (value === '24/7') {
    return true;
  }

  if (!isRecord(value)) {
    return false;
  }

  return dayNames.every(day => {
    const hours = value[day];
    return hours === null || (
      isRecord(hours) &&
      (typeof hours.open === 'string' || hours.open === null) &&
      (typeof hours.close === 'string' || hours.close === null)
    );
  });
}

function isLocation(value: unknown): value is Location {
  if (!isRecord(value)) {
    return false;
  }

  const address = value.address;
  if (!isRecord(address)) {
    return false;
  }

  const addressFields = [
    'street',
    'number',
    'neighborhood',
    'city',
    'state',
    'zipCode',
  ];

  return (
    typeof value.id === 'string' &&
    typeof value.lat === 'number' &&
    typeof value.long === 'number' &&
    typeof value.title === 'string' &&
    typeof value.phone === 'string' &&
    addressFields.every(field => typeof address[field] === 'string') &&
    isOpeningHours(value.openingHours)
  );
}

async function fetchLocations(apiUrl: string, endpoint: string): Promise<Location[]> {
  const response = await fetch(`${apiUrl.replace(/\/+$/, '')}${endpoint}`);

  if (!response.ok) {
    throw new Error(`A API retornou HTTP ${response.status} em ${endpoint}.`);
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload) || !payload.every(isLocation)) {
    throw new Error(`A resposta da API em ${endpoint} tem formato inválido.`);
  }

  return payload;
}

export class HealthServiceApiImp implements IHealthService {
  async getLocations(): Promise<Location[]> {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    if (!apiUrl) {
      throw new Error('A variável EXPO_PUBLIC_API_URL não está configurada.');
    }

    const [upas, ubss] = await Promise.all([
      fetchLocations(apiUrl, '/upas'),
      fetchLocations(apiUrl, '/ubss'),
    ]);

    return [...upas, ...ubss];
  }
}