#!/bin/sh
# Railway startup script
set -e

# Ensure db directory exists (absolute path)
DB_DIR="/app/db"
mkdir -p "$DB_DIR"

# Set DATABASE_URL to absolute path so Prisma always finds the DB
export DATABASE_URL="file:$DB_DIR/custom.db"

# Push schema to database (creates tables if they don't exist)
npx prisma db push --skip-generate --accept-data-loss 2>/dev/null || npx prisma db push --skip-generate

# Railway provides PORT; default fallback to 3000
export PORT="${PORT:-3000}"
# Bind to all interfaces so Railway can reach the server
export HOSTNAME="0.0.0.0"

echo "Starting server on PORT=$PORT HOSTNAME=$HOSTNAME DB=$DATABASE_URL"

# Start the Next.js server
exec node .next/standalone/server.js