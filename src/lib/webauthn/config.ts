// WebAuthn Relying Party configuration

export const rpName = process.env.NEXT_PUBLIC_RP_NAME || 'Smart Check-in';
export const rpID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
export const origin = process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000';

// Expected values for verification
export const expectedOrigin = origin;
export const expectedRPID = rpID;
