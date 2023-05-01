import React from 'react';
import { IonList, IonItem, IonLabel, IonPage, IonContent, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle } from '@ionic/react';

import useEventsList from "../hooks/useEventsList"


const EventsList: React.FC = () => {
    const eventsList = useEventsList()

    return (
      <IonPage id="events-page">
        <IonHeader>
          <IonToolbar>
              <IonButtons slot="start">
                <IonMenuButton></IonMenuButton>
              </IonButtons>
              <IonTitle>Events</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonList>
              {eventsList.map(event => 
              <IonItem key={event.id} routerLink={`/events/${event.id}`} detail={true}>
                <IonLabel>
                  <h3>{event.title}</h3>
                  <p>{event.location.city}</p>
                </IonLabel>
              </IonItem>
              )
              }
          </IonList>
        </IonContent>
      </IonPage>
    );
}

export default EventsList;