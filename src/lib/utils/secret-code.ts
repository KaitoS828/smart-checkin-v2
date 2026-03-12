/**
 * Secret Code Generator
 *
 * Format: XXX-XXX-XXX (3 groups of 3 characters)
 * Character set: 23456789ABCDEFGHJKLMNPQRSTUVWXYZ (32 chars, excludes 0/O, 1/I/l)
 * Entropy: 32^9 ≈ 35 trillion combinations
 */

const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const GROUPS = 3;
const GROUP_LENGTH = 3;

/**
 * Generate a random secret code
 * @returns Secret code in format XXX-XXX-XXX
 */
export function generateSecretCode(): string {
  const groups: string[] = [];

  for (let i = 0; i < GROUPS; i++) {
    let group = '';
    for (let j = 0; j < GROUP_LENGTH; j++) {
      const randomIndex = Math.floor(Math.random() * CHARSET.length);
      group += CHARSET[randomIndex];
    }
    groups.push(group);
  }

  return groups.join('-');
}

/**
 * Validate secret code format
 * @param code - The code to validate
 * @returns True if valid format
 */
export function validateSecretCode(code: string): boolean {
  const pattern = new RegExp(`^[${CHARSET}]{3}-[${CHARSET}]{3}-[${CHARSET}]{3}$`);
  return pattern.test(code);
}

/**
 * Normalize secret code (uppercase, remove spaces)
 * @param code - The code to normalize
 * @returns Normalized code
 */
export function normalizeSecretCode(code: string): string {
  return code.toUpperCase().replace(/\s/g, '');
}
