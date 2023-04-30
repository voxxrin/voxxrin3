import { useState, useEffect } from 'react';
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase"

import {EventInfo} from "../data/schedule"

interface EventDetails {
    info: EventInfo
}

interface EventDetailsProps {
    eventId: string
}

export default function useEventDetails(props: EventDetailsProps) {
    const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
    const eventId = props.eventId

    useEffect(() => {
        const d = doc(db, `events/${eventId}`);
        const unsubscribe = onSnapshot(d, (docSnapshot) => {
            setEventDetails({info: docSnapshot.data() as EventInfo})
        });
      return unsubscribe;
    }, []);
    return eventDetails;
  }