import { formatDistance, formatDuration, format, differenceInMinutes, addMinutes, addHours, isAfter, isBefore } from "date-fns";

export function formatTimeAgo(date: Date): string {
  return formatDistance(date, new Date(), { addSuffix: true });
}

export function formatSleepDuration(startTime: Date, endTime: Date | null): string {
  if (!endTime) {
    // Calculate duration from start time until now for ongoing sleep
    const minutes = differenceInMinutes(new Date(), startTime);
    return formatDuration({
      hours: Math.floor(minutes / 60),
      minutes: minutes % 60
    }, { format: ['hours', 'minutes'] });
  }

  const minutes = differenceInMinutes(endTime, startTime);
  return formatDuration({
    hours: Math.floor(minutes / 60),
    minutes: minutes % 60
  }, { format: ['hours', 'minutes'] });
}

export function formatTime(time: Date): string {
  return format(time, 'h:mm a');
}

export function formatDateTime(date: Date): string {
  return format(date, 'MMM d, yyyy h:mm a');
}

export function formatTimeUntil(targetTime: Date): string {
  const now = new Date();
  
  if (isBefore(targetTime, now)) {
    // If target time is in the past
    return "Overdue";
  }
  
  const minutes = differenceInMinutes(targetTime, now);
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  return `${hours} hour${hours !== 1 ? 's' : ''}, ${remainingMinutes} min`;
}

export function calculateChildAge(birthDate: Date): string {
  const now = new Date();
  const diffMonths = differenceInMonths(now, birthDate);
  
  if (diffMonths < 1) {
    const diffDays = differenceInDays(now, birthDate);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  }
  
  if (diffMonths < 24) {
    return `${diffMonths} month${diffMonths !== 1 ? 's' : ''}`;
  }
  
  const years = Math.floor(diffMonths / 12);
  const months = diffMonths % 12;
  
  if (months === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`;
  }
  
  return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
}

// Helper functions that mimic date-fns functionality
function differenceInMonths(dateLeft: Date, dateRight: Date): number {
  const yearDiff = dateLeft.getFullYear() - dateRight.getFullYear();
  const monthDiff = dateLeft.getMonth() - dateRight.getMonth();
  return yearDiff * 12 + monthDiff;
}

function differenceInDays(dateLeft: Date, dateRight: Date): number {
  return Math.floor((dateLeft.getTime() - dateRight.getTime()) / (1000 * 60 * 60 * 24));
}
