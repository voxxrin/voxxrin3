import {ValueObject} from "@/models/utils";
import {TalkFormat} from "../../../shared/dayly-schedule.firestore";
import {Replace} from "@/models/type-utils";

export class TalkFormatId extends ValueObject<string>{ _talkFormatIdClassDiscriminator!: never; }
export type VoxxrinTalkFormat = Replace<TalkFormat, {id: TalkFormatId}>
