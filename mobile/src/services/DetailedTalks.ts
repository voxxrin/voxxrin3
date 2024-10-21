import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {createVoxxrinDetailedTalkFromFirestore, TalkId} from "@/models/VoxxrinTalk";
import {doc, DocumentReference, getDoc} from "firebase/firestore";
import {db} from "@/state/firebase";
import {DetailedTalk} from "../../../shared/daily-schedule.firestore";
import {resolvedEventFirestorePath} from "../../../shared/utilities/event-utils";

export async function fetchTalkDetails(confDescriptor: VoxxrinConferenceDescriptor, talkId: TalkId) {
    const detailedTalkSource = doc(
      db,
      `${resolvedEventFirestorePath(confDescriptor.id.value, confDescriptor.spaceToken?.value)}/talks/${talkId.value}`
    ) as DocumentReference<DetailedTalk>

    const detailedTalk = (await getDoc(detailedTalkSource)).data();
    if(!detailedTalk) {
        return undefined;
    }

    return createVoxxrinDetailedTalkFromFirestore(confDescriptor, detailedTalk);
}
