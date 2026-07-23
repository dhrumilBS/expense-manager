-- ============================================================
-- Personal Expense Manager - Database Schema (MySQL 5.7+/8.0)
-- ============================================================
-- Import this file in phpMyAdmin (local XAMPP/Laragon or your
-- free hosting control panel) before using the API.
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- Users (multi-user ready, auth handled by backend with JWT)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  theme ENUM('light','dark') NOT NULL DEFAULT 'light',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Expense Groups (Personal, Household, Business, Trip, ...)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expense_groups (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50) DEFAULT 'Folder',
  color VARCHAR(20) DEFAULT '#0B8457',
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_group_per_user (user_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Accounts (Cash, Bank, Credit Card, Wallet, UPI, Other)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  type ENUM('cash','bank','credit_card','wallet','upi','other') NOT NULL DEFAULT 'cash',
  opening_balance DECIMAL(14,2) NOT NULL DEFAULT 0,
  current_balance DECIMAL(14,2) NOT NULL DEFAULT 0,
  color VARCHAR(20) DEFAULT '#3B5BA9',
  is_archived TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_archived (user_id, is_archived)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Categories (expense + income), unlimited & user-scoped
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  type ENUM('income','expense') NOT NULL,
  icon VARCHAR(50) DEFAULT 'Circle',
  color VARCHAR(20) DEFAULT '#6B7280',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_category_per_user (user_id, name, type),
  INDEX idx_user_type (user_id, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Transactions (income / expense / transfer)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  type ENUM('income','expense','transfer') NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  expense_group_id INT UNSIGNED NULL,
  category_id INT UNSIGNED NULL,
  account_id INT UNSIGNED NULL,          -- source account (all types) / expense-income account
  to_account_id INT UNSIGNED NULL,       -- destination account (transfer only)
  payment_method VARCHAR(60) NULL,
  txn_date DATETIME NOT NULL,
  description VARCHAR(255) NULL,
  notes TEXT NULL,
  receipt_path VARCHAR(255) NULL,
  tags VARCHAR(255) NULL,                -- comma-separated tags
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (expense_group_id) REFERENCES expense_groups(id) ON DELETE SET NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
  FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE SET NULL,
  INDEX idx_user_date (user_id, txn_date),
  INDEX idx_user_type (user_id, type),
  INDEX idx_user_category (user_id, category_id),
  INDEX idx_user_account (user_id, account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Budgets (per category, per month)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS budgets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  category_id INT UNSIGNED NULL,         -- NULL = overall monthly budget
  expense_group_id INT UNSIGNED NULL,
  amount DECIMAL(14,2) NOT NULL,
  period_month TINYINT UNSIGNED NOT NULL,   -- 1-12
  period_year SMALLINT UNSIGNED NOT NULL,   -- e.g. 2026
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (expense_group_id) REFERENCES expense_groups(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_budget (user_id, category_id, expense_group_id, period_month, period_year),
  INDEX idx_user_period (user_id, period_year, period_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Refresh tokens (for JWT rotation / logout-all support)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Seed data is inserted per-user right after registration by
-- the backend (see api/auth.php -> seedDefaults()), so every
-- new account starts with sensible groups/categories/accounts.
-- ============================================================
