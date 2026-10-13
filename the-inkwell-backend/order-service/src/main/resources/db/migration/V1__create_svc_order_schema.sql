CREATE SCHEMA IF NOT EXISTS svc_order;

SET search_path TO svc_order;

CREATE TABLE orders (
                        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        buyer_keycloak_id   VARCHAR(255) NOT NULL,
                        branch_id           UUID NOT NULL,
                        store_id            UUID NOT NULL,
                        total_price         DECIMAL(10, 2) NOT NULL CHECK (total_price > 0),
                        status              VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                            CHECK (status IN (
                                              'PENDING',
                                              'PAID',
                                              'SHIPPED',
                                              'DELIVERED',
                                              'CANCELLED'
                                )),
                        payment_status      VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                            CHECK (payment_status IN (
                                                      'PENDING',
                                                      'COMPLETED',
                                                      'FAILED',
                                                      'REFUNDED'
                                )),
                        shipping_address    TEXT NOT NULL,
                        delivery_pin        VARCHAR(6),
                        delivery_pin_used   BOOLEAN NOT NULL DEFAULT false,
                        delivery_pin_expiry TIMESTAMP,
                        stripe_payment_id   VARCHAR(255),
                        stripe_account_id   VARCHAR(255),
                        created_at          TIMESTAMP NOT NULL DEFAULT now(),
                        updated_at          TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_buyer_keycloak_id ON orders(buyer_keycloak_id);
CREATE INDEX idx_orders_branch_id         ON orders(branch_id);
CREATE INDEX idx_orders_store_id          ON orders(store_id);
CREATE INDEX idx_orders_status            ON orders(status);
CREATE INDEX idx_orders_payment_status    ON orders(payment_status);

CREATE TABLE order_items (
                             id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                             order_id    UUID NOT NULL REFERENCES orders(id),
                             book_id     UUID NOT NULL,
                             quantity    INT NOT NULL CHECK (quantity > 0),
                             price       DECIMAL(10, 2) NOT NULL CHECK (price > 0),
                             created_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_book_id  ON order_items(book_id);