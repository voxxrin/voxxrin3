import {getAllEventDescriptorDocs} from "../services/eventDescriptor-utils";
import {getAllEvents} from "../services/event-utils";


export async function introduceEventVisibility(): Promise<"OK"|"Error"> {
  const queryResults = await getAllEvents()
  const eventDescriptorsDocs = await getAllEventDescriptorDocs();
  await Promise.all([
    ...queryResults.flatMap(queryResults => queryResults.docs.map(async eventSnaphsot => {
      await eventSnaphsot.ref.update({
        visibility: "public"
      })
    })),
    ...eventDescriptorsDocs.map(async eventDescriptorDoc => {
      await eventDescriptorDoc.ref.update({
        visibility: "public"
      })
    })
  ])

  return "OK"
}
