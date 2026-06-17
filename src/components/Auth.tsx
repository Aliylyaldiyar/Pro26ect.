import { useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../lib/supabase';

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

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
      } else if (mode === 'signup') {
        setMessage('Готово! Проверь почту, если Supabase попросит подтвердить аккаунт.');
      }
    } catch {
      setMessage('Что-то пошло не так. Попробуй ещё раз.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card auth-card">
      <span className="broken-clock auth-clock" aria-hidden="true" />
      <span className="time-shard auth-shard-a" aria-hidden="true" />
      <span className="time-shard auth-shard-b" aria-hidden="true" />
      <h2>{mode === 'signin' ? 'Вход в игру' : 'Создать аккаунт'}</h2>
      <form onSubmit={handleSubmit} className="form">
        <input
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="пароль, минимум 6 символов"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        <button type="submit" disabled={busy}>
          {busy ? 'Подождите...' : mode === 'signin' ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </form>
      {message && <p className="message">{message}</p>}
      <button className="ghost auth-switch" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        {mode === 'signin' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
      </button>
    </section>
  );
}
