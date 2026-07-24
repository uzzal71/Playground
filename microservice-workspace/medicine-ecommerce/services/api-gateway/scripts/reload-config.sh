

set -e

CONFIG_FILE="${1:-config/kong.yml}"
ADMIN_URL="${KONG_ADMIN_URL:-http://localhost:8001}"

echo "Reloading Kong with config: $CONFIG_FILE"
echo "Admin API URL: $ADMIN_URL"


if ! curl -sf "$ADMIN_URL/status" > /dev/null; then
  echo "ERROR: Kong is not running or admin API is unreachable at $ADMIN_URL"
  exit 1
fi


echo "Sending new config..."
RESPONSE=$(curl -sw "\n%{http_code}" -X POST "$ADMIN_URL/config" \
  -F config=@"$CONFIG_FILE")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -eq 201 ]; then
  echo "Config reloaded successfully (no downtime)"
else
  echo "Reload failed with HTTP $HTTP_CODE"
  echo "$BODY"
  exit 1
fi
