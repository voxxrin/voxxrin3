import {
    IonAccordionGroup,
    IonHeader,
} from '@ionic/react';

import ScheduleTimeSlot from "./ScheduleTimeSlot"

import './EventDaySchedule.css';

import useDaySchedule from "../hooks/useDaySchedule"

interface EventDayScheduleProps {
    eventId: string;
    day?: string;
}


const EventDaySchedule: React.FC<EventDayScheduleProps> = ({eventId, day}) => {
    const daySchedule = useDaySchedule({eventId, day})

    return (
        <>
        <IonHeader>
            {daySchedule?.day ?? "Loading..."}
        </IonHeader>
        <IonAccordionGroup>
            {daySchedule?.timeSlots?.map((s) => <ScheduleTimeSlot eventId={eventId} timeSlot={s} key={s.id} />)}
        </IonAccordionGroup>
    </>
    );
}

export default EventDaySchedule