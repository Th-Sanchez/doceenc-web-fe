const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);

export const shortDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

export function monthName(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" }).format(utc(iso));
}

export function weekdayAndDate(iso: string): string {
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "UTC" }).format(utc(iso));
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}