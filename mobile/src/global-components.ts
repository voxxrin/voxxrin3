import {
    IonButton,
    IonCard, IonCardTitle,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem, IonLabel,
    IonList, IonPage,
    IonTitle, IonToolbar,
    IonRippleEffect
} from "@ionic/vue";
import {App} from "@vue/runtime-core";


export default {
    install: (app: App) => {
        app.component('IonButton', IonButton);
        app.component('IonCard', IonCard);
        app.component('IonCardTitle', IonCardTitle);
        app.component('IonContent', IonContent);
        app.component('IonHeader', IonHeader);
        app.component('IonIcon', IonIcon);
        app.component('IonItem', IonItem);
        app.component('IonLabel', IonLabel);
        app.component('IonList', IonList);
        app.component('IonPage', IonPage);
        app.component('IonRippleEffect', IonRippleEffect);
        app.component('IonToolbar', IonToolbar);
        app.component('IonTitle', IonTitle);
    },
};
