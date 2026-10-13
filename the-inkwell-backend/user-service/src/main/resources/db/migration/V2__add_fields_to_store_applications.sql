ALTER TABLE svc_user.store_applications
ADD COLUMN store_name VARCHAR(255),
ADD COLUMN phone VARCHAR(50),
ADD COLUMN address VARCHAR(255),
ADD COLUMN city VARCHAR(100),
ADD COLUMN description TEXT;
