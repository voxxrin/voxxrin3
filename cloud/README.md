# Voxxrin cloud (and crawler) function

This module contains serverless functions that are used to:
- crawl conference schedules
- trigger firebase computations

## Prerequisites

A recent Node version (18+) - see https://nodejs.org/en/download or https://github.com/nvm-sh/nvm

From `cloud/functions` directory:
- run `npm ci` to provision npm dependencies
- If you want to access an existing Firestore instance in the cloud (instead of using local Firebase émulator):  
  - Run `npx firebase login` to authenticate on your Google account
  - Then access to a firebase project (create a new one or ask to join the team's one) - see https://firebase.google.com/docs/projects/learn-more?hl=en
    `npx firebase use --add <FIREBASE_PROJECT_ID>` where `<FIREBASE_PROJECT_ID>` is the name of the firebase project

## Development

From `cloud/functions` directory:
- `npm run serve` to build the project, launch firebase emulators, and test the cloud functions
- `npm run deploy` to deploy the cloud functions to the cloud and make them accessible to the mobile app
