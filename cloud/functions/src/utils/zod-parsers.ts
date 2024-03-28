import {z, ZodLiteral} from "zod";
import {ISODatetime} from "../../../../shared/type-utils";

export const ISO_DATETIME_PARSER = z.string().regex(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|(?:[+-]\d{2}:\d{2}))/gi) as unknown as ZodLiteral<ISODatetime>
