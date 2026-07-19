#!/bin/bash
# Kospintar - Database Backup Script
# Runs via cron: 0 3 * * * /opt/kospintar/scripts/backup.sh

set -euo pipefail

BACKUP_DIR="/var/backups/kospintar"
DB_NAME="kospintar"
DB_USER="kospintar"
RETENTION_DAYS=14

mkdir -p "${BACKUP_DIR}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"
LOG_FILE="${BACKUP_DIR}/backup.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "${LOG_FILE}"
}

log "Starting backup: ${FILENAME}"

# Dump + compress
if PGPASSWORD="${POSTGRES_PASSWORD:-kospintar}" pg_dump \
  -h "${POSTGRES_HOST:-localhost}" \
  -p "${POSTGRES_PORT:-5432}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  -F c \
  -Z 9 \
  -f "${FILENAME}" 2>> "${LOG_FILE}"; then
  log "Backup completed: $(du -h "${FILENAME}" | cut -f1)"
else
  log "Backup FAILED"
  exit 1
fi

# Rotate old backups
find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -mtime +${RETENTION_DAYS} -delete 2>/dev/null
log "Rotated backups older than ${RETENTION_DAYS} days"

# Copy to secondary storage (optional)
if [ -n "${S3_BACKUP_BUCKET:-}" ]; then
  aws s3 cp "${FILENAME}" "${S3_BACKUP_BUCKET}/" --endpoint-url "${S3_ENDPOINT:-}" 2>> "${LOG_FILE}"
  log "Copied to S3: ${S3_BACKUP_BUCKET}/"
fi

log "Backup finished successfully"
echo "Backup: ${FILENAME}"
