export interface ReadableDateParts {
    weekday: string;
    day: number;
    suffix: string;
    month: string;
    year: number;
}

export const readableDateParts = (dateString: string): ReadableDateParts => {
    const date = new Date(dateString);

    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const weekday = weekdays[date.getUTCDay()];
    const day = date.getUTCDate();
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();

    let suffix;
    if (day % 10 === 1 && day !== 11) {
        suffix = 'st';
    } else if (day % 10 === 2 && day !== 12) {
        suffix = 'nd';
    } else if (day % 10 === 3 && day !== 13) {
        suffix = 'rd';
    } else {
        suffix = 'th';
    }

    return { weekday, day, suffix, month, year };
}

export const readableDate = (dateString: string) => {
    const { weekday, day, suffix, month, year } = readableDateParts(dateString);
    return `${weekday} ${day}${suffix} ${month} ${year}`;
}

export const readableTime = (numOfMinutes: number) => {
    const hours = String(Math.floor(numOfMinutes / 60)).padStart(2, "0");
    const minutes = String(numOfMinutes % 60).padStart(2, "0");
    return `${hours}:${minutes}`;
}

// All date maths uses UTC so a local-timezone DST shift can't skip or repeat a day.
export const addDays = (dateString: string, days: number): string => {
    const date = new Date(`${dateString}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().substring(0, 10);
}

export const daysBetween = (startDate: string, endDate: string): number => {
    const start = new Date(`${startDate}T00:00:00Z`).getTime();
    const end = new Date(`${endDate}T00:00:00Z`).getTime();
    return Math.round((end - start) / 86400000);
}

export const listDates = (startDate: string, endDate: string): string[] => {
    const dates: string[] = [];
    for (let d = startDate; d <= endDate; d = addDays(d, 1)) {
        dates.push(d);
    }
    return dates;
}

export interface DateWindow {
    start: string;
    end: string;
}

// Grow the window by chunkDays in the given direction; once it would exceed
// maxDays, trim the same amount off the opposite end so it slides instead.
export const extendDateWindow = (
    window: DateWindow,
    direction: 'past' | 'future',
    chunkDays: number,
    maxDays: number,
): DateWindow => {
    let { start, end } = window;
    if (direction === 'past') {
        start = addDays(start, -chunkDays);
    } else {
        end = addDays(end, chunkDays);
    }
    if (daysBetween(start, end) + 1 > maxDays) {
        if (direction === 'past') {
            end = addDays(end, -chunkDays);
        } else {
            start = addDays(start, chunkDays);
        }
    }
    return { start, end };
}