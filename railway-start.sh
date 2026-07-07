#!/bin/sh
# Railway startup script
set -e

# Ensure db directory exists
mkdir -p db

# Push schema to database (creates tables if they don't exist)
npx prisma db push --skip-generate --accept-data-loss 2>/dev/null || npx prisma db push --skip-generate

# Ensure PORT is set (Railway provides this, default fallback to 3000)
export PORT="${PORT:-3000}"

# Start the Next.js server on the correct port
exec node .next/standalone/server.js