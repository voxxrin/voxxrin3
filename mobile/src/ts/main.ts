import "./capacitor-welcome"
import "./marvel-character"
import {Capacitor} from "@capacitor/core";

// Only loading pwa-elements polyfills on web platform, as it would be useless on native platforms
if(Capacitor.getPlatform() === 'web') {
    import('@ionic/pwa-elements/loader')
        .then(({ defineCustomElements }) => defineCustomElements(window));
}
