import {getAllEventsDocs} from "../services/event-utils";
import {db} from "../../../firebase";
import {getEventTalks} from "../services/talk-utils";
import {detailedTalksToSpeakersLineup} from "../../../models/Event";


export async function introduceEventSpeakersAndFixTalkUndefinedTags(): Promise<"OK"|"Error"> {
  const eventDocs = await getAllEventsDocs({includePrivateSpaces: true})
  await Promise.all([
    ...eventDocs.map(async eventDoc => {
      try {
        const eventTalks = await getEventTalks(eventDoc.ref, eventDoc.id);

        // Migrating event talks with empty tags in it
        const migratedEventTalks = await Promise.all(eventTalks.map(async eventTalk => {
          if(!eventTalk.tags) {
            await db.doc(`${eventDoc.ref.path}/talks/${eventTalk.id}`).update("tags", [])
            return {
              ...eventTalk,
              tags: []
            };
          } else {
            return eventTalk;
          }
        }))

        const lineupSpeakers = detailedTalksToSpeakersLineup(migratedEventTalks);

        const eventSpeakersColl = db.collection(`${eventDoc.ref.path}/speakers`)
        const existingSpeakerDocs = await eventSpeakersColl.listDocuments()

        // delete all then re-create all
        await Promise.all(existingSpeakerDocs.map(speakerDoc => speakerDoc.delete()))
        await Promise.all(lineupSpeakers.map(lineupSpeaker => db.doc(`${eventDoc.ref.path}/speakers/${lineupSpeaker.id}`).set(lineupSpeaker)))
        console.log(`${lineupSpeakers.length} event speakers created for event id ${eventDoc.id}`)
      } catch (err) {
        console.error(`Error during Event speaker creation for ${eventDoc.id}: ${err}`)
      }
    }),
  ])

  return "OK"
}
