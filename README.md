# Voxxrin Mobile App

This module is [a Capacitor app](https://capacitorjs.com/) intended to build both Android, iOS and
Web (PWA) flavours of the voxxrin app.

## Pre-requisites

`node@16` minimum
`npm@8` minimum

For Android/iOS, look at [Capacitor pre-requisites page](https://capacitorjs.com/docs/getting-started/environment-setup)

## Bootstrap

Simply run `npm ci` from the root folder in order to install every npm packages required.

## Running

Different kind of npm scripts have been provided to help you run/debug the mobile app.

You can run any of them by running `npm run <package.json's script entry>`.
`Mode` are either :
- `dev`: emphasis is made on **dev experience** with small turnaround times, sourcemaps, livereload etc.
- `prod`: emphasis is made on **user experience** with small bundle size (minified, concatenated), no sourcemaps etc.

| Run script              | Mode   | Platform | Description                                                                                                                                                                                                                                                                                                                                                          |
|-------------------------|--------|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `dev`                   | `dev`  | Web      | Starts the web server in `dev` mode with vitejs' **fast hotreload**                                                                                                                                                                                                                                                                                                  |
| `buildrun-dev-android`  | `dev`  | Android  | Builds and deploy **non-minified** app on Android device plugged to your laptop. <br/>Open `chrome://inspect#devices` to remote debug your scripts                                                                                                                                                                                                                   |
| `buildrun-dev-ios`      | `dev`  | iOS      | Builds and deploy **non-minified** app on iOS device emulator (or one plugged to your laptop, but this requires some additional signing configuration in XCode). Open Safari's `Develop > [your device name] > localhost` panel to remote debug your scripts (you will need to enable this menu in Safari's `Preferences > Advanced > Show develop menu in menubar`) |
| `preview`               | `prod` | Web      | Starts the web server in `prod` mode with vitejs (**minified bundle, no hotreload**)                                                                                                                                                                                                                                                                                 |
| `buildrun-prod-android` | `prod` | Android  | Builds and deploy **minified** app on Android device plugged to your laptop. Open `chrome://inspect#devices` to remote debug your scripts                                                                                                                                                                                                                            |
| `buildrun-prod-ios`     | `prod` | iOS      | Builds and deploy **minified** app on iOS device emulator (or one plugged to your laptop, but this requires some additional signing configuration in XCode). Open Safari's `Develop > [your device name] > localhost` panel to remote debug your scripts (you will need to enable this menu in Safari's `Preferences > Advanced > Show develop menu in menubar`)     |
