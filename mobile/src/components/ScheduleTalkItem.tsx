import {    
    IonButton, IonItem, IonIcon, IonChip, IonLabel
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
        <IonItem key={talk.id}>
            <IonLabel>
            <h2>{talk.title}</h2>          
            <h3>{talk.track.title}</h3>
            </IonLabel>

            <IonItem lines="none">
                <IonLabel><h4>{talk.room.title}</h4></IonLabel>
                <IonChip slot="end" color="primary">{talkStats?.totalFavoritesCount ?? "0"}</IonChip>
                <IonButton slot="end" color={isFavorite ? "danger" : "light"} onClick={onToggleFavorite}>
                <IonIcon slot="icon-only" icon={star}></IonIcon>
                </IonButton>
            </IonItem>          
      </IonItem>
    );
}

export default ScheduleTalkItem;