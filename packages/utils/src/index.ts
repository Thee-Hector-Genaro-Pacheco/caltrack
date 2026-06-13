
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

/**
 * Get the Output Span of an instrument
 */
export function getOutputSpan(rangeMin: number, rangeMax: number, signalType: string): number {
  if (signalType === '4-20 mA') {
    return 16;
  }
  // For Direct/Digital displays or matching input ranges
  return rangeMax - rangeMin;
}

/**
 * Calculate the target input physical value at a given percentage decimal
 */
export function calculateTargetInput(rangeMin: number, rangeMax: number, percentDecimal: number): number {
  return rangeMin + percentDecimal * (rangeMax - rangeMin);
}

/**
 * Calculate expected electrical/digital output value for given input percentage
 */
export function calculateExpectedOutput(rangeMin: number, rangeMax: number, signalType: string, percentDecimal: number): number {
  if (signalType === '4-20 mA') {
    return 4 + 16 * percentDecimal;
  }
  // Direct/Digital matching input values
  return calculateTargetInput(rangeMin, rangeMax, percentDecimal);
}

/**
 * Calculate error percentage relative to the output span
 */
export function calculateErrorPercent(observedOutput: number, expectedOutput: number, outputSpan: number): number {
  if (outputSpan === 0) return 0;
  return ((observedOutput - expectedOutput) / outputSpan) * 100;
}

