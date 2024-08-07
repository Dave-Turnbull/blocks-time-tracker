export const readableDate = (dateString: string) => {
    const date = new Date(dateString);

    // Array of weekdays
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // Array of month names
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const weekday = weekdays[date.getUTCDay()];
    const day = date.getUTCDate();
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();

    // Adding suffix to day
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

export const readableTime = (numOfMinutes) => {
    const hours = String(Math.floor(numOfMinutes / 60)).padStart(2, "0");
    const minutes = String(numOfMinutes % 60).padStart(2, "0");
    return `${hours}:${minutes}`;
}