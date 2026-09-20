import type { DayName, OpeningHours } from '../dominio/interfaces';

export class AvailabilityService {
  private readonly dayNames: DayName[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];

  getStatus(openingHours: OpeningHours, date = new Date()): string {
    if (openingHours === '24/7') {
      return 'Aberto 24 horas';
    }

    const todayHours = openingHours[this.dayNames[date.getDay()]];
    if (!todayHours) {
      return 'Fechado hoje';
    }

    const currentMinutes = date.getHours() * 60 + date.getMinutes();
    const openingMinutes = this.toMinutes(todayHours.open);
    const closingMinutes = this.toMinutes(todayHours.close);

    if (currentMinutes >= openingMinutes && currentMinutes <= closingMinutes) {
      return `Aberto agora, até ${todayHours.close}`;
    }

    return `Fechado agora, funciona até ${todayHours.close}`;
  }

  private toMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
