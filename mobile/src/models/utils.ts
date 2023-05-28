import {HexColor} from "../../../shared/type-utils";

export class ValueObject<T> {
    constructor(readonly value: T) {}

    isSameThan<VO extends ValueObject<T>>(other: VO|undefined) {
        if(other === undefined) {
            return false;
        }

        return this.value === other.value;
    }

    isIncludedIntoArray<VO extends ValueObject<T>>(array: VO[]): boolean {
        return array.map(vo => vo.value).includes(this.value);
    }
}

export function sortBy<T, H extends string|number>(arr: T[], hash: (val: T) => H) {
    return arr.sort((a, b) => {
        const hashA = hash(a);
        const hashB = hash(b);
        if(typeof hashA === 'string' && typeof hashB === 'string') {
            return hashA.localeCompare(hashB);
        } else if(typeof hashA === 'number' && typeof hashB === 'number') {
            return hashA - hashB;
        } else {
            throw new Error(`Invalid type for hash comparison: [${hashA}, ${hashB}]`);
        }
    })
}

function overlap<R extends Range<T>, T>(r1: R, r2: R, comparator: (v1: T, v2: T) => number, type: 'inclusive'|'exclusive'): boolean {
    return comparator(r1.start, r2.end) <= (type==='inclusive'?0:-1)
        && comparator(r2.start, r1.end) <= (type==='inclusive'?0:-1);
}

export function hexToRGB(hexColor: HexColor): string {
    const hexValues = hexColor.substring(hexColor[0]==='#'?1:0);
    return `${parseInt(hexValues.substring(0,2), 16)}, ${parseInt(hexValues.substring(2,4), 16)}, ${parseInt(hexValues.substring(4,6), 16)}`
}
export class Range<T> {
    constructor(
        public readonly start: T,
        public readonly end: T
    ) {}
}
export class NumberRange extends Range<number> {
    constructor(start: number, end: number) {
        super(start, end);
    }

    public static overlap(r1: NumberRange, r2: NumberRange, type: 'inclusive'|'exclusive'): boolean {
        return overlap<NumberRange, number>(r1, r2, (v1, v2) => v1 - v2, type)
    }
}
export class StringRange<S extends string = string> extends Range<S> {
    constructor(start: S, end: S) {
        super(start, end);
    }

    public static overlap<S extends string = string>(r1: StringRange<S>, r2: StringRange<S>, type: 'inclusive'|'exclusive'): boolean {
        return overlap<StringRange<S>, S>(r1, r2, (v1, v2) => v1.localeCompare(v2), type)
    }
}

export class TypedCustomEvent<EVENT_TYPE extends string, D> extends CustomEvent<D> {
    constructor(eventType: EVENT_TYPE, data: D) {
        super(eventType, {detail: data});
    }
}

export type TypedCustomEventData<T> = T extends typeof TypedCustomEvent<any, infer D>?D:never;

export function createTypedCustomEventClass<D, EVENT_TYPE extends string = string>(eventType: EVENT_TYPE) {
    return class AnonymousTypedCustomEvent extends TypedCustomEvent<EVENT_TYPE, D> {
        constructor(data: D) {
            super(eventType, data);
        }
    }
}
