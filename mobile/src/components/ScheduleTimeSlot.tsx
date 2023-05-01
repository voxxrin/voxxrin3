import {    
    IonAccordion,
    IonLabel,
    IonItem,
    IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle
} from '@ionic/react';

import {BreakScheduleTimeSlot, TalksScheduleTimeSlot} from "../data/schedule"

import ScheduleTalkItem from "./ScheduleTalkItem"
import { DayTalksStats, UserDayTalksNotes } from '../data/feedbacks';


interface ScheduleTimeSlotProps {
    timeSlot: BreakScheduleTimeSlot | TalksScheduleTimeSlot,
    stats?: DayTalksStats,
    talksNotes?: UserDayTalksNotes,
    onToggleFavorite: (talkId: string) => void
}
  

const ScheduleTimeSlot: React.FC<ScheduleTimeSlotProps> = ({timeSlot, stats, talksNotes, onToggleFavorite}) => {
    var content;
if (timeSlot.type == "talks") {
    const slot = timeSlot as TalksScheduleTimeSlot
    content = slot.talks.map((talk) => {
        const talkStats = stats?.stats.find((t) => {return t.id == talk.id}) ?? {id: talk.id, totalFavoritesCount: 0}
        const talkNotes = talksNotes?.notes.find((t) => {return t.talkId == talk.id}) ?? undefined
        return <ScheduleTalkItem
                  key={talk.id} talk={talk} talkStats={talkStats} 
                  talkNotes={talkNotes} onToggleFavorite={() => {onToggleFavorite(talk.id)}}
                  />
    })
} else {
    const slot = timeSlot as BreakScheduleTimeSlot
    content = <IonCard>
    <IonCardHeader>
      <IonCardTitle>{slot.break.title}</IonCardTitle>
      <IonCardSubtitle>Break</IonCardSubtitle>
    </IonCardHeader>

    <IonCardContent>
      {slot.break.room.title}
    </IonCardContent>
  </IonCard>
}

    return (
      <IonAccordion value={timeSlot.id}>
        <IonItem slot="header" color="light">
          <IonLabel>  {timeSlot.start.substring(11)} - {timeSlot.end.substring(11)}</IonLabel>
        </IonItem>
        <div className="ion-padding" slot="content">
        {content}
        </div>
      </IonAccordion>
    );
}

export default ScheduleTimeSlot    