

export class ValueObject<T> {
    constructor(readonly value: T) {}

    isSameThan<VO extends ValueObject<T>>(other: VO) {
        return this.value === other.value;
    }
}


export type Replace<T, REPLACEMENT> = Omit<T, keyof REPLACEMENT> & REPLACEMENT;
