import { IonIcon, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Redirect, Route, useParams } from "react-router";
import EventSchedule from "./EventSchedule";
import { playCircle, star } from "ionicons/icons";

const EventDetails: React.FC = () => {
    const params = useParams<{ eventId: string }>();
    const eventId = params.eventId

    return <IonReactRouter>
            <IonTabs>
                <IonRouterOutlet id="event-router">
                    <Redirect exact path="/events/:eventId" to="/events/:eventId/schedule" />
                    <Route path="/events/:eventId/schedule" render={() => <EventSchedule favoritesOnly={false} />} exact={true} />
                    <Route path="/events/:eventId/favorites" render={() => <EventSchedule favoritesOnly={true} />} exact={true} />
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
export default EventDetails