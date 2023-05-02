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
