import admin from "firebase-admin";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountStr) {
      throw new Error("Missing FIREBASE_SERVICE_ACCOUNT");
    }
    const serviceAccount = JSON.parse(serviceAccountStr);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || "https://librairie-yo-default-rtdb.firebaseio.com"
    });
  } catch (error) {
    console.error("Firebase admin init error in webhook:", error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body;
    
    // (A AJUSTER) Logique de sécurité PayCard : 
    // Vérification de la signature ou d'un token secret envoyé dans les headers
    const WEBHOOK_SECRET = process.env.PAYCARD_WEBHOOK_SECRET;
    const providedSignature = req.headers['x-paycard-signature']; // Nom du header à adapter

    if (WEBHOOK_SECRET && providedSignature !== WEBHOOK_SECRET) {
      console.error("Invalid webhook signature.");
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log("Webhook PayCard reçu:", payload);

    // Extraction des données de la transaction (A AJUSTER selon la spec PayCard)
    const orderId = payload.order_id || payload.custom_field;
    const transactionStatus = payload.status; // ex: "SUCCESS", "FAILED"
    const referencePaiement = payload.transaction_id || payload.reference;

    if (!orderId) {
      return res.status(400).json({ error: "Missing order_id" });
    }

    const db = admin.database();
    const orderRef = db.ref(`orders/${orderId}`);

    const snapshot = await orderRef.once('value');
    const orderData = snapshot.val();

    if (!orderData) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Mise à jour du statut selon le retour de PayCard
    if (transactionStatus === "SUCCESS" || transactionStatus === "COMPLETED") {
      await orderRef.update({
        status: "approved",
        referencePaiement: referencePaiement || orderData.referencePaiement,
        updatedAt: admin.database.ServerValue.TIMESTAMP
      });
      console.log(`Commande ${orderId} approuvée avec succès.`);
    } else if (transactionStatus === "FAILED" || transactionStatus === "CANCELLED") {
      await orderRef.update({
        status: "rejected",
        updatedAt: admin.database.ServerValue.TIMESTAMP
      });
      console.log(`Commande ${orderId} rejetée (Paiement échoué).`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
