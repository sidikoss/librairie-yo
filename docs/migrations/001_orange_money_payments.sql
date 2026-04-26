-- Migration: Orange Money Payment System
-- Created: 2026-04-25
-- Description: Tables for Orange Money manual payment with anti-duplicate references

-- ============================================
-- Table: orange_money_payments
-- Stockage des paiements Orange Money
-- ============================================
CREATE TABLE IF NOT EXISTS orange_money_payments (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(50) UNIQUE NOT NULL,
    order_id VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    amount INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    -- Status: pending, verified, failed, expired
    customer_name VARCHAR(100),
    promo_code VARCHAR(20),
    pin_hash VARCHAR(64),
    -- Détails transaction
    transaction_id VARCHAR(100),
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Index: Optimisation des requêtes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_om_ref ON orange_money_payments(reference);
CREATE INDEX IF NOT EXISTS idx_om_order ON orange_money_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_om_phone ON orange_money_payments(phone);
CREATE INDEX IF NOT EXISTS idx_om_status ON orange_money_payments(status);
CREATE INDEX IF NOT EXISTS idx_om_created ON orange_money_payments(created_at);

-- ============================================
-- Table: orders (mise à jour)
-- Ajout du mode de paiement
-- ============================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'orange_money';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

-- ============================================
-- Fonction: Nettoyage automatique (TTL 24h)
-- Supprime les références expirées
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_payments()
RETURNS void AS $$
BEGIN
    DELETE FROM orange_money_payments 
    WHERE status = 'pending' 
    AND created_at < NOW() - INTERVAL '24 hours';
    
    -- Supprimer aussi les entrées "failed" plus anciennes
    DELETE FROM orange_money_payments 
    WHERE status = 'failed' 
    AND created_at < NOW() - INTERVAL '48 hours';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Cron job: Exécuter cleanup toutes les heures
-- ============================================
-- NOTE: Dépend de l'extension pg_cron (PostgreSQL)
-- SELECT cron.schedule('cleanup-payments', '0 * * * *', 'SELECT cleanup_expired_payments()');

-- ============================================
-- Vue: Statistiques paiements
-- ============================================
CREATE OR REPLACE VIEW payment_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN status = 'verified' THEN 1 END) as successful,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
    SUM(CASE WHEN status = 'verified' THEN amount ELSE 0 END) as total_amount
FROM orange_money_payments
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ============================================
-- Fonction: Vérifier référence unique
-- ============================================
CREATE OR REPLACE FUNCTION is_reference_available(ref VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    exists_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO exists_count
    FROM orange_money_payments
    WHERE reference = ref 
    AND status IN ('verified', 'pending')
    AND created_at > NOW() - INTERVAL '24 hours';
    
    RETURN exists_count = 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Fonction: Enregistrer paiement
-- ============================================
CREATE OR REPLACE FUNCTION record_payment(
    p_reference VARCHAR,
    p_phone VARCHAR,
    p_amount INTEGER,
    p_customer_name VARCHAR DEFAULT NULL,
    p_promo_code VARCHAR DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    payment_id INTEGER;
BEGIN
    -- Vérifier si référence déjà utilisée
    IF NOT is_reference_available(p_reference) THEN
        RAISE EXCEPTION 'Référence déjà utilisée: %', p_reference;
    END IF;
    
    INSERT INTO orange_money_payments (
        reference, phone, amount, customer_name, promo_code, status
    ) VALUES (
        p_reference, p_phone, p_amount, p_customer_name, p_promo_code, 'pending'
    )
    RETURNING id INTO payment_id;
    
    RETURN payment_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Fonction: Valider paiement
-- ============================================
CREATE OR REPLACE FUNCTION verify_payment(
    p_reference VARCHAR,
    p_order_id VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE orange_money_payments
    SET 
        status = 'verified',
        order_id = p_order_id,
        verified_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE reference = p_reference AND status = 'pending';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Fonction: Marquer paiement échoué
-- ============================================
CREATE OR REPLACE FUNCTION mark_payment_failed(
    p_reference VARCHAR,
    p_reason VARCHAR DEFAULT 'Verification failed'
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE orange_money_payments
    SET 
        status = 'failed',
        updated_at = CURRENT_TIMESTAMP
    WHERE reference = p_reference AND status = 'pending';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Permissions (ajuster selon votre setup)
-- ============================================
-- GRANT SELECT ON payment_stats TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION cleanup_expired_payments() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION is_reference_available(VARCHAR) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION record_payment(...) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION verify_payment(VARCHAR, VARCHAR) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION mark_payment_failed(VARCHAR, VARCHAR) TO PUBLIC;