-- ============================================================
--  WMS — Warehouse Management System
--  Schema MySQL / MariaDB
--  Tạo ngày: 2026-05-19
--
--  HƯỚNG DẪN SHARED HOSTING (cPanel / phpMyAdmin):
--  1. Vào cPanel → MySQL Databases → tạo DB kos59740_wms
--  2. Gán user kos59740_admin vào DB đó với đủ quyền
--  3. Vào phpMyAdmin → chọn database kos59740_wms (cột trái)
--  4. Tab Import → chọn file này → Go
-- ============================================================

-- Tắt kiểm tra FK trong lúc tạo bảng
SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────────────────────────
--  BẢNG: users
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `users` (
    `id`            VARCHAR(191)  NOT NULL,
    `username`      VARCHAR(50)   NOT NULL,
    `email`         VARCHAR(100)  NOT NULL,
    `password_hash` VARCHAR(255)  NOT NULL,
    `full_name`     VARCHAR(100)  NOT NULL,
    `role`          ENUM('ADMIN','WAREHOUSE_MANAGER','ACCOUNTANT','WAREHOUSE_STAFF','VIEWER') NOT NULL,
    `is_active`     BOOLEAN       NOT NULL DEFAULT TRUE,
    `created_at`    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_username_key` (`username`),
    UNIQUE INDEX `users_email_key`    (`email`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
--  BẢNG: products
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `products` (
    `id`        VARCHAR(191) NOT NULL,
    `code`      VARCHAR(20)  NOT NULL,
    `name`      VARCHAR(200) NOT NULL,
    `unit`      VARCHAR(20)  NOT NULL,
    `category`  VARCHAR(50)  NULL,
    `min_stock` INTEGER      NOT NULL DEFAULT 0,
    `is_active` BOOLEAN      NOT NULL DEFAULT TRUE,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `products_code_key` (`code`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
--  BẢNG: units  (đơn vị tính)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `units` (
    `id`         VARCHAR(191) NOT NULL,
    `code`       VARCHAR(20)  NOT NULL,
    `name`       VARCHAR(50)  NOT NULL,
    `is_active`  BOOLEAN      NOT NULL DEFAULT TRUE,
    `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `units_code_key` (`code`),
    UNIQUE INDEX `units_name_key` (`name`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
--  BẢNG: product_categories  (danh mục hàng)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `product_categories` (
    `id`         VARCHAR(191) NOT NULL,
    `code`       VARCHAR(20)  NOT NULL,
    `name`       VARCHAR(50)  NOT NULL,
    `is_active`  BOOLEAN      NOT NULL DEFAULT TRUE,
    `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `product_categories_code_key` (`code`),
    UNIQUE INDEX `product_categories_name_key` (`name`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
--  BẢNG: inventory_periods  (kỳ tồn kho theo tháng)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `inventory_periods` (
    `id`        VARCHAR(191) NOT NULL,
    `year`      SMALLINT     NOT NULL,
    `month`     SMALLINT     NOT NULL,
    `is_closed` BOOLEAN      NOT NULL DEFAULT FALSE,
    `closed_at` DATETIME(3)  NULL,
    `closed_by` VARCHAR(191) NULL,

    UNIQUE INDEX `inventory_periods_year_month_key` (`year`, `month`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
--  BẢNG: inventory_balance  (số dư tồn kho theo kỳ + hàng)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `inventory_balance` (
    `id`            VARCHAR(191)   NOT NULL,
    `period_id`     VARCHAR(191)   NOT NULL,
    `product_id`    VARCHAR(191)   NOT NULL,
    `opening_qty`   DECIMAL(12,2)  NOT NULL DEFAULT 0,
    `opening_value` DECIMAL(18,2)  NOT NULL DEFAULT 0,
    `closing_qty`   DECIMAL(12,2)  NOT NULL DEFAULT 0,
    `closing_value` DECIMAL(18,2)  NOT NULL DEFAULT 0,

    UNIQUE INDEX `inventory_balance_period_id_product_id_key` (`period_id`, `product_id`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
--  BẢNG: receipts  (phiếu nhập kho)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `receipts` (
    `id`           VARCHAR(191) NOT NULL,
    `receipt_no`   VARCHAR(20)  NOT NULL,          -- PN-2026-001
    `period_id`    VARCHAR(191) NULL,
    `receipt_date` DATE         NOT NULL,
    `supplier`     VARCHAR(200) NULL,
    `note`         TEXT         NULL,
    `status`       ENUM('DRAFT','PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'DRAFT',
    `created_by`   VARCHAR(191) NOT NULL,
    `approved_by`  VARCHAR(191) NULL,
    `approved_at`  DATETIME(3)  NULL,
    `created_at`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `receipts_receipt_no_key` (`receipt_no`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
--  BẢNG: receipt_items  (chi tiết phiếu nhập)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `receipt_items` (
    `id`          VARCHAR(191)  NOT NULL,
    `receipt_id`  VARCHAR(191)  NOT NULL,
    `product_id`  VARCHAR(191)  NOT NULL,
    `quantity`    DECIMAL(12,2) NOT NULL,
    `unit_price`  DECIMAL(18,2) NOT NULL DEFAULT 0,
    `total_value` DECIMAL(18,2) NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
--  BẢNG: issues  (phiếu xuất kho)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `issues` (
    `id`           VARCHAR(191) NOT NULL,
    `issue_no`     VARCHAR(20)  NOT NULL,          -- PX-2026-001
    `period_id`    VARCHAR(191) NULL,
    `issue_date`   DATE         NOT NULL,
    `recipient`    VARCHAR(200) NULL,
    `department`   VARCHAR(100) NULL,
    `note`         TEXT         NULL,
    `status`       ENUM('DRAFT','PENDING','APPROVED','CONFIRMED','REJECTED') NOT NULL DEFAULT 'DRAFT',
    `created_by`   VARCHAR(191) NOT NULL,
    `approved_by`  VARCHAR(191) NULL,
    `confirmed_by` VARCHAR(191) NULL,
    `approved_at`  DATETIME(3)  NULL,
    `confirmed_at` DATETIME(3)  NULL,
    `created_at`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `issues_issue_no_key` (`issue_no`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
--  BẢNG: issue_items  (chi tiết phiếu xuất)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `issue_items` (
    `id`            VARCHAR(191)  NOT NULL,
    `issue_id`      VARCHAR(191)  NOT NULL,
    `product_id`    VARCHAR(191)  NOT NULL,
    `requested_qty` DECIMAL(12,2) NOT NULL,
    `actual_qty`    DECIMAL(12,2) NULL,       -- nhân viên kho điền khi xác nhận
    `unit_price`    DECIMAL(18,2) NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
--  BẢNG: issue_requests  (yêu cầu xuất kho — XK-2026-001)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `issue_requests` (
    `id`            VARCHAR(191) NOT NULL,
    `request_no`    VARCHAR(20)  NOT NULL,         -- XK-2026-001
    `period_id`     VARCHAR(191) NULL,
    `request_date`  DATE         NOT NULL,
    `reason`        TEXT         NULL,
    `note`          TEXT         NULL,
    `status`        ENUM('PENDING_APPROVAL','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING_APPROVAL',
    `requested_by`  VARCHAR(191) NOT NULL,
    `reviewed_by`   VARCHAR(191) NULL,
    `reviewed_at`   DATETIME(3)  NULL,
    `reject_reason` TEXT         NULL,
    `issue_id`      VARCHAR(191) NULL,            -- liên kết với phiếu xuất khi duyệt
    `created_at`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `issue_requests_request_no_key` (`request_no`),
    UNIQUE INDEX `issue_requests_issue_id_key`   (`issue_id`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
--  BẢNG: issue_request_items  (chi tiết yêu cầu xuất)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `issue_request_items` (
    `id`               VARCHAR(191)  NOT NULL,
    `issue_request_id` VARCHAR(191)  NOT NULL,
    `product_id`       VARCHAR(191)  NOT NULL,
    `requested_qty`    DECIMAL(12,2) NOT NULL,
    `note`             VARCHAR(200)  NULL,

    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
--  BẢNG: notifications  (thông báo hệ thống)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `notifications` (
    `id`          VARCHAR(191) NOT NULL,
    `user_id`     VARCHAR(191) NOT NULL,
    `type`        ENUM('ISSUE_REQUEST_NEW','ISSUE_REQUEST_APPROVED','ISSUE_REQUEST_REJECTED') NOT NULL,
    `title`       VARCHAR(200) NOT NULL,
    `message`     TEXT         NOT NULL,
    `is_read`     BOOLEAN      NOT NULL DEFAULT FALSE,
    `entity_id`   VARCHAR(191) NULL,
    `entity_type` VARCHAR(191) NULL,
    `created_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
--  BẢNG: audit_logs  (nhật ký thao tác)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id`          VARCHAR(191) NOT NULL,
    `user_id`     VARCHAR(191) NULL,
    `action`      VARCHAR(50)  NOT NULL,    -- CREATE_RECEIPT, APPROVE_ISSUE, ...
    `entity_type` VARCHAR(50)  NULL,
    `entity_id`   VARCHAR(191) NULL,
    `old_data`    JSON         NULL,
    `new_data`    JSON         NULL,
    `ip_address`  VARCHAR(45)  NULL,
    `created_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- ============================================================
--  FOREIGN KEYS
-- ============================================================

-- inventory_periods → users
ALTER TABLE `inventory_periods`
    ADD CONSTRAINT `inventory_periods_closed_by_fkey`
    FOREIGN KEY (`closed_by`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- inventory_balance → inventory_periods, products
ALTER TABLE `inventory_balance`
    ADD CONSTRAINT `inventory_balance_period_id_fkey`
    FOREIGN KEY (`period_id`) REFERENCES `inventory_periods`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `inventory_balance`
    ADD CONSTRAINT `inventory_balance_product_id_fkey`
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- receipts → inventory_periods, users
ALTER TABLE `receipts`
    ADD CONSTRAINT `receipts_period_id_fkey`
    FOREIGN KEY (`period_id`) REFERENCES `inventory_periods`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `receipts`
    ADD CONSTRAINT `receipts_created_by_fkey`
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `receipts`
    ADD CONSTRAINT `receipts_approved_by_fkey`
    FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- receipt_items → receipts, products
ALTER TABLE `receipt_items`
    ADD CONSTRAINT `receipt_items_receipt_id_fkey`
    FOREIGN KEY (`receipt_id`) REFERENCES `receipts`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `receipt_items`
    ADD CONSTRAINT `receipt_items_product_id_fkey`
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- issues → inventory_periods, users
ALTER TABLE `issues`
    ADD CONSTRAINT `issues_period_id_fkey`
    FOREIGN KEY (`period_id`) REFERENCES `inventory_periods`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `issues`
    ADD CONSTRAINT `issues_created_by_fkey`
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `issues`
    ADD CONSTRAINT `issues_approved_by_fkey`
    FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `issues`
    ADD CONSTRAINT `issues_confirmed_by_fkey`
    FOREIGN KEY (`confirmed_by`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- issue_items → issues, products
ALTER TABLE `issue_items`
    ADD CONSTRAINT `issue_items_issue_id_fkey`
    FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `issue_items`
    ADD CONSTRAINT `issue_items_product_id_fkey`
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- issue_requests → inventory_periods, users, issues
ALTER TABLE `issue_requests`
    ADD CONSTRAINT `issue_requests_period_id_fkey`
    FOREIGN KEY (`period_id`) REFERENCES `inventory_periods`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `issue_requests`
    ADD CONSTRAINT `issue_requests_requested_by_fkey`
    FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `issue_requests`
    ADD CONSTRAINT `issue_requests_reviewed_by_fkey`
    FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `issue_requests`
    ADD CONSTRAINT `issue_requests_issue_id_fkey`
    FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- issue_request_items → issue_requests, products
ALTER TABLE `issue_request_items`
    ADD CONSTRAINT `issue_request_items_issue_request_id_fkey`
    FOREIGN KEY (`issue_request_id`) REFERENCES `issue_requests`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `issue_request_items`
    ADD CONSTRAINT `issue_request_items_product_id_fkey`
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- notifications → users
ALTER TABLE `notifications`
    ADD CONSTRAINT `notifications_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- audit_logs → users
ALTER TABLE `audit_logs`
    ADD CONSTRAINT `audit_logs_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Bật lại kiểm tra FK
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
--  XONG — phpMyAdmin sẽ báo "12 queries executed successfully"
-- ============================================================
