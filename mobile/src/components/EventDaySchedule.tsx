import {
    IonAccordionGroup,
    IonHeader,
} from '@ionic/react';

import ScheduleTimeSlot from "./ScheduleTimeSlot"

import './EventDaySchedule.css';

import useDaySchedule from "../hooks/useDaySchedule"
import useTalkStats from '../hooks/useTalkStats';

interface EventDayScheduleProps {
    eventId: string;
    day?: string;
}


const EventDaySchedule: React.FC<EventDayScheduleProps> = ({eventId, day}) => {
    const daySchedule = useDaySchedule({eventId, day})
    const dayTalkStats = useTalkStats({eventId, day})

    return (
        <>
        <IonHeader>
            {daySchedule?.day ?? "Loading..."}
        </IonHeader>
        <IonAccordionGroup>
            {daySchedule?.timeSlots?.map((s) => <ScheduleTimeSlot eventId={eventId} timeSlot={s} key={s.id} stats={dayTalkStats} />)}
        </IonAccordionGroup>
    </>
    );
}

export default EventDaySchedule