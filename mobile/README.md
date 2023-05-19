# Voxxrin Mobile App

This module is [a Capacitor app](https://capacitorjs.com/) intended to build both Android, iOS and
Web (PWA) flavours of the voxxrin app.

## Pre-requisites

`node@16` minimum
`npm@8` minimum

For Android/iOS, look at [Capacitor pre-requisites page](https://capacitorjs.com/docs/getting-started/environment-setup)

That being said, you will need to ensure following things :

 - **[Android]** : ensure that you have a `ANDROID_SDK_ROOT` environment variable defined in your terminal :

```
# Run thi command to ensure this pre-requisite is met : you should see a ANDROID_SDK_ROOT variable defined
$> env | grep ANDROID

# If no variable is defined, define it to the path of your android SDK (in general, $HOME/Library/Android/sdk)
export ANDROID_SDK_ROOT="$HOME/Library/Android/sdk"
# .. and you can store this into your $HOME/.zshrc|.bashrc of choice
```

- **[Android]** : ensure that you have a Java 17+ installed in your terminal by executing `java -version`.
  If that's not the case, you can [install SDKMan](https://sdkman.io/install) then install a 17+ version 
  of [one of the different vendors](https://sdkman.io/jdks)


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
