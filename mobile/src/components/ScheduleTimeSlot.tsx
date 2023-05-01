import { IonLabel, IonItem, IonItemGroup, IonItemDivider } from '@ionic/react';
import { BreakScheduleTimeSlot, ScheduleTalk, TalksScheduleTimeSlot } from "../data/schedule"
import ScheduleTalkItem from "./ScheduleTalkItem"
import { DayTalksStats, UserDayTalksNotes } from '../data/feedbacks';


interface ScheduleTimeSlotProps {
    timeSlot: BreakScheduleTimeSlot | TalksScheduleTimeSlot,
    stats?: DayTalksStats,
    talksNotes?: UserDayTalksNotes,
    favoritesOnly: boolean;
    onToggleFavorite: (talkId: string) => void
}

const ScheduleTimeSlot: React.FC<ScheduleTimeSlotProps> = ({timeSlot, stats, talksNotes, favoritesOnly, onToggleFavorite}) => {

    const scheduleBreakItem = function(slot: BreakScheduleTimeSlot) {
      if (favoritesOnly) {
        return <></>
      }    
      return <IonItem>
                <IonLabel>
                  <h2>{slot.break.title}</h2>
                  <h3>Break</h3>
                </IonLabel>
                <IonItem>
                  <IonLabel><h4>{slot.break.room.title}</h4></IonLabel>
                </IonItem>
            </IonItem>
    }
    
    const talkItem = function(talk: ScheduleTalk) {
      const talkStats = stats?.stats
                                .find((t) => {return t.id == talk.id}) 
                                ?? {id: talk.id, totalFavoritesCount: 0}

      const talkNotes = talksNotes?.notes
                                .find((t) => {return t.talkId == talk.id}) 
                                ?? undefined
      
      if (favoritesOnly && !(talkNotes?.isFavorite)) {
        return <></>
      }                          

      return <ScheduleTalkItem
              key={talk.id} 
              talk={talk} 
              talkStats={talkStats} 
              talkNotes={talkNotes} 
              onToggleFavorite={() => {onToggleFavorite(talk.id)}}
              />
    }
  
    var content;
    if (timeSlot.type == "talks") {
        content = (timeSlot as TalksScheduleTimeSlot).talks.map(talkItem)
    } else {
        content = scheduleBreakItem(timeSlot as BreakScheduleTimeSlot)
    }

    const formatTime = (date:string) => { return new Date(date).toTimeString().slice(0,5) }

    return (
      <IonItemGroup key={timeSlot.id}>
        <IonItemDivider color={timeSlot.type == "talks" ? "primary" : "secondary"}>
          <IonLabel>  {formatTime(timeSlot.start)} - {formatTime(timeSlot.end)}</IonLabel>
        </IonItemDivider>
        {content}
      </IonItemGroup>
    );
}

export default ScheduleTimeSlot    