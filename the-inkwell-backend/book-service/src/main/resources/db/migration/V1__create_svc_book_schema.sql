CREATE SCHEMA IF NOT EXISTS svc_book;

SET search_path TO svc_book;

CREATE TABLE books (
                       id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                       branch_id       UUID NOT NULL,
                       store_id        UUID NOT NULL,
                       created_by      UUID NOT NULL,
                       title           VARCHAR(255) NOT NULL,
                       author          VARCHAR(255) NOT NULL,
                       description     TEXT,
                       category        VARCHAR(100) NOT NULL,
                       price           DECIMAL(10, 2) NOT NULL CHECK (price > 0),
                       condition       VARCHAR(10) NOT NULL
                           CHECK (condition IN ('NEW', 'GOOD', 'FAIR', 'POOR')),
                       approved        BOOLEAN NOT NULL DEFAULT false,
                       created_at      TIMESTAMP NOT NULL DEFAULT now(),
                       updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_books_branch_id  ON books(branch_id);
CREATE INDEX idx_books_store_id   ON books(store_id);
CREATE INDEX idx_books_approved   ON books(approved);
CREATE INDEX idx_books_category   ON books(category);
CREATE INDEX idx_books_created_by ON books(created_by);

CREATE TABLE documents (
                                id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                book_id         UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
                                document_type   VARCHAR(50) NOT NULL
                                    CHECK (document_type IN (
                                                             'BOOK_IMAGE',
                                                             'OTHER'
                                        )),
                                file_name       VARCHAR(255) NOT NULL,
                                content_type    VARCHAR(100),
                                file_size       BIGINT,
                                object_key      VARCHAR(500) NOT NULL,
                                bucket_name     VARCHAR(255) NOT NULL,
                                uploaded_by     UUID,
                                is_primary      BOOLEAN DEFAULT false,
                                created_at      TIMESTAMP NOT NULL DEFAULT now()
);