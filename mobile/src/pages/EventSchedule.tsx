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
import { EventDetails } from '../hooks/useEventDetails';

interface EventScheduleProps {
    eventDetails?: EventDetails,
    favoritesOnly: boolean,
    day: string | undefined,
    onDayChange: (day:string) => void
}

const EventSchedule: React.FC<EventScheduleProps> = ({eventDetails, favoritesOnly, day, onDayChange}) => {
    const navButtons = eventDetails?.info.days.map((d:string) => {
        return (
            <IonButton 
                    key={d} color={d == day ? "danger" : "primary"} fill="solid" shape="round" 
                    onClick={() => onDayChange(d)}>
                {d[0]}
            </IonButton>
            );
    })

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