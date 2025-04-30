import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to format date string (YYYY-MM-DD) to a more readable format
import { format, parseISO, isValid } from 'date-fns';

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '';
  try {
    const date = parseISO(dateString); // Handles 'YYYY-MM-DD'
    if (!isValid(date)) return 'Invalid Date';
    return format(date, 'PP'); // e.g., Oct 27, 2023
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return 'Invalid Date';
  }
}

// Helper function to format time string (HH:MM or HH:MM:SS)
export function formatTime(timeString: string | undefined | null): string {
  if (!timeString) return '';
  // Basic check for HH:MM format (can be extended)
  const timeMatch = timeString.match(/^(\d{2}:\d{2})/);
  return timeMatch ? timeMatch[1] : 'Invalid Time';
}

// Helper function to combine date and time formatting
export function formatDateTime(dateString: string | undefined | null, timeString: string | undefined | null): string {
  const formattedDate = formatDate(dateString);
  if (!formattedDate || formattedDate === 'Invalid Date') return formattedDate || ''; // Return only date if invalid or no date

  const formattedTime = formatTime(timeString);
  if (!formattedTime || formattedTime === 'Invalid Time') return formattedDate; // Return only date if no time or invalid time

  return `${formattedDate} ${formattedTime}`; // Combine date and time
}

// Helper function to get initials from a name string
export function getInitials(name: string | undefined | null): string {
  if (!name) return 'U'; // Default to 'U' if name is null, undefined, or empty
  const parts = name.trim().split(' ').filter(Boolean); // Trim whitespace, split, and remove empty parts
  if (parts.length === 0) return 'U'; // Handle cases like " "
  if (parts.length === 1) return parts[0][0].toUpperCase(); // Single name/word
  // First initial of the first part + first initial of the last part
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
