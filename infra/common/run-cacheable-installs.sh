#!/bin/bash

# Fail on error
set -e
set -o pipefail


GCS_CACHE_BUCKET=$1
GCS_APP=$2
BITRISE_GIT_BRANCH=$3
CURRENT_STACK=$4
APP_KIND=$5

gcs-cache cached-fs --bucket-url=$GCS_CACHE_BUCKET "--app=$GCS_APP" --branch=$BITRISE_GIT_BRANCH --cache-name=$CURRENT_STACK-global-npm-packages --checksum-file=package-lock.json "--cacheable-command=npm ci" global-node-modules:node_modules
