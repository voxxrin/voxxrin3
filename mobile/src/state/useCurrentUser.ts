import {toVoxxrinUser, UserLocale} from "@/models/VoxxrinUser";
import {useCurrentUser as vueFireUseCurrentUser} from "vuefire";
import {computed, toValue} from "vue";
import {db} from "@/state/firebase";
import {deferredVuefireUseDocument} from "@/views/vue-utils";
import {doc, DocumentReference} from "firebase/firestore";
import {User} from "@shared/user.firestore";


export function useCurrentUserLocale() {
    // May be overriden someday if we're not happy with this
    // (like, changing this in some preferences page...)
    return new UserLocale(navigator.language);
}

export const useCurrentUser = vueFireUseCurrentUser;

export function useFirestoreUser() {
  const userRef = useCurrentUser()

  const firestoreUserRef = deferredVuefireUseDocument([userRef],
    ([user]) => {
      if(!user) {
        return undefined;
      }

      return doc(db, `users/${user.uid}`) as DocumentReference<User>
    })

  return {
    userRef: computed(() => {
      const firestoreUser = toValue(firestoreUserRef);
      if(!firestoreUser) {
        return undefined;
      }

      return toVoxxrinUser(firestoreUser);
    })
  }
}
