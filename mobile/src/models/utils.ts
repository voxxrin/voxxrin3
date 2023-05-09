import {Temporal} from 'temporal-polyfill'
import {match, P} from "ts-pattern";

export class ValueObject<T> {
    constructor(readonly value: T) {}

    isSameThan<VO extends ValueObject<T>>(other: VO|undefined) {
        if(other === undefined) {
            return false;
        }

        return this.value === other.value;
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
