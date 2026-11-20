export const readableDate = (dateString: string) => {
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

    let daySuffix;
    if (day % 10 === 1 && day !== 11) {
        daySuffix = 'st';
    } else if (day % 10 === 2 && day !== 12) {
        daySuffix = 'nd';
    } else if (day % 10 === 3 && day !== 13) {
        daySuffix = 'rd';
    } else {
        daySuffix = 'th';
    }

    return `${weekday} ${day}${daySuffix} ${month} ${year}`;
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