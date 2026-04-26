export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const db = process.env.FIREBASE_DATABASE_URL || 'https://librairie-yo-default-rtdb.firebaseio.com';
  const { orders } = await fetch(`${db}/orders.json`).then(r => r.json()) || {};
  const list = Object.entries(orders || {}).map(([k, v]) => ({ ...v, id: k }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  res.status(200).json({ data: list, total: list.length });
}