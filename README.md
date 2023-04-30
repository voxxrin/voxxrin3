# Voxxr.in

Voxxrin is your mobile conference companion.

## Project structure

Voxxrin is a mobile app developed using ionic / capacitor + react, wth a serverless backend relying on several Firebase services (auth, firestore, cloud functions).

The mobile app is located in the `mobile` directory, and serverless firebase code is located in the `cloud` directory.

## Development

### Prerequisites

A recent Node version (18+) - see https://nodejs.org/en/download or https://github.com/nvm-sh/nvm

For cloud development only:
- firebase cli installed - `npm install -g firebase-tools` (see https://firebase.google.com/docs/cli)
- access to a firebase project (create a new one or ask to join the team's one) - see https://firebase.google.com/docs/projects/learn-more?hl=en
- `firebase use --add <FIREBASE_PROJECT_ID>` where `<FIREBASE_PROJECT_ID>` is the name of the firebase project

### Mobile / Web

in `mobile` directory

- `npm ci` to install the dependencies
- `npm run dev` to launch web dev server and preview the app in your browser

Note that the web version access the deployed cloud firestore data by default. 

### Mobile / native

in `mobile` directory

first check the capacitor setup documentation here:
https://capacitorjs.com/docs/getting-started/environment-setup

then you can:
- `npx cap add android` the first time you want to add Android support
- `npx cap add ios` the first time you want to add iOS support
- `npm run build && npx cap sync` to build the web app and sync it to the native app
- use Android Studio / Xcode to launch the app

### Cloud

in `cloud/functions` directory

- `npm run serve` to build the project, launch firebase emulators, and test the cloud functions
- `npm run deploy` to deploy the cloud functions to the cloud and make them accessible to the mobile app