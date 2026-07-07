#!/bin/sh
# Railway startup script
set -e

# Ensure db directory exists
mkdir -p db

# Push schema to database (creates tables if they don't exist)
npx prisma db push --skip-generate --accept-data-loss 2>/dev/null || npx prisma db push --skip-generate

# Start the Next.js server
exec node .next/standalone/server.js