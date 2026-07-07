#!/bin/sh
# Railway startup script
set -e

# Ensure db directory exists
mkdir -p db

# Push schema to database (creates tables if they don't exist)
npx prisma db push --skip-generate --accept-data-loss 2>/dev/null || npx prisma db push --skip-generate

# Railway provides PORT; default fallback to 3000
export PORT="${PORT:-3000}"
# Bind to all interfaces so Railway can reach the server
export HOSTNAME="0.0.0.0"

echo "Starting server on PORT=$PORT HOSTNAME=$HOSTNAME"

# Start the Next.js server
exec node .next/standalone/server.js