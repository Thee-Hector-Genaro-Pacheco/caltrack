import { createHash } from 'crypto';

export function generateSignatureHash(
  calibrationRecordId: string,
  signerName: string,
  signerRole: string,
  timestamp: Date | string,
  status: string
): string {
  const ts = typeof timestamp === 'string' ? timestamp : timestamp.toISOString();
  const input = `${calibrationRecordId}:${signerName}:${signerRole}:${ts}:${status}`;
  return createHash('sha256').update(input).digest('hex');
}
