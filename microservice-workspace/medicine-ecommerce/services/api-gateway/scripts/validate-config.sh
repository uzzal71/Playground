

set -e

CONFIG_FILE="${1:-config/kong.yml}"

echo "Validating Kong configuration: $CONFIG_FILE"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "ERROR: Config file not found: $CONFIG_FILE"
  exit 1
fi

docker run --rm \
  -v "$(pwd)/$CONFIG_FILE:/kong/kong.yml:ro" \
  kong:3.7-ubuntu \
  kong config parse /kong/kong.yml

if [ $? -eq 0 ]; then
  echo "Config is valid"
else
  echo "Config has errors"
  exit 1
fi
