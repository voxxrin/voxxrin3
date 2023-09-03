import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {createVoxxrinDetailedTalkFromFirestore, TalkId} from "@/models/VoxxrinTalk";
import {collection, doc, DocumentReference, getDoc} from "firebase/firestore";
import {db} from "@/state/firebase";
import {DetailedTalk} from "../../../shared/daily-schedule.firestore";

export async function fetchTalkDetails(confDescriptor: VoxxrinConferenceDescriptor, talkId: TalkId) {
    const detailedTalkSource = doc(collection(doc(collection(db, 'events'), confDescriptor.id.value), 'talks'), talkId.value) as DocumentReference<DetailedTalk>
    const detailedTalk = (await getDoc(detailedTalkSource)).data();
    if(!detailedTalk) {
        return undefined;
    }

    return createVoxxrinDetailedTalkFromFirestore(confDescriptor, detailedTalk);
}
