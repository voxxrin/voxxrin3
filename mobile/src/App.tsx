import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonContent, IonHeader, IonItem, IonList, IonMenu, IonRouterOutlet, IonTitle, IonToolbar, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import EventsList from './pages/EventsList';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import UserAccount from './pages/UserAccount';
import EventPage from './pages/EventPage';

setupIonicReact();

const App: React.FC = () => (  
  <IonApp>
    <IonMenu contentId="router">
        <IonHeader>
          <IonToolbar>
            <IonTitle>Voxxrin</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonList>
            <IonItem routerLink="/account">Account</IonItem>
            <IonItem routerLink="/events">Events</IonItem>
          </IonList>
        </IonContent>
    </IonMenu>
    <IonReactRouter>
      <IonRouterOutlet id="router">
        <Redirect exact path="/" to="/account" />
        <Route path="/account" render={() => <UserAccount />} exact={true} />
        <Route path="/events" render={() => <EventsList />} exact={true} />
        <Route path="/events/:eventId" render={() => <EventPage />} />
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
