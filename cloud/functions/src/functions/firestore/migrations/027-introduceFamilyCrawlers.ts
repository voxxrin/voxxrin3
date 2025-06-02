import {v4 as uuidv4} from "uuid";
import {db} from "../../../firebase";
import {firestore} from "firebase-admin";
import {PublicToken} from "@shared/public-tokens";
import DocumentReference = firestore.DocumentReference;

export async function introduceFamilyCrawlers(): Promise<"OK"|"Error"> {
  const publicTokenRefs = (await db.collection("public-tokens").listDocuments()) as Array<DocumentReference<PublicToken>>;

  await Promise.all(publicTokenRefs.map(async publicTokenRef => {
    const publicToken = (await publicTokenRef.get()).data();

    if(publicToken && publicToken.type === "FamilyOrganizerToken") {
      if(!publicToken.familyCrawlers || publicToken.familyCrawlers.length !== publicToken.eventFamilies.length) {
        const familyCrawlers = await Promise.all(publicToken.eventFamilies.map(async eventFamily => {
          const eventFamilyToken = `${eventFamily}:${uuidv4()}`;

          await db.collection('family-crawlers').doc(eventFamilyToken).set({
            eventFamily,
            kind: 'devoxxians',
            url: `https://www.devoxxians.com/api/public/events/future/${eventFamily}`,
          });

          return {
            eventFamily,
            token: eventFamilyToken,
          }
        }));

        await publicTokenRef.update('familyCrawlers', familyCrawlers);
      }
    }
  }));

  return "OK";
}
