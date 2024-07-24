import {getAllEventDescriptorDocs} from "../services/eventDescriptor-utils";
import {getAllEvents} from "../services/event-utils";


export async function introduceEventVisibility(): Promise<"OK"|"Error"> {
  const eventsSnapshots = await getAllEvents()
  const eventDescriptorsDocs = await getAllEventDescriptorDocs();
  await Promise.all([
    ...eventsSnapshots.docs.map(async eventSnaphsot => {
      await eventSnaphsot.ref.update({
        visibility: "public"
      })
    }),
    ...eventDescriptorsDocs.map(async eventDescriptorDoc => {
      await eventDescriptorDoc.ref.update({
        visibility: "public"
      })
    })
  ])

  return "OK"
}
