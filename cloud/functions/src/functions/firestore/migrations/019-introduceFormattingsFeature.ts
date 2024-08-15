import {db} from "../../../firebase";
import {getAllEvents} from "../services/event-utils";
import {getEventDescriptor} from "../services/eventDescriptor-utils";


export async function introduceFormattingsFeature(): Promise<"OK"|"Error"> {
  const events = await getAllEvents();
  await Promise.all(
    events.map(async event => {
        const spaceToken = undefined;
        const eventDescriptor = await getEventDescriptor(spaceToken, event.id);

        if(!eventDescriptor.formattings) {
          eventDescriptor.formattings = {
            talkFormatTitle: 'with-duration',
        parseMarkdownOn: [],
      }

          await db.doc(`events/${event.id}/event-descriptor/self`).update(eventDescriptor);
        }
    })
  )

  return "OK"
}
