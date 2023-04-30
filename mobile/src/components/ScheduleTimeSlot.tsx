import {    
    IonAccordion,
    IonLabel,
    IonItem,
    IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle
} from '@ionic/react';

import {BreakScheduleTimeSlot, TalksScheduleTimeSlot} from "../data/schedule"

import ScheduleTalkItem from "./ScheduleTalkItem"


interface ScheduleTimeSlotProps {
    eventId: string,
    timeSlot: BreakScheduleTimeSlot | TalksScheduleTimeSlot;
}
  

const ScheduleTimeSlot: React.FC<ScheduleTimeSlotProps> = ({eventId, timeSlot}) => {
    var content;
if (timeSlot.type == "talks") {
    const slot = timeSlot as TalksScheduleTimeSlot
    content = slot.talks.map((talk) => {
        return <ScheduleTalkItem key={talk.id} eventId={eventId} talk={talk} />
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
        <IonAccordion value="{timeSlot.id}">
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