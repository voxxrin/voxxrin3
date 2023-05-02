import {ValueObject} from "@/models/utils";
import {Replace} from "@/models/type-utils";
import {ConferenceDescriptor} from "../../../shared/conference-descriptor.firestore";

export class TalkFormatId extends ValueObject<string>{ _talkFormatIdClassDiscriminator!: never; }
export type VoxxrinTalkFormat = Replace<ConferenceDescriptor['talkFormats'][number], {id: TalkFormatId}>
