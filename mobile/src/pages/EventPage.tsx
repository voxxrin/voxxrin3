import { IonIcon, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Redirect, Route, useParams } from "react-router";
import EventSchedule from "./EventSchedule";
import { playCircle, star } from "ionicons/icons";
import { useState } from "react";
import useEventDetails from "../hooks/useEventDetails";

const EventPage: React.FC = () => {
    const params = useParams<{ eventId: string }>();
    const eventId = params.eventId
    const eventDetails = useEventDetails({eventId: params.eventId}) ?? undefined
    const [day, setDay] = useState<string | undefined>(undefined)

    if (!day && (eventDetails?.info.days.length ?? 0) > 0) {
        setDay(eventDetails?.info.days[0])
    }

    return <IonReactRouter>
            <IonTabs>
                <IonRouterOutlet id="event-router">
                    <Redirect exact path="/events/:eventId" to="/events/:eventId/schedule" />
                    <Route path="/events/:eventId/schedule"  exact={true}
                            render={() => 
                                <EventSchedule 
                                    eventDetails={eventDetails} favoritesOnly={false} 
                                    day={day} onDayChange={setDay} />} />
                    <Route path="/events/:eventId/favorites"  exact={true}
                            render={() => 
                                <EventSchedule 
                                    eventDetails={eventDetails} favoritesOnly={true} 
                                    day={day} onDayChange={setDay} />} />
                </IonRouterOutlet>
                <IonTabBar slot="bottom">
                    <IonTabButton tab="event" href={`/events/${eventId}/schedule`}>
                        <IonIcon icon={playCircle} />
                    </IonTabButton>
                    <IonTabButton tab="event-favorites" href={`/events/${eventId}/favorites`}>
                        <IonIcon icon={star} />
                    </IonTabButton>
                </IonTabBar>
            </IonTabs>
            </IonReactRouter>
}
export default EventPage