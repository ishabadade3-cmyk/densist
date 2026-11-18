#!/bin/sh
set -eu
: "${PUBLIC_BASE_URL:?Set PUBLIC_BASE_URL to the HTTPS origin}"
base="${PUBLIC_BASE_URL%/}"
curl --fail --silent --show-error --max-time 10 --output /dev/null "$base/"
curl --fail --silent --show-error --max-time 10 --output /dev/null "$base/api/v1/health"
echo "monitor_probe_ok utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
