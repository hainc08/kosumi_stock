#!/usr/bin/env bash
# tests/scripts/run-tests.sh
# Chạy toàn bộ integration tests + e2e tests
# Usage: bash tests/scripts/run-tests.sh [integration|e2e|all]

set -e  # Dừng ngay khi có lỗi

MODE=${1:-all}
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
cd "$ROOT/backend"

# ── Màu sắc ────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${YELLOW}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
error()   { echo -e "${RED}[FAIL]${NC} $1"; }

# ── Kiểm tra prerequisites ─────────────────────────────────────────────────
info "Kiểm tra môi trường..."
if [ -z "$DATABASE_URL_TEST" ] && [ -z "$DATABASE_URL" ]; then
  error "Thiếu DATABASE_URL_TEST hoặc DATABASE_URL trong .env"
  exit 1
fi

# Dùng test database nếu có, fallback về DATABASE_URL
export DATABASE_URL=${DATABASE_URL_TEST:-$DATABASE_URL}
info "Database: $DATABASE_URL"

# ── Setup test database ────────────────────────────────────────────────────
info "Chạy migrations trên test database..."
npx prisma migrate deploy 2>/dev/null || npx prisma db push --force-reset
success "Migration xong"

# ── Chạy tests ─────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  WMS Integration Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$MODE" = "integration" ] || [ "$MODE" = "all" ]; then
  info "Chạy Integration Tests..."
  npx vitest run \
    --config vitest.config.ts \
    --reporter=verbose \
    ../tests/integration/ \
    2>&1
fi

if [ "$MODE" = "e2e" ] || [ "$MODE" = "all" ]; then
  info "Chạy E2E Tests..."
  npx vitest run \
    --config vitest.config.ts \
    --reporter=verbose \
    ../tests/e2e/ \
    2>&1
fi

echo ""
success "Tất cả tests hoàn thành!"
