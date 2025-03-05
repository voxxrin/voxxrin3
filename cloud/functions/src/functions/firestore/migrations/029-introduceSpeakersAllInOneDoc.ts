import {createAllSpeakers, getAllEventsDocs} from "../services/event-utils";
import {getEventTalks} from "../services/talk-utils";

export async function introduceSpeakersAllInOneDoc(): Promise<"OK"|"Error"> {
  const eventDocs = await getAllEventsDocs({includePrivateSpaces: true})
  await Promise.all([
    ...eventDocs.map(async eventDoc => {
      try {
        const eventTalks = await getEventTalks(eventDoc.ref, eventDoc.id);

        const event = eventDoc.data();
        const { createdSpeakers } = await createAllSpeakers(eventTalks, event.visibility === 'private' ? event.spaceToken : undefined, event.id);
        console.log(`${createdSpeakers.length} event speakers re-created for event id ${eventDoc.id}`)
      } catch (err) {
        console.error(`Error during Event speaker reset for ${eventDoc.id}: ${err}`)
      }
    }),
  ])

  return "OK"
}
