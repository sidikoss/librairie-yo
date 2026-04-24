import { getAdminDatabase } from "./_lib/firebaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Code manquant' });
    }

    const db = getAdminDatabase();
    const promosRef = db.ref('promoCodes');
    const snapshot = await promosRef.orderByChild('code').equalTo(code.toUpperCase()).once('value');
    
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Code invalide' });
    }

    const promos = snapshot.val();
    const promoKey = Object.keys(promos)[0];
    const promo = promos[promoKey];

    if (!promo.active) {
      return res.status(400).json({ error: 'Code inactif' });
    }

    if (promo.uses >= promo.maxUses) {
      return res.status(400).json({ error: 'Code expiré (limite d\'utilisations atteinte)' });
    }

    return res.status(200).json({
      valid: true,
      discount: promo.discount,
      type: promo.type || "percent"
    });

  } catch (error) {
    console.error("Erreur validation promo:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
