CREATE SCHEMA IF NOT EXISTS svc_payment;

SET search_path TO svc_payment;

CREATE TABLE transactions (
                              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                              order_id UUID NOT NULL,
                              buyer_keycloak_id VARCHAR NOT NULL,
                              store_id UUID NOT NULL,
                              branch_id UUID NOT NULL,
                              amount DECIMAL(10,2) NOT NULL,
                              commission_rate DECIMAL(5,2) NOT NULL,
                              commission_amount DECIMAL(10,2) NOT NULL,
                              net_amount DECIMAL(10,2) NOT NULL,
                              stripe_payment_intent_id VARCHAR(255),
                              status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
                              created_at TIMESTAMP DEFAULT NOW(),
                              updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payouts (
                         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                         transaction_id UUID NOT NULL REFERENCES transactions(id),
                         store_id UUID NOT NULL,
                         amount DECIMAL(10,2) NOT NULL,
                         stripe_transfer_id VARCHAR(255),
                         status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
                         created_at TIMESTAMP DEFAULT NOW()
);