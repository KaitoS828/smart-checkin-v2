import { createClient } from '@/lib/supabase/server';

/**
 * Save a WebAuthn challenge to the database
 * @param challenge - The challenge string to save
 * @returns The challenge ID
 */
export async function saveChallenge(challenge: string): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('challenges')
    .insert({ challenge })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to save challenge: ${error.message}`);
  }

  return data.id;
}

/**
 * Retrieve a challenge from the database if not expired
 * @param id - The challenge ID
 * @returns The challenge string or null if expired/not found
 */
export async function getChallenge(id: string): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('challenges')
    .select('challenge')
    .eq('id', id)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    return null;
  }

  return data.challenge;
}

/**
 * Delete a challenge from the database
 * @param id - The challenge ID to delete
 */
export async function deleteChallenge(id: string): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('challenges')
    .delete()
    .eq('id', id);
}

/**
 * Clean up expired challenges (call periodically via cron job)
 */
export async function cleanupExpiredChallenges(): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('challenges')
    .delete()
    .lt('expires_at', new Date().toISOString());
}
