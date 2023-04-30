import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase"


import {UserDayTalksNotes, UserTalkNotes} from "../data/feedbacks"

interface UserTalkNotesProps {
    userId: string,
    eventId: string,
    day?: string
}

export default function useUserTalkNotes(props: UserTalkNotesProps) {
    const [talksNotes, setTalksNotes] = useState<UserDayTalksNotes | undefined>(undefined);
    const userId = props.userId

    useEffect(() => {
        if (userId === "" || props.day == null) {            
            return () => {}
        } else {
            const d = doc(db, `users/${userId}/events/${props.eventId}/talksNotes/${props.day}`);
            const unsubscribe = onSnapshot(d, (docSnapshot) => {
                setTalksNotes(docSnapshot.data() as UserDayTalksNotes)
            });
            return unsubscribe;
        }
    }, [props.userId, props.eventId, props.day]);

    const updateTalkNotes = async function(talkId: string, changeFn: (notes: UserTalkNotes) => void) {
        if (userId === "") {
            console.log("cant update favorites without user id")            
            return
        }
        const notes = JSON.parse(JSON.stringify(talksNotes ?? {userId: userId, day: props.day, notes: []})) as UserDayTalksNotes

        let talkNotes = notes.notes.find((n) => {return n.talkId == talkId}) 
        if (talkNotes == null) {
            talkNotes = { talkId: talkId, isFavorite: false, ratings: {} } as UserTalkNotes
            notes.notes.push(talkNotes)
        }
        changeFn(talkNotes)
        setDoc(doc(db, `users/${userId}/events/${props.eventId}/talksNotes/${props.day}`), notes).then(() => {
            console.log(`updated user talk notes on firestore for ${props.eventId} - ${talkId}`)
        })
        setTalksNotes(notes)
    }

    return {talksNotes, updateTalkNotes};
  }