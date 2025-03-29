import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date);
}

// Mock fetch function that doesn't actually make network requests
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  console.log('Mock fetch called:', url, options);
  
  // Return a mock Response object
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({ success: true }),
    text: async () => 'Success',
  } as Response;
}
