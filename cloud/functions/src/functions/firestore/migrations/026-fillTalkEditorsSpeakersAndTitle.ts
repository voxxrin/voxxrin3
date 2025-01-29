import {getAllEvents, getMaybeSpaceTokenOf} from "../services/event-utils";
import {getEventTalks} from "../services/talk-utils";
import {getSecretTokenRef} from "../firestore-utils";
import {ConferenceOrganizerSpace} from "../../../../../../shared/conference-organizer-space.firestore";
import {resolvedEventFirestorePath} from "../../../../../../shared/utilities/event-utils";
import {match, P} from "ts-pattern";
import {v4 as uuidv4} from "uuid";

export async function fillTalkEditorsSpeakersAndTitle(): Promise<"OK"|"Error"> {
  const events = await getAllEvents({ includePrivateSpaces: true });
  await Promise.all(events.map(async event => {
    const maybeSpaceToken = getMaybeSpaceTokenOf(event);
    const [ organizerSpaceRef, eventTalks ] = await Promise.all([
      getSecretTokenRef<ConferenceOrganizerSpace>(`${resolvedEventFirestorePath(event.id, maybeSpaceToken)}/organizer-space`),
      getEventTalks(maybeSpaceToken, event.id),
    ])

    const maybeOrganizerSpace = (await organizerSpaceRef.get()).data();

    const organizerSpace = match(maybeOrganizerSpace)
      .with(P.nullish, () => {
        const organizerSpace: ConferenceOrganizerSpace = {
          organizerSecretToken: uuidv4(),
          talkFeedbackViewerTokens: eventTalks.map(talk => ({
            eventId: event.id,
            talkId: talk.id,
            talkTitle: talk.title,
            speakersFullNames: talk.speakers.map(sp => sp.fullName),
            secretToken: uuidv4(),
          }))
        };

        return organizerSpace;
      }).otherwise(organizerSpace => {
        eventTalks.forEach(talk => {
          organizerSpace.talkFeedbackViewerTokens = organizerSpace.talkFeedbackViewerTokens || [];

          const talkFeedbackViewerToken = organizerSpace.talkFeedbackViewerTokens.find(tfvt => tfvt.talkId === talk.id);
          if(talkFeedbackViewerToken) {
            talkFeedbackViewerToken.talkTitle = talk.title;
            talkFeedbackViewerToken.speakersFullNames = talk.speakers.map(sp => sp.fullName);
          } else {
            organizerSpace.talkFeedbackViewerTokens.push({
              eventId: event.id,
              talkId: talk.id,
              talkTitle: talk.title,
              speakersFullNames: talk.speakers.map(sp => sp.fullName),
              secretToken: uuidv4(),
            })
          }
        })

        return organizerSpace;
      })

    await organizerSpaceRef.set(organizerSpace);
  }))

  return "OK";
}
