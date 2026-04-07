// Firebase Realtime Database — REST API (без SDK, просто fetch)
const FB_URL = 'https://personal-german-coach-default-rtdb.europe-west1.firebasedatabase.app';

// Токен аутентификации — устанавливается после логина учителя
let _fbToken = null;

// Восстановить токен из localStorage (если не истёк)
function fbRestoreAuth() {
  const token = localStorage.getItem('pgc_fb_token');
  const exp   = parseInt(localStorage.getItem('pgc_fb_token_exp') || '0');
  if (token && Date.now() < exp) { _fbToken = token; return true; }
  _fbToken = null;
  return false;
}

// Firebase Web API Key — публичный, безопасность обеспечивают Security Rules
const FB_API_KEY = 'AIzaSyAPb_8FZzgE9gmSa91pD_AwQQwRJsbvhTQ';

// Войти как учитель (email + password)
async function fbSignIn(email, password) {
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FB_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true })
      }
    );
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error?.message || 'Ошибка входа' };
    _fbToken = data.idToken;
    localStorage.setItem('pgc_fb_token',     data.idToken);
    localStorage.setItem('pgc_fb_token_exp', Date.now() + 55 * 60 * 1000); // 55 минут
    return { ok: true };
  } catch(e) { return { ok: false, error: e.message }; }
}

function fbIsAuthed() { return !!_fbToken; }
function fbSignOut()  { _fbToken = null; localStorage.removeItem('pgc_fb_token'); localStorage.removeItem('pgc_fb_token_exp'); }

// Читать данные (открыто — студенты читают задания)
async function fbGet(path) {
  try {
    const res = await fetch(`${FB_URL}/${path}.json`);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// Записать данные (требует токен — только учитель)
async function fbSet(path, data) {
  const authSuffix = _fbToken ? `?auth=${_fbToken}` : '';
  try {
    const res = await fetch(`${FB_URL}/${path}.json${authSuffix}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch { return false; }
}

// Записать данные студента (без авторизации — студент сдаёт задание)
async function fbSetPublic(path, data) {
  try {
    const res = await fetch(`${FB_URL}/${path}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch { return false; }
}
