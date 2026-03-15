#!/bin/bash
# deploy.sh — Deploy LiveData OS to Google Cloud Run
set -euo pipefail

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:?Set GOOGLE_CLOUD_PROJECT environment variable}"
REGION="${GOOGLE_CLOUD_LOCATION:-us-central1}"
SERVICE_NAME="livedata-os"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "=== Building container image ==="
gcloud builds submit \
  --project="${PROJECT_ID}" \
  --tag="${IMAGE}" \
  .

echo ""
echo "=== Deploying to Cloud Run ==="
gcloud run deploy "${SERVICE_NAME}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --image="${IMAGE}" \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=1Gi \
  --timeout=3600 \
  --session-affinity \
  --set-env-vars="GOOGLE_API_KEY=${GOOGLE_API_KEY:?Set GOOGLE_API_KEY}" \
  --min-instances=0 \
  --max-instances=3

echo ""
echo "=== Deployment complete ==="
gcloud run services describe "${SERVICE_NAME}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --format="value(status.url)"
