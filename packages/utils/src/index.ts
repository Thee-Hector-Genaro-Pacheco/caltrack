
/**
 * Format a range with units
 */
export function formatRange(min: number, max: number, units: string): string {
  return `${min} - ${max} ${units}`;
}

/**
 * Compares two objects and returns the differences for auditing
 */
export function getObjectDiff(oldObj: any, newObj: any): { oldValue: any; newValue: any } {
  const oldValue: Record<string, any> = {};
  const newValue: Record<string, any> = {};

  if (!oldObj) {
    return { oldValue: null, newValue: newObj };
  }

  // Iterate over all keys in both objects
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  for (const key of allKeys) {
    // Skip system/timestamp keys for diffing
    if (['createdAt', 'updatedAt', 'id'].includes(key)) {
      continue;
    }

    const val1 = oldObj[key];
    const val2 = newObj[key];

    // If different, record the fields
    if (JSON.stringify(val1) !== JSON.stringify(val2)) {
      oldValue[key] = val1 === undefined ? null : val1;
      newValue[key] = val2 === undefined ? null : val2;
    }
  }

  return {
    oldValue: Object.keys(oldValue).length > 0 ? oldValue : null,
    newValue: Object.keys(newValue).length > 0 ? newValue : null,
  };
}

/**
 * Format date to local readable format
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
