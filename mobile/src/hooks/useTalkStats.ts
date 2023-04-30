import { useState, useEffect } from 'react';
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase"

import {TalkStats} from "../data/feedbacks"

interface TalkStatsProps {
    eventId: string,
    talkId: string
}

export default function useTalkStats(props: TalkStatsProps) {
    const [talkStats, setTalkStats] = useState<TalkStats | null>(null);

    useEffect(() => {
        const d = doc(db, `events/${props.eventId}/talkStats/${props.talkId}`);
        const unsubscribe = onSnapshot(d, (docSnapshot) => {
            setTalkStats(docSnapshot.data() as TalkStats)
        });
        return unsubscribe;
    }, [props.eventId, props.talkId]);
    return talkStats;
  }