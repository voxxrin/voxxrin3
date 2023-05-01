import {UserLocale} from "@/models/VoxxrinUser";


export function useCurrentUserLocale() {
    // May be overriden someday if we're not happy with this
    // (like, changing this in some preferences page...)
    return new UserLocale(navigator.language);
}
