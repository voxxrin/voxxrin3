import {db} from "../../../firebase";
import {getAllEvents} from "../services/event-utils";
import {getEventDescriptor} from "../services/eventDescriptor-utils";


export async function introduceFormattingsFeature(): Promise<"OK"|"Error"> {
  const events = await getAllEvents();
  await Promise.all(events.docs.map(async eventDoc => {
    const event = eventDoc.data()
    const eventDescriptor = await getEventDescriptor(event.id);

    if(!eventDescriptor.formattings) {
      eventDescriptor.formattings = {
        talkFormatTitle: 'with-duration',
        parseMarkdownOn: [],
      }

      await db.doc(`events/${event.id}/event-descriptor/self`).update(eventDescriptor);
    }
  }))

  return "OK"
}
