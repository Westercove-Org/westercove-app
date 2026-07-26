const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function time12(dt: Date): string {
  const h = dt.getHours();
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const minute = dt.getMinutes().toString().padStart(2, '0');
  const period = h < 12 ? 'AM' : 'PM';
  return `${hour12}:${minute} ${period}`;
}

/** "Thursday, July 16 · 9:41 PM" — the header date/time (matches the screens). */
export function formatHeaderDateTime(dt: Date): string {
  return `${WEEKDAYS[dt.getDay()]}, ${MONTHS[dt.getMonth()]} ${dt.getDate()} · ${time12(dt)}`;
}

/** "Tue 9:12 PM" — the entry-card timestamp (matches the screens). */
export function formatEntryTimestamp(dt: Date): string {
  const wd = WEEKDAYS[dt.getDay()].slice(0, 3);
  return `${wd} ${time12(dt)}`;
}
