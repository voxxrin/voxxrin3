import {
    IonAccordionGroup,
    IonHeader,
    IonTitle,
} from '@ionic/react';

import ScheduleTimeSlot from "./ScheduleTimeSlot"

import './EventDaySchedule.css';

import useDaySchedule from "../hooks/useDaySchedule"
import useTalkStats from '../hooks/useTalkStats';
import useUserTalkNotes from '../hooks/useUserTalkNotes';
import useUserId from '../hooks/useUserId';

interface EventDayScheduleProps {
    eventId: string;
    day?: string;
}


const EventDaySchedule: React.FC<EventDayScheduleProps> = ({eventId, day}) => {
    const daySchedule = useDaySchedule({eventId, day})
    const dayTalkStats = useTalkStats({eventId, day})
    const userId = useUserId()
    const {talksNotes, updateTalkNotes} = useUserTalkNotes({eventId, day, userId})

    const toggleFavorite = function(talkId: string) {
        updateTalkNotes(talkId, (notes) => {
            notes.isFavorite = !notes.isFavorite
        })
    }

    return (
        <>
        <IonTitle>{daySchedule?.day ?? "Loading..."}</IonTitle>
        <IonAccordionGroup>
            {daySchedule?.timeSlots?.map( (s) => 
                <ScheduleTimeSlot 
                    key={s.id} timeSlot={s} stats={dayTalkStats}
                    talksNotes={talksNotes} onToggleFavorite={toggleFavorite} />
            )}
        </IonAccordionGroup>
    </>
    );
}

export default EventDaySchedule