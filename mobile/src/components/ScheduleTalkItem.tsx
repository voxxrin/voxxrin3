import {    
    IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonBadge, IonButton, IonItem, IonIcon
} from '@ionic/react';
import { star } from 'ionicons/icons';

import {ScheduleTalk} from "../data/schedule"
import useUserId from '../hooks/useUserId';
import useUserTalkNotes from '../hooks/useUserTalkNotes';
import { TalkStats } from '../data/feedbacks';

interface ScheduleTalkItemProps {
    eventId: string,
    talk: ScheduleTalk,
    talkStats: TalkStats
}

const ScheduleTalkItem: React.FC<ScheduleTalkItemProps> = ({eventId, talk, talkStats}) => {
    const userId = useUserId()
    const {talkNotes, updateTalkNotes} = useUserTalkNotes({userId: userId, eventId: eventId, talkId: talk.id})
    const isFavorite = talkNotes?.isFavorite ?? false

    const toggleFavorite = function() {                
        updateTalkNotes((notes) => {
            notes.isFavorite = !notes.isFavorite
        })
    }

    return (
        <IonCard key={talk.id}>
        <IonCardHeader>
          <IonCardTitle>{talk.title}</IonCardTitle>          
          <IonCardSubtitle>{talk.track.title}</IonCardSubtitle>
        </IonCardHeader>        

        <IonCardContent>
            <IonItem>
                {talk.room.title}
                <IonBadge slot="end">{talkStats?.totalFavoritesCount ?? "0"}</IonBadge>          
                <IonButton slot="end" color={isFavorite ? "danger" : "light"} onClick={toggleFavorite}>
                <IonIcon slot="icon-only" icon={star}></IonIcon>
                </IonButton>
            </IonItem>          
        </IonCardContent>        
      </IonCard>
    );
}

export default ScheduleTalkItem;