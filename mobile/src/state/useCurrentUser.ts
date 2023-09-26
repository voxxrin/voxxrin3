import {UserLocale} from "@/models/VoxxrinUser";
import {useCurrentUser as vueFireUseCurrentUser} from "vuefire";


export function useCurrentUserLocale() {
    // May be overriden someday if we're not happy with this
    // (like, changing this in some preferences page...)
    return new UserLocale(navigator.language);
}

export const useCurrentUser = vueFireUseCurrentUser;
