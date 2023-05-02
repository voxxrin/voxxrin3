import { IonList } from '@ionic/react';

import ScheduleTimeSlot from "./ScheduleTimeSlot"

import './EventDaySchedule.css';

import useDaySchedule from "../hooks/useDaySchedule"
import useTalkStats from '../hooks/useTalkStats';
import useUserTalkNotes from '../hooks/useUserTalkNotes';
import useUserId from '../hooks/useUserId';
import { Day } from '../../../shared/models/event';

interface EventDayScheduleProps {
    eventId: string;
    day?: Day;
    favoritesOnly: boolean;
}

const EventDaySchedule: React.FC<EventDayScheduleProps> = ({eventId, day, favoritesOnly}) => {
    const dayId = day?.id
    const daySchedule = useDaySchedule({eventId, dayId})
    const dayTalkStats = useTalkStats({eventId, dayId})
    const userId = useUserId()
    const {talksNotes, updateTalkNotes} = useUserTalkNotes({eventId, dayId, userId})

    const toggleFavorite = function(talkId: string) {
        updateTalkNotes(talkId, (notes) => {
            notes.isFavorite = !notes.isFavorite
        })
    }

    return (
        <>
            <IonList lines="none">
                {daySchedule?.timeSlots?.map((s) => 
                    <ScheduleTimeSlot 
                        key={s.id} timeSlot={s} stats={dayTalkStats}
                        talksNotes={talksNotes} 
                        favoritesOnly={favoritesOnly}
                        onToggleFavorite={toggleFavorite} />
                )}
            </IonList>
        </>
    );
}

export default EventDaySchedule