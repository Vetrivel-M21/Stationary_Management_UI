#!/bin/sh

# If BACKEND_URL is not set, fallback to VITE_API_TARGET
if [ -z "$BACKEND_URL" ] && [ -n "$VITE_API_TARGET" ]; then
  export BACKEND_URL="$VITE_API_TARGET"
fi

# Ensure default fallback if still empty
if [ -z "$BACKEND_URL" ]; then
  export BACKEND_URL="http://localhost:8091"
fi

# Ensure protocol prefix (http:// or https://)
case "$BACKEND_URL" in
  http://*|https://*) ;;
  *) export BACKEND_URL="https://$BACKEND_URL" ;;
esac

# Execute standard Nginx Docker entrypoint
exec /docker-entrypoint.sh "$@"
