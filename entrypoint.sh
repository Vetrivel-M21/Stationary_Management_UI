#!/bin/sh

# Fallback to VITE_API_TARGET if BACKEND_URL is empty
if [ -z "$BACKEND_URL" ] && [ -n "$VITE_API_TARGET" ]; then
  export BACKEND_URL="$VITE_API_TARGET"
fi

if [ -z "$BACKEND_URL" ]; then
  export BACKEND_URL="http://localhost:8091"
fi

# Remove leading http:// or https:// or malformed http:/ https: along with trailing slashes
CLEAN_URL=$(echo "$BACKEND_URL" | sed -E 's|^https?:/*||' | sed -E 's|/*$||')

# Determine protocol (http for localhost/IPs, https for domain names)
case "$CLEAN_URL" in
  localhost*|127.0.0.1*) PROTOCOL="http://" ;;
  *) PROTOCOL="https://" ;;
esac

# Append /api/v1/ if not already present
case "$CLEAN_URL" in
  */api/v1) TARGET_URL="${PROTOCOL}${CLEAN_URL}/" ;;
  */api/v1/) TARGET_URL="${PROTOCOL}${CLEAN_URL}" ;;
  *) TARGET_URL="${PROTOCOL}${CLEAN_URL}/api/v1/" ;;
esac

export BACKEND_URL="$TARGET_URL"

echo "[ENTRYPOINT] Nginx BACKEND_URL set to: ${BACKEND_URL}"

# Execute standard Nginx Docker entrypoint
exec /docker-entrypoint.sh "$@"
