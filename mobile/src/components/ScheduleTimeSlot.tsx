import { IonLabel, IonItem, IonItemGroup, IonItemDivider } from '@ionic/react';
import { BreakScheduleTimeSlot, ScheduleTalk, TalksScheduleTimeSlot } from "../../../shared/models/schedule"
import ScheduleTalkItem from "./ScheduleTalkItem"
import { DayTalksStats, TalkDetails, UserDayTalksNotes } from '../../../shared/models/feedbacks';
import { getTalkDetails } from '../models/utils';


interface ScheduleTimeSlotProps {
    timeSlot: BreakScheduleTimeSlot | TalksScheduleTimeSlot,
    stats?: DayTalksStats,
    talksNotes?: UserDayTalksNotes,
    favoritesOnly: boolean;
    onToggleFavorite: (talkId: string) => void
}

const ScheduleTimeSlot: React.FC<ScheduleTimeSlotProps> = ({timeSlot, stats, talksNotes, favoritesOnly, onToggleFavorite}) => {

    const scheduleBreakItem = function(slot: BreakScheduleTimeSlot) {
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
    
    const talkItem = function(talkDetails: TalkDetails) {      
      return <ScheduleTalkItem key={talkDetails.talk.id} talkDetails={talkDetails} 
                onToggleFavorite={() => {onToggleFavorite(talkDetails.talk.id)}}
              />
    }
  
    var content;
    if (timeSlot.type == "talks") {
        content = (timeSlot as TalksScheduleTimeSlot).talks
        .map((t) => { return getTalkDetails(t, stats, talksNotes) })
        .filter((td) => { return td.talkNotes?.isFavorite || !favoritesOnly })
        .map(talkItem)
    } else {
        content = !favoritesOnly ? scheduleBreakItem(timeSlot as BreakScheduleTimeSlot) : <></>
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