import { createApp } from 'vue'
import App from './App.vue'
import {app as firebaseApp} from './state/firebase'
import router from './router';
import globalComponents from './global-components';
import { i18nPlugin } from './i18n/i18n-vue'

import { IonicVue } from '@ionic/vue';

import './state/useDevUtilities'

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/* Theme variables */
import './styles/utils/_variables.scss';

import './styles/main.scss'
import {detectLocale} from "@/i18n/i18n-util";
import {navigatorDetector} from "typesafe-i18n/detectors";
import {loadLocaleAsync} from "@/i18n/i18n-util.async";
import {useFirebaseAuth, VueFire, VueFireAuth} from "vuefire";
import { signInAnonymously } from 'firebase/auth';

const app = createApp(App);
app
  .use(IonicVue)
  .use(VueFire, {
    firebaseApp,
    modules: [
        VueFireAuth()
    ]
  }).use(router)
  .use(globalComponents)


// const detectedLocale = detectLocale(navigatorDetector)
const detectedLocale = 'en';

loadLocaleAsync(detectedLocale);

const auth = useFirebaseAuth()!

Promise.all([
    loadLocaleAsync(detectedLocale).then(() => app.use(i18nPlugin, detectedLocale)),
    router.isReady(),
    signInAnonymously(auth)
]).then(async ([_1, _2]) => {
    app.mount('#app');
})
