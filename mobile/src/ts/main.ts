import "./capacitor-welcome"
import "./marvel-character"
import {Capacitor} from "@capacitor/core";

import { defineCustomElements } from '@ionic/core/loader';

/* Core CSS required for Ionic components to work properly */
import '@ionic/core/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/core/css/normalize.css';
import '@ionic/core/css/structure.css';
import '@ionic/core/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/core/css/padding.css';
import '@ionic/core/css/float-elements.css';
import '@ionic/core/css/text-alignment.css';
import '@ionic/core/css/text-transformation.css';
import '@ionic/core/css/flex-utils.css';
import '@ionic/core/css/display.css';

/* Theme variables */
import '../css/themes/variable.css';


// Only loading pwa-elements polyfills on web platform, as it would be useless on native platforms
if(Capacitor.getPlatform() === 'web') {
    import('@ionic/pwa-elements/loader')
        .then(({ defineCustomElements: definePWACustomElements }) => definePWACustomElements(window));
}

defineCustomElements();
