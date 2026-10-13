CREATE SCHEMA IF NOT EXISTS svc_store;

SET search_path TO svc_store;

CREATE TABLE stores (
                        id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        store_name              VARCHAR(255) NOT NULL,
                        business_reg_number     VARCHAR(255) NOT NULL UNIQUE,
                        tin                     VARCHAR(255) NOT NULL UNIQUE,
                        bank_name               VARCHAR(255),
                        bank_account            VARCHAR(255),
                        region                  VARCHAR(255) NOT NULL,
                        city                    VARCHAR(255) NOT NULL,
                        address                 TEXT NOT NULL,
                        email                   VARCHAR(255) NOT NULL UNIQUE,
                        phone                   VARCHAR(20),
                        stripe_account_id       VARCHAR(255),
                        onboarding_completed BOOLEAN NOT NULL DEFAULT false,
                        plan                    VARCHAR(10) NOT NULL DEFAULT 'FREE'
                            CHECK (plan IN ('FREE', 'PREMIUM')),
                        verification_status     VARCHAR(10) NOT NULL DEFAULT 'PENDING'
                            CHECK (verification_status IN ('PENDING', 'AWAITING_DOCS', 'DOCS_SUBMITTED','APPROVED', 'REJECTED')),
                        rejection_reason        TEXT,
                        created_at              TIMESTAMP NOT NULL DEFAULT now(),
                        updated_at              TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_stores_verification_status ON stores(verification_status);
CREATE INDEX idx_stores_email ON stores(email);


CREATE TABLE branches (
                          id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                          store_id        UUID NOT NULL REFERENCES stores(id),
                          branch_name     VARCHAR(255) NOT NULL,
                          region          VARCHAR(255) NOT NULL,
                          city            VARCHAR(255) NOT NULL,
                          address         TEXT NOT NULL,
                          phone           VARCHAR(20),
                          created_at      TIMESTAMP NOT NULL DEFAULT now(),
                          updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_branches_store_id ON branches(store_id);

CREATE TABLE documents (
                           id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                           store_id        UUID REFERENCES stores(id) ON DELETE CASCADE,
                           document_type   VARCHAR(50) NOT NULL
                               CHECK (document_type IN (
                                                        'BUSINESS_LICENSE',
                                                        'OWNER_ID',
                                                        'OTHER'
                                   )),
                           file_name       VARCHAR(255) NOT NULL,
                           content_type    VARCHAR(100),
                           file_size       BIGINT,

                           object_key      VARCHAR(500) NOT NULL,
                           bucket_name     VARCHAR(255) NOT NULL,
                           uploaded_by     UUID,
                           created_at      TIMESTAMP NOT NULL DEFAULT now(),

                           CONSTRAINT fk_document_store
                               FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE INDEX idx_documents_store_id ON documents(store_id);
CREATE INDEX idx_documents_type ON documents(document_type);

CREATE UNIQUE INDEX uq_store_document_type
    ON documents(store_id, document_type);
