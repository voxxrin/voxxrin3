import { IonIcon, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Route, useParams } from "react-router";
import EventSchedule from "./EventSchedule";
import { playCircle, star } from "ionicons/icons";

const EventDetails: React.FC = () => {
    const params = useParams<{ eventId: string }>();
    const eventId = params.eventId

    return <IonReactRouter>
            <IonTabs>
                <IonRouterOutlet id="event-router">
                    <Route path="/events/:eventId" render={() => <EventSchedule />} exact={true} />
                    <Route path="/events/:eventId/favorites" render={() => <EventSchedule />} exact={true} />
                </IonRouterOutlet>
                <IonTabBar slot="bottom">
                    <IonTabButton tab="event" href={`/events/${eventId}`}>
                        <IonIcon icon={playCircle} />
                    </IonTabButton>
                    <IonTabButton tab="event-favorites" href={`/events/${eventId}/favorites`}>
                        <IonIcon icon={star} />
                    </IonTabButton>
                </IonTabBar>
            </IonTabs>
            </IonReactRouter>
}
export default EventDetails