import { DateTime } from 'luxon';

type ScheduleDay = {
  enabled: boolean;
  start: string | null;
  end: string | null;
};

type OrderingSchedule = {
  days: Record<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun', ScheduleDay>;
};

export type OrderingAvailability = {
  availableNow: boolean;
  nextOpenAt: string | null;
};

const DAY_KEYS: Array<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'> = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
];

function parseTimeToMinutes(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return null;
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

function isScheduleDay(value: unknown): value is ScheduleDay {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const enabled = candidate.enabled;
  const start = candidate.start;
  const end = candidate.end;

  if (typeof enabled !== 'boolean') {
    return false;
  }

  if (start !== null && typeof start !== 'string') {
    return false;
  }

  if (end !== null && typeof end !== 'string') {
    return false;
  }

  if (!enabled) {
    return true;
  }

  const startMinutes = parseTimeToMinutes(start as string | null);
  const endMinutes = parseTimeToMinutes(end as string | null);

  return startMinutes !== null && endMinutes !== null && startMinutes < endMinutes;
}

export function isValidOrderingSchedule(value: unknown): value is OrderingSchedule {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const schedule = value as Record<string, unknown>;
  const days = schedule.days;

  if (!days || typeof days !== 'object') {
    return false;
  }

  const dayMap = days as Record<string, unknown>;

  return DAY_KEYS.every((dayKey) => isScheduleDay(dayMap[dayKey]));
}

export function computeOrderingAvailability(
  nowUtc: Date,
  timezone: string,
  schedule: unknown,
): OrderingAvailability {
  if (!schedule) {
    return {
      availableNow: true,
      nextOpenAt: null,
    };
  }

  if (!isValidOrderingSchedule(schedule)) {
    return {
      availableNow: true,
      nextOpenAt: null,
    };
  }

  const localNow = DateTime.fromJSDate(nowUtc, { zone: 'utc' }).setZone(timezone || 'Europe/Sofia');
  if (!localNow.isValid) {
    return {
      availableNow: true,
      nextOpenAt: null,
    };
  }

  const todayIndex = localNow.weekday - 1;
  const nowMinutes = localNow.hour * 60 + localNow.minute;

  const todaysRule = schedule.days[DAY_KEYS[todayIndex]];
  if (todaysRule.enabled) {
    const startMinutes = parseTimeToMinutes(todaysRule.start);
    const endMinutes = parseTimeToMinutes(todaysRule.end);

    if (startMinutes !== null && endMinutes !== null && nowMinutes >= startMinutes && nowMinutes < endMinutes) {
      return {
        availableNow: true,
        nextOpenAt: null,
      };
    }
  }

  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    const dayIndex = (todayIndex + dayOffset) % 7;
    const dayKey = DAY_KEYS[dayIndex];
    const dayRule = schedule.days[dayKey];

    if (!dayRule.enabled) {
      continue;
    }

    const startMinutes = parseTimeToMinutes(dayRule.start);
    if (startMinutes === null) {
      continue;
    }

    if (dayOffset === 0 && nowMinutes >= startMinutes) {
      continue;
    }

    const openAtLocal = localNow
      .plus({ days: dayOffset })
      .startOf('day')
      .set({ hour: Math.floor(startMinutes / 60), minute: startMinutes % 60, second: 0, millisecond: 0 });

    return {
      availableNow: false,
      nextOpenAt: openAtLocal.toUTC().toISO(),
    };
  }

  return {
    availableNow: false,
    nextOpenAt: null,
  };
}
