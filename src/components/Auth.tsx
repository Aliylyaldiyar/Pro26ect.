import { useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../lib/supabase';

type AuthProps = {
  onPlayAsGuest?: () => void;
};

export function Auth({ onPlayAsGuest }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const isSignup = mode === 'signup';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setMessage('Supabase не настроен. Сейчас игра доступна в режиме гостя.');
      return;
    }

    setBusy(true);
    setMessage('');

    try {
      const authRequest =
        mode === 'signup'
          ? supabase.auth.signUp({ email, password })
          : supabase.auth.signInWithPassword({ email, password });

      const { error } = await authRequest;
      if (error) {
        setMessage(error.message);
      } else if (isSignup) {
        setMessage('Готово! Проверь почту, если Supabase попросит подтвердить аккаунт.');
      }
    } catch {
      setMessage('Что-то пошло не так. Попробуй ещё раз.');
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleSignIn() {
    if (!supabase) {
      setMessage('Supabase не настроен. Сейчас игра доступна в режиме гостя.');
      return;
    }

    setBusy(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setMessage(error.message);
      setBusy(false);
    }
  }

  return (
    <section className="card auth-card">
      <span className="broken-clock auth-clock" aria-hidden="true" />
      <span className="time-shard auth-shard-a" aria-hidden="true" />
      <span className="time-shard auth-shard-b" aria-hidden="true" />
      <h2>{isSignup ? 'Регистрация' : 'Вход в игру'}</h2>
      <p className="auth-subtitle">
        {isSignup ? 'Создай аккаунт через почту и пароль.' : 'Войди, чтобы сохранить прогресс.'}
      </p>
      <form onSubmit={handleSubmit} className="form">
        <input
          type="email"
          placeholder="Почта"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Пароль, минимум 6 символов"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        <button type="submit" disabled={busy}>
          {busy ? 'Подождите...' : isSignup ? 'Зарегистрироваться' : 'Войти'}
        </button>
      </form>
      <div className="auth-divider">
        <span>или</span>
      </div>
      <button className="google-auth" type="button" onClick={handleGoogleSignIn} disabled={busy}>
        <span aria-hidden="true">G</span>
        Войти через Google
      </button>
      {message && <p className="message">{message}</p>}
      {onPlayAsGuest && (
        <button className="ghost auth-switch" type="button" onClick={onPlayAsGuest}>
          Играть гостем
        </button>
      )}
      <button
        className="ghost auth-switch"
        type="button"
        onClick={() => {
          setMode(isSignup ? 'signin' : 'signup');
          setMessage('');
        }}
      >
        {isSignup ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
      </button>
    </section>
  );
}
