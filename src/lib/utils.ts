import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Round raw hours to the nearest 30-minute increment.
// e.g. 10h 25min (10.417) → 10.5, 10h 46min (10.767) → 11.0
export function roundToNearestHalfHour(hours: number): number {
  return Math.round(hours * 2) / 2;
}
