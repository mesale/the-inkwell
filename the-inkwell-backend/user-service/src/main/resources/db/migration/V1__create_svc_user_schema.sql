CREATE SCHEMA IF NOT EXISTS svc_user;

SET search_path TO svc_user;

CREATE TABLE users (
                       id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                       keycloak_id   VARCHAR(255) NOT NULL UNIQUE,
                       name          VARCHAR(255) NOT NULL,
                       email         VARCHAR(255) NOT NULL UNIQUE,
                       phone         VARCHAR(20),
                       created_at    TIMESTAMP NOT NULL DEFAULT now(),
                       updated_at    TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_keycloak_id ON users(keycloak_id);
CREATE INDEX idx_users_email       ON users(email);

CREATE TABLE admins (
                        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        keycloak_id   VARCHAR(255) NOT NULL UNIQUE,
                        name          VARCHAR(255) NOT NULL,
                        email         VARCHAR(255) NOT NULL UNIQUE,
                        created_at    TIMESTAMP NOT NULL DEFAULT now(),
                        updated_at    TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_admins_keycloak_id ON admins(keycloak_id);
CREATE INDEX idx_admins_email       ON admins(email);

CREATE TABLE store_owners (
                              id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                              user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                              store_id   UUID NOT NULL,
                              created_at TIMESTAMP NOT NULL DEFAULT now(),

                              CONSTRAINT uq_store_owner UNIQUE (user_id, store_id)
);

CREATE INDEX idx_store_owners_user_id  ON store_owners(user_id);
CREATE INDEX idx_store_owners_store_id ON store_owners(store_id);

CREATE TABLE employees (
                           id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                           user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                           branch_id  UUID NOT NULL,
                           role       VARCHAR(20) NOT NULL
                               CHECK (role IN ('BRANCH_MANAGER', 'WORKER')),
                           created_at TIMESTAMP NOT NULL DEFAULT now(),

                           CONSTRAINT uq_employee UNIQUE (user_id, branch_id)
);

CREATE INDEX idx_employees_user_id   ON employees(user_id);
CREATE INDEX idx_employees_branch_id ON employees(branch_id);
CREATE INDEX idx_employees_role      ON employees(role);

CREATE TABLE store_applications (
                                    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                    user_id             UUID NOT NULL REFERENCES users(id),
                                    business_email      VARCHAR(255) NOT NULL,
                                    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                                        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
                                    rejection_reason    TEXT,
                                    submitted_at        TIMESTAMP NOT NULL DEFAULT now(),
                                    reviewed_at         TIMESTAMP
);

CREATE INDEX idx_store_applications_user_id ON store_applications(user_id);
CREATE INDEX idx_store_applications_status  ON store_applications(status);

CREATE TABLE store_application_tokens (
                                          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                          user_id UUID NOT NULL REFERENCES users(id),
                                          email VARCHAR(255) NOT NULL,
                                          token UUID NOT NULL UNIQUE,
                                          used BOOLEAN NOT NULL DEFAULT false,
                                          expires_at TIMESTAMP NOT NULL,
                                          created_at TIMESTAMP NOT NULL DEFAULT now()
);