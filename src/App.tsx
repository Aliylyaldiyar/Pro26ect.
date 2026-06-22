import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseReady, supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { TimeTowerDefense } from './components/TimeTowerDefense';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseReady);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        setAuthOpen(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <main className="container">
        <p>Загрузка...</p>
      </main>
    );
  }

  if (!session && authOpen) {
    return (
      <main className="container">
        <header className="header">
          <button className="ghost" onClick={() => setAuthOpen(false)}>
            Назад к игре
          </button>
        </header>
        <Auth onPlayAsGuest={() => setAuthOpen(false)} />
      </main>
    );
  }

  return (
    <main className="container">
      <header className="header">
        {session ? (
          <button className="ghost" onClick={() => supabase?.auth.signOut()}>
            Выйти
          </button>
        ) : (
          <button className="ghost" onClick={() => setAuthOpen(true)}>
            Войти
          </button>
        )}
      </header>

      {session ? (
        <TimeTowerDefense userEmail={session.user.email ?? ''} userId={session.user.id} />
      ) : (
        <TimeTowerDefense userEmail="Гость" />
      )}
    </main>
  );
}
