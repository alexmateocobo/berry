import type { EventItem } from '../data';

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export function formatEventDate(event: EventItem): string {
  const start = parseDate(event.start_date);
  const startLabel = start.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

  if (event.end_date && event.end_date !== event.start_date) {
    const end = parseDate(event.end_date);
    const endLabel = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    return `${startLabel} – ${endLabel}`;
  }

  return startLabel;
}

export function formatEventTime(event: EventItem): string | null {
  if (!event.start_time) return null;
  if (event.end_time) return `${event.start_time} – ${event.end_time}`;
  return event.start_time;
}

export function formatPrice(event: EventItem): string {
  if (event.is_free || event.price === 'Free' || event.price === '0') return 'Free';
  if (!event.price) return 'Price TBA';
  if (/^\d+(\.\d+)?$/.test(event.price)) return `€${event.price}`;
  return event.price;
}

export function formatDayLabel(date: Date): { weekday: string; day: string } {
  return {
    weekday: date.toLocaleDateString('en-GB', { weekday: 'short' }),
    day: date.toLocaleDateString('en-GB', { day: 'numeric' }),
  };
}

export function isSameDay(date: Date, isoDate: string): boolean {
  return date.toISOString().slice(0, 10) === isoDate;
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
