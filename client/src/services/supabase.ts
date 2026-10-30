import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://'));
};

// Singleton Supabase Client
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

/**
 * Subscribe to real-time charging point and reservation status updates.
 * Updates UI immediately when another user confirms or cancels a slot.
 */
export function subscribeToRealtimeAvailability(
  onUpdate: (payload: { table: string; eventType: string; newRecord: any; oldRecord: any }) => void
): RealtimeChannel | null {
  if (!supabase) return null;

  const channel = supabase
    .channel('realtime:ev-availability')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'charging_points' },
      (payload) => {
        onUpdate({
          table: 'charging_points',
          eventType: payload.eventType,
          newRecord: payload.new,
          oldRecord: payload.old,
        });
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'reservations' },
      (payload) => {
        onUpdate({
          table: 'reservations',
          eventType: payload.eventType,
          newRecord: payload.new,
          oldRecord: payload.old,
        });
      }
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe and clean up channel
 */
export function unsubscribeChannel(channel: RealtimeChannel | null) {
  if (channel && supabase) {
    supabase.removeChannel(channel);
  }
}

/**
 * Supabase Auth Service Layer
 */
export const supabaseAuth = {
  async register(params: { email: string; password: string; fullName: string; phone?: string }) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          full_name: params.fullName,
          phone: params.phone,
        },
      },
    });
    if (error) throw error;
    return data;
  },

  async login(email: string, pass: string) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) throw error;
    return data;
  },

  async logout() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email: string) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return data;
  },

  async getProfile(userId: string) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) return null;
    return data;
  },
};
