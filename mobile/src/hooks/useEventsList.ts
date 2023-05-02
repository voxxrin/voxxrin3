import { useState, useEffect } from 'react';
import { onSnapshot, query, collection, where } from "firebase/firestore";
import { db } from "../firebase"

import {EventInfo} from "../models/schedule"

export default function useEventsList() {
    const [eventsList, setEventsList] = useState<EventInfo[]>([]);

    useEffect(() => {
        const q = query(collection(db, "events"), where("id", "!=", "none"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            setEventsList(querySnapshot.docs.map((d) => {
                return d.data() as EventInfo
            }))
        });
      return unsubscribe;
    }, []);
    return eventsList;
  }