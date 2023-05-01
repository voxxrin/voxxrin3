import {
    IonContent,
    IonHeader,
    IonButton,
    IonButtons,
    IonPage,
    IonTitle,
    IonToolbar,
    IonMenuButton
} from '@ionic/react';

import './EventSchedule.css';

import EventDaySchedule from "../components/EventDaySchedule"
import { useState } from 'react';
import { useParams } from 'react-router';
import useEventDetails from '../hooks/useEventDetails';


const EventSchedule: React.FC = () => {
    const params = useParams<{ eventId: string }>();
    const eventDetails = useEventDetails({eventId: params.eventId})
    const [day, setDay] = useState<string | undefined>(undefined)

    const navToDay = function(d: string) {
        setDay(d)
    }

    const navButtons = eventDetails?.info.days.map((d:string) => {
        return (
            <IonButton key={d} onClick={() => navToDay(d)}>
                {d[0]}
            </IonButton>
            );
    })

    if (day === undefined && eventDetails?.info.days[0] !== undefined) {
        navToDay(eventDetails?.info.days[0])
    }    

    return (
        <IonPage id="event-page">
            <IonHeader>
            <IonToolbar>
                <IonButtons slot="start">
                <IonMenuButton></IonMenuButton>
                </IonButtons>
                <IonTitle>{eventDetails?.info.title ?? "loading..."}</IonTitle>
            </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonToolbar>
                    <IonButtons slot="start">
                    {navButtons}
                    </IonButtons>
                </IonToolbar>
                <EventDaySchedule eventId={eventDetails?.info.id ?? ""} day={day} />
            </IonContent>
        </IonPage>
    );
}

export default EventSchedule