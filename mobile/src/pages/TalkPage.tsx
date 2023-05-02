import {
    IonContent,
    IonHeader,
    IonButton,
    IonButtons,
    IonPage,
    IonTitle,
    IonToolbar,
    IonMenuButton,
    IonLabel,
    IonItem,
    IonChip,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonList,
    IonAvatar,
    IonBackButton
} from '@ionic/react';

import './EventSchedule.css';

import { EventDetails } from '../hooks/useEventDetails';
import { useParams } from 'react-router';
import useDaySchedule from '../hooks/useDaySchedule';
import useTalkStats from '../hooks/useTalkStats';
import useUserId from '../hooks/useUserId';
import useUserTalkNotes from '../hooks/useUserTalkNotes';
import { TalksScheduleTimeSlot } from '../../../shared/models/schedule';
import { getTalkDetails } from '../models/utils';
import { star } from 'ionicons/icons';

interface TalkPageProps {
    eventDetails?: EventDetails,
    day?: string
}

const TalkPage: React.FC<TalkPageProps> = ({eventDetails, day}) => {
    const params = useParams<{ eventId: string, talkId: string }>();
    const eventId = params.eventId
    const talkId = params.talkId

    const daySchedule = useDaySchedule({eventId, day})
    const dayTalkStats = useTalkStats({eventId, day})
    const userId = useUserId()
    const {talksNotes, updateTalkNotes} = useUserTalkNotes({eventId, day, userId})

    const toggleFavorite = function() {
        updateTalkNotes(talkId, (notes) => {
            notes.isFavorite = !notes.isFavorite
        })
    }

    const talk = daySchedule?.timeSlots
        ?.filter((s) => {return s.type == "talks"})
        ?.flatMap((s) => {return (s as TalksScheduleTimeSlot).talks})
        ?.find((t) => {return t.id == talkId})
    
    const talkDetails = talk && getTalkDetails(talk, dayTalkStats, talksNotes)   
    const talkStats = talkDetails?.talkStats 
    const isFavorite = talkDetails?.talkNotes?.isFavorite ?? false


    return (
        <IonPage id="talk-page">
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref={window.location.pathname.replace("/talks/" + talkId, "")}></IonBackButton>
                    </IonButtons>
                    <IonTitle>{eventDetails?.info.title ?? "loading..."}</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonCard>
                    <IonCardHeader>
                        <IonCardTitle>{talk?.title}</IonCardTitle>
                        <IonCardSubtitle>{talk?.track.title}</IonCardSubtitle>
                        <IonCardSubtitle>{talk?.format.title}</IonCardSubtitle>
                    </IonCardHeader>
                    <IonCardContent>
                    <IonItem lines="none">
                        <IonLabel><h4>{talk?.room.title}</h4></IonLabel>
                        <IonChip slot="end" color="primary">{talkStats?.totalFavoritesCount ?? "0"}</IonChip>
                        <IonButton slot="end" color={isFavorite ? "danger" : "light"} onClick={toggleFavorite}>
                        <IonIcon slot="icon-only" icon={star}></IonIcon>
                        </IonButton>
                    </IonItem>                          
                    </IonCardContent>
                </IonCard>

                <IonList>
                    {talk?.speakers.map((speaker) => {return <>
                    <IonItem key={speaker.id}>
                        {speaker.photoUrl && 
                            <IonAvatar slot="start">
                            <img alt={"Silhouette of " + speaker.fullName} src={speaker.photoUrl} />
                            </IonAvatar>
                        }
                        <IonLabel>
                            {speaker.fullName} @ {speaker.companyName}
                        </IonLabel>
                    </IonItem>
                    </>})}
                </IonList>

            </IonContent>
        </IonPage>
    );
}

export default TalkPage