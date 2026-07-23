-- ============================================================
-- Migration 001: additional indexes for common query patterns
-- ============================================================
-- Run this once against your EXISTING database (fresh installs
-- get these automatically from the updated database.sql instead).
--
-- phpMyAdmin: open your expense_manager database -> SQL tab ->
-- paste this file's contents -> Go.
-- ============================================================

-- budgets.php's GET filters by (user_id, period_month, period_year) without
-- category_id/expense_group_id — the existing uniq_budget key can't serve
-- that as a prefix since category_id/expense_group_id come first in it.
ALTER TABLE budgets ADD INDEX idx_user_period (user_id, period_year, period_month);

-- categories.php's GET optionally filters by type; also speeds up any
-- lookup that needs "this user's categories of type X" as data grows.
ALTER TABLE categories ADD INDEX idx_user_type (user_id, type);

-- Reports/Transactions/Analytics filter by category_id / account_id in
-- combination with user_id; the FK columns are auto-indexed individually,
-- but a composite lets the optimizer use one index instead of two.
ALTER TABLE transactions ADD INDEX idx_user_category (user_id, category_id);
ALTER TABLE transactions ADD INDEX idx_user_account (user_id, account_id);

-- accounts.php's GET always filters by (user_id, is_archived = 0).
ALTER TABLE accounts ADD INDEX idx_user_archived (user_id, is_archived);
