import {getAllEventDescriptorDocs} from "../services/eventDescriptor-utils";
import {getAllEventsDocs} from "../services/event-utils";


export async function introduceEventVisibility(): Promise<"OK"|"Error"> {
  const eventDocs = await getAllEventsDocs()
  const eventDescriptorsDocs = await getAllEventDescriptorDocs();
  await Promise.all([
    ...eventDocs.map(async eventSnaphsot => {
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
