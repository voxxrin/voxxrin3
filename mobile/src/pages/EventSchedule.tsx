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

interface EventScheduleProps {
    favoritesOnly: boolean
}

const EventSchedule: React.FC<EventScheduleProps> = ({favoritesOnly}) => {
    const params = useParams<{ eventId: string }>();
    const eventDetails = useEventDetails({eventId: params.eventId})
    const [day, setDay] = useState<string | undefined>(undefined)

    const navToDay = function(d: string) {
        setDay(d)
    }

    const navButtons = eventDetails?.info.days.map((d:string) => {
        return (
            <IonButton key={d} color={d == day ? "danger" : "primary"} fill="solid" shape="round" onClick={() => navToDay(d)}>
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
                <IonToolbar>
                    <IonButtons>
                    {navButtons}
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <EventDaySchedule eventId={eventDetails?.info.id ?? ""} day={day} favoritesOnly={favoritesOnly} />
            </IonContent>
        </IonPage>
    );
}

export default EventSchedule