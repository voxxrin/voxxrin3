import { useState, useEffect } from 'react';
import { doc, onSnapshot, query, collection, where } from "firebase/firestore";
import { db } from "../firebase"

import {DayTalksStats, TalkStats} from "../../../shared/models/feedbacks"

interface TalkStatsProps {
    eventId: string,
    day?: string
}

export default function useTalkStats(props: TalkStatsProps) {
    const [talkStats, setTalkStats] = useState<DayTalksStats | undefined>(undefined);

    useEffect(() => {
        if (props.day != null) {
            const q = query(collection(db, `events/${props.eventId}/days/${props.day}/talksStats`), where("id", "!=", "all"));
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const stats = querySnapshot.docs.map((d) => {
                    return d.data() as TalkStats
                })
                setTalkStats({day: props.day!!, stats: stats})
            });
            return unsubscribe;
        } else {
            return () => {}
        }
    }, [props.eventId, props.day]);
    return talkStats;
  }