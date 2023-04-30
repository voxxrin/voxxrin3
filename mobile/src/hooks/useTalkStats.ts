import { useState, useEffect } from 'react';
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase"

import {DayTalksStats} from "../data/feedbacks"

interface TalkStatsProps {
    eventId: string,
    day?: string
}

export default function useTalkStats(props: TalkStatsProps) {
    const [talkStats, setTalkStats] = useState<DayTalksStats | undefined>(undefined);

    useEffect(() => {
        if (props.day != null) {
            const d = doc(db, `events/${props.eventId}/days/${props.day}/talksStats/all`);
            const unsubscribe = onSnapshot(d, (docSnapshot) => {
                setTalkStats(docSnapshot.data() as DayTalksStats)
            });
            return unsubscribe;
        } else {
            return () => {}
        }
    }, [props.eventId, props.day]);
    return talkStats;
  }