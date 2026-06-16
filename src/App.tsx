import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseReady, supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { TimeTowerDefense } from './components/TimeTowerDefense';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseReady);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
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

  if (!isSupabaseReady) {
    return (
      <main className="container">
        <header className="header">
          <h1>Chrono Defense</h1>
        </header>
        <TimeTowerDefense userEmail="Гость" />
      </main>
    );
  }

  return (
    <main className="container">
      <header className="header">
        <h1>Chrono Defense</h1>
        {session && (
          <button className="ghost" onClick={() => supabase?.auth.signOut()}>
            Выйти
          </button>
        )}
      </header>

      {!session ? <Auth /> : <TimeTowerDefense userEmail={session.user.email ?? ''} />}
    </main>
  );
}
