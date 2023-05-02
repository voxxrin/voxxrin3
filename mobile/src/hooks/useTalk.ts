import { useState, useEffect } from 'react';
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase"

import { Talk } from '../../../shared/models/schedule';

export default function useTalk(eventId: string, talkId: string) {
    const [talk, setTalk] = useState<Talk | undefined>(undefined);

    useEffect(() => {
        const d = doc(db, `/events/${eventId}/talks/${talkId}`);
        const unsubscribe = onSnapshot(d, (docSnapshot) => {
            setTalk(docSnapshot.data() as Talk)
        });
        return unsubscribe;
    }, [eventId, talkId]);
    return talk;
  }