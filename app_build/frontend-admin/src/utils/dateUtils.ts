/**
 * Formats a date string or object to DD-MM-YYYY format for display.
 * Handles ISO strings (YYYY-MM-DD), full ISO timestamps, Date objects, 
 * and edge cases like null/undefined.
 * 
 * @param date - The date to format (string or Date)
 * @returns Formatted date string in DD-MM-YYYY format, or '-' if invalid
 */
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '-';

  // Handle YYYY-MM-DD string directly to avoid timezone shifts
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-');
    return `${day}-${month}-${year}`;
  }

  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is invalid
    if (isNaN(d.getTime())) return '-';

    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  } catch (error) {
    return '-';
  }
};
