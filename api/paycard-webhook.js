import { getAdminDatabase } from "./_lib/firebaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body;
    
    // Logique de sécurité PayCard : Vérification de la signature
    const WEBHOOK_SECRET = process.env.PAYCARD_WEBHOOK_SECRET;
    const providedSignature = req.headers['x-paycard-signature'];

    if (WEBHOOK_SECRET && providedSignature !== WEBHOOK_SECRET) {
      console.error("Signature webhook invalide.");
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log("Webhook PayCard reçu:", payload);

    // Extraction des données de la transaction
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
      // Si la commande n'existe pas encore (créée par le frontend après retour), 
      // on ne peut pas la mettre à jour ici. C'est normal avec le nouveau flux.
      console.log(`Commande ${orderId} non trouvée dans Firebase. Le frontend la créera.`);
      return res.status(200).json({ received: true, note: "Order not yet created" });
    }

    // Mise à jour du statut selon le retour de PayCard
    if (transactionStatus === "SUCCESS" || transactionStatus === "COMPLETED") {
      await orderRef.update({
        status: "approved",
        referencePaiement: referencePaiement || orderData.referencePaiement,
        updatedAt: Date.now()
      });
      console.log(`Commande ${orderId} approuvée avec succès via webhook.`);
    } else if (transactionStatus === "FAILED" || transactionStatus === "CANCELLED") {
      await orderRef.update({
        status: "rejected",
        updatedAt: Date.now()
      });
      console.log(`Commande ${orderId} rejetée via webhook.`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Erreur de traitement webhook:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
