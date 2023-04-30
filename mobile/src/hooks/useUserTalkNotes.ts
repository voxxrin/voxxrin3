import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase"


import {UserTalkNotes} from "../data/feedbacks"

interface UserTalkNotesProps {
    userId: string,
    eventId: string,
    talkId: string
}

export default function useUserTalkNotes(props: UserTalkNotesProps) {
    const [talkNotes, setTalkNotes] = useState<UserTalkNotes | null>(null);
    const userId = props.userId

    useEffect(() => {
        if (userId === "") {            
            return () => {}
        } else {
            const d = doc(db, `users/${userId}/events/${props.eventId}/talkNotes/${props.talkId}`);
            const unsubscribe = onSnapshot(d, (docSnapshot) => {
                setTalkNotes(docSnapshot.data() as UserTalkNotes)
            });
            return unsubscribe;
        }
    }, [props.userId, props.eventId, props.talkId]);

    const updateTalkNotes = async function(changeFn: (notes: UserTalkNotes) => void) {
        if (userId === "") {
            console.log("cant update favorites without user id")            
            return
        }
        const notes = JSON.parse(JSON.stringify(talkNotes ?? {
            talkId: props.talkId,
            isFavorite: false,
            ratings: {}        
        } as UserTalkNotes)) as UserTalkNotes
        changeFn(notes)
        setDoc(doc(db, `users/${userId}/events/${props.eventId}/talkNotes/${props.talkId}`), notes).then(() => {
            console.log(`updated user talk notes on firestore for ${props.eventId} - ${props.talkId}`)
        })
        setTalkNotes(notes)
    }

    return {talkNotes, updateTalkNotes};
  }