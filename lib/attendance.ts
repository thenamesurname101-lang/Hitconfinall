export const DEFAULT_TIMES = {
  Present: { check_in: '07:30', check_out: '16:30', hours_worked: 8 },
  'Half Day': { check_in: '07:30', check_out: '12:30', hours_worked: 4 },
  Absent: { check_in: '', check_out: '', hours_worked: 0 },
  'Sick Leave': { check_in: '', check_out: '', hours_worked: 0 },
  'Annual Leave': { check_in: '', check_out: '', hours_worked: 0 },
} as const;

export const LUNCH_BREAK_HOURS = 1;
export const STATUS_OPTIONS = ['Present', 'Absent', 'Sick Leave', 'Annual Leave', 'Half Day'] as const;
export type AttendanceStatus = typeof STATUS_OPTIONS[number];

export function statusUsesTime(status: string): boolean {
  return status === 'Present' || status === 'Half Day';
}

export function calcHoursWorked(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const [inH, inM] = checkIn.split(':').map(Number);
  const [outH, outM] = checkOut.split(':').map(Number);
  if (Number.isNaN(inH) || Number.isNaN(outH)) return 0;
  const diffMinutes = (outH * 60 + outM) - (inH * 60 + inM);
  if (diffMinutes <= 0) return 0;
  const grossHours = diffMinutes / 60;
  const netHours = grossHours - LUNCH_BREAK_HOURS;
  return Math.max(0, Math.round(netHours * 100) / 100);
}

export function getDefaultsForStatus(status: string) {
  return DEFAULT_TIMES[status as AttendanceStatus] || DEFAULT_TIMES.Absent;
}
