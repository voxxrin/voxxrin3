import {    
    IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonBadge, IonButton, IonItem, IonIcon, IonChip
} from '@ionic/react';
import { star } from 'ionicons/icons';

import {ScheduleTalk} from "../data/schedule"
import { TalkStats, UserTalkNotes } from '../data/feedbacks';

interface ScheduleTalkItemProps {
    talk: ScheduleTalk,
    talkStats: TalkStats,
    talkNotes?: UserTalkNotes,
    onToggleFavorite: () => void
}

const ScheduleTalkItem: React.FC<ScheduleTalkItemProps> = ({talk, talkStats, talkNotes, onToggleFavorite}) => {
    const isFavorite = talkNotes?.isFavorite ?? false

    return (
        <IonCard key={talk.id}>
        <IonCardHeader>
          <IonCardTitle>{talk.title}</IonCardTitle>          
          <IonCardSubtitle>{talk.track.title}</IonCardSubtitle>
        </IonCardHeader>        

        <IonCardContent>
            <IonItem>
                {talk.room.title}
                <IonChip slot="end" color="primary">{talkStats?.totalFavoritesCount ?? "0"}</IonChip>
                <IonButton slot="end" color={isFavorite ? "danger" : "light"} onClick={onToggleFavorite}>
                <IonIcon slot="icon-only" icon={star}></IonIcon>
                </IonButton>
            </IonItem>          
        </IonCardContent>        
      </IonCard>
    );
}

export default ScheduleTalkItem;