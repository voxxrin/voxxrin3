import {ValueObject} from "@/models/utils";
import {ConferenceDescriptor} from "../../../shared/conference-descriptor.firestore";
import {Replace} from "../../../shared/type-utils";

export class TalkFormatId extends ValueObject<string>{ _talkFormatIdClassDiscriminator!: never; }
export type VoxxrinTalkFormat = Replace<ConferenceDescriptor['talkFormats'][number], {
    id: TalkFormatId,
    hmmDuration: string
}>
