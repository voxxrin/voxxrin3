import React from 'react';
import { IonList, IonItem, IonLabel } from '@ionic/react';

import useEventsList from "../hooks/useEventsList"


const EventsList: React.FC = () => {
    const eventsList = useEventsList()

    return (
        <IonList>
            {eventsList.map(event => 
            <IonItem key={event.id} href={`/event/${event.id}`} detail={true}>
            <IonLabel>
              <h3>{event.title}</h3>
              <p>{event.location.city}</p>
            </IonLabel>
          </IonItem>
            )
            }
        </IonList>
    );
}

export default EventsList;