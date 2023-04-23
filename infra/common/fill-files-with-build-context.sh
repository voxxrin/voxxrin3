#!/bin/bash

# Fail on error
set -e

SCRIPT=`realpath $0`
SCRIPTPATH=`dirname $SCRIPT`

APPID=$1
APP_TITLE=$2
APP_KIND=$3
VERSION=$4
APPSTORE_VERSION=$5
PLATFORM=$6

currentDate=$(date -u +"%Y%m%d%H%M")
versionCode=${currentDate:3}

function replaceInFile() {
  local unameOut="$(uname -s)"
  case "${unameOut}" in
    Linux*)     sed -i "$@";;
    Darwin*)    sed -i '' "$@";;
    *)
  esac
}


# Replacing App id and App title
replaceInFile "s/appId[[:space:]]*:[[:space:]]*\"[0-9\\.a-zA-Z\\-]*\"/appId: \"$APPID\"/g" "$SCRIPTPATH/../../capacitor.config.ts"
replaceInFile "s/appName[[:space:]]*:[[:space:]]*\"[0-9\\.a-zA-Z\\-]*\"/appName: \"$APP_TITLE\"/g" "$SCRIPTPATH/../../capacitor.config.ts"
