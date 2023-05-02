import {    
    IonButton, IonItem, IonIcon, IonChip, IonLabel
} from '@ionic/react';
import { star } from 'ionicons/icons';

import { TalkDetails } from '../../../shared/models/feedbacks';

interface ScheduleTalkItemProps {
    talkDetails: TalkDetails,
    onToggleFavorite: () => void
}

const ScheduleTalkItem: React.FC<ScheduleTalkItemProps> = ({talkDetails, onToggleFavorite}) => {
    const talk = talkDetails.talk
    const talkStats = talkDetails.talkStats
    const talkNotes = talkDetails.talkNotes
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