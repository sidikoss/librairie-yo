import { getAdminDatabase } from "./_lib/firebaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body;

    // Vérification de la signature webhook paycard
    const WEBHOOK_SECRET = process.env.PAYCARD_WEBHOOK_SECRET;
    const providedSignature = req.headers['x-paycard-signature'];

    if (WEBHOOK_SECRET && providedSignature !== WEBHOOK_SECRET) {
      console.error("Invalid webhook signature.");
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log("Webhook paycard reçu:", payload);

    // Extraction des données (à ajuster selon la spec paycard)
    const orderId = payload.order_id || payload.custom_field;
    const transactionStatus = payload.status;
    const referencePaiement = payload.transaction_id || payload.reference;

    if (!orderId) {
      return res.status(400).json({ error: "Missing order_id" });
    }

    const db = getAdminDatabase();
    const orderRef = db.ref(`orders/${orderId}`);

    const snapshot = await orderRef.once('value');
    const orderData = snapshot.val();

    if (!orderData) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Mise à jour du statut selon le retour de paycard
    if (transactionStatus === "SUCCESS" || transactionStatus === "COMPLETED") {
      await orderRef.update({
        status: "approved",
        referencePaiement: referencePaiement || orderData.referencePaiement,
        updatedAt: Date.now()
      });
      console.log(`Commande ${orderId} approuvée avec succès.`);
    } else if (transactionStatus === "FAILED" || transactionStatus === "CANCELLED") {
      await orderRef.update({
        status: "rejected",
        updatedAt: Date.now()
      });
      console.log(`Commande ${orderId} rejetée (Paiement échoué).`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
