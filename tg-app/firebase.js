// Firebase Realtime Database — REST API (без SDK, просто fetch)
const FB_URL = 'https://personal-german-coach-default-rtdb.europe-west1.firebasedatabase.app';

async function fbGet(path) {
  try {
    const res = await fetch(`${FB_URL}/${path}.json`);
    if (!res.ok) return null;
    return await res.json(); // null если нет данных
  } catch { return null; }
}

async function fbSet(path, data) {
  try {
    const res = await fetch(`${FB_URL}/${path}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch { return false; }
}
