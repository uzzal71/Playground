

set -e

GATEWAY_URL="${GATEWAY_URL:-http://localhost:8080}"
ADMIN_URL="${KONG_ADMIN_URL:-http://localhost:8001}"

PASS=0
FAIL=0

check() {
  local name="$1"
  local url="$2"
  local expected_code="$3"

  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")

  if [ "$HTTP_CODE" = "$expected_code" ]; then
    echo "  PASS: $name (HTTP $HTTP_CODE)"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $name (expected $expected_code, got $HTTP_CODE)"
    FAIL=$((FAIL + 1))
  fi
}

echo "Smoke testing API Gateway at $GATEWAY_URL"
echo ""

echo "1. Gateway health"
check "Status endpoint" "http://localhost:8100/status" "200"
check "Admin API reachable" "$ADMIN_URL/status" "200"

echo ""
echo "2. Public endpoints (no auth required)"
check "Auth login route exists" "$GATEWAY_URL/api/v1/auth/login" "405"   
check "JWKS endpoint" "$GATEWAY_URL/.well-known/jwks.json" "200"
check "Medicine browse" "$GATEWAY_URL/api/v1/medicines" "200"

echo ""
echo "3. Protected endpoints (should reject without token)"
check "Orders requires auth" "$GATEWAY_URL/api/v1/orders" "401"
check "Cart requires auth" "$GATEWAY_URL/api/v1/cart" "401"

echo ""
echo "4. CORS preflight"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X OPTIONS "$GATEWAY_URL/api/v1/medicines" \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
  echo "  PASS: CORS preflight (HTTP $HTTP_CODE)"
  PASS=$((PASS + 1))
else
  echo "  FAIL: CORS preflight (got $HTTP_CODE)"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "5. Rate limiting headers present"
HEADERS=$(curl -s -I "$GATEWAY_URL/api/v1/medicines" 2>&1)
if echo "$HEADERS" | grep -qi "X-RateLimit-Limit"; then
  echo "  PASS: Rate limit headers present"
  PASS=$((PASS + 1))
else
  echo "  FAIL: Rate limit headers missing"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "Total: $PASS passed, $FAIL failed"
echo ""

if [ $FAIL -gt 0 ]; then
  exit 1
fi
