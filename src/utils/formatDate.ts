export const formatDate = (date: string | Date): string => {
  if (typeof date === "string") {
    date = new Date(date);
  }
  const year = date.getFullYear().toString().slice(-2); // Last 2 digits of the year
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(date.getDate()).padStart(2, "0"); // Day of the month
  const hours = String(date.getHours()).padStart(2, "0"); // Hours in 24-hour format
  const minutes = String(date.getMinutes()).padStart(2, "0"); // Minutes
  const seconds = String(date.getSeconds()).padStart(2, "0"); // Seconds

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export const durationSince = (date: string | Date): string => {
  if (typeof date === "string") {
    date = new Date(date);
  }

  const now = new Date();
  const duration = now.getTime() - date.getTime(); // Difference in milliseconds

  // Convert milliseconds to seconds, minutes, hours, and days
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return `${seconds} seconds`;
  } else if (minutes < 60) {
    return `${minutes} minutes`;
  } else if (hours < 24) {
    return `${hours} hours`;
  } else {
    return `${days} days`;
  }
};
