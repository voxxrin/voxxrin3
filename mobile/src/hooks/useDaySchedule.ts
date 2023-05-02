import { useState, useEffect } from 'react';
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase"
import { DaySchedule } from "../../../shared/models/schedule"

export interface EventDayScheduleProps {
  eventId: string;
  day?: string;
}

export default function useDaySchedule(props: EventDayScheduleProps) {
    const [daySchedule, setDaySchedule] = useState(null as DaySchedule | null);
    const eventId: string = props.eventId
    const day = props.day

    useEffect(() => {
      if (day != null) {
        const d = doc(db, `events/${eventId}/days/${day}`)
        const unsubscribe = onSnapshot(d, docSnapshot => {
            setDaySchedule(docSnapshot.data() as DaySchedule)
          }, err => {
            console.log(`Encountered error: ${err}`);
          });
        return unsubscribe;
      } else {
        return () => {}
      }
    }, [eventId, day]);
    return daySchedule;
  }