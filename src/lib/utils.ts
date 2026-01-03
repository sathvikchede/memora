import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isToday, isYesterday, differenceInDays } from 'date-fns';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  if (isToday(date)) {
    return format(date, 'p'); // e.g., 4:30 PM
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  const daysDiff = differenceInDays(new Date(), date);
  if (daysDiff < 7) {
    return format(date, 'EEEE'); // e.g., Tuesday
  }
  return format(date, 'PP'); // e.g., Jan 2, 2023
}
