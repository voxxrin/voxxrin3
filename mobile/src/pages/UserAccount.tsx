import React from 'react';
import { IonHeader, IonButton, IonInput, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut
} from 'firebase/auth';
import { useState } from 'react';

interface User {
    email: string,
    emailVerified: boolean
}

const UserAccount: React.FC = () => {
    const [email, setEmail] = useState<string>("")
    const [password, setPassword] = useState<string>("")

    const [user, setUser] = useState<User | undefined>(undefined)
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)

    const signup = async function() {
      const auth = await getAuth()
      createUserWithEmailAndPassword(auth, email ?? "", password ?? "")
          .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;
            sendEmailVerification(user)
            setUser({email: user.email ?? "", emailVerified: user.emailVerified})
            setErrorMessage(undefined)
          })
          .catch((error) => {
            setUser(undefined)
            setErrorMessage(error.message)
          });
    }

    const checkEmailVerified = async function() {
        const auth = await getAuth()
        await auth.currentUser?.reload()
        const user = auth.currentUser ?? undefined
        if (user) {
            setUser({email: user.email ?? "", emailVerified: user.emailVerified})
        } else {
            setUser(undefined)
        }
    }

    const signin = async function() {
      const auth = await getAuth()
      signInWithEmailAndPassword(auth, email ?? "", password ?? "")
        .then((userCredential) => {
            const user = userCredential.user
            setUser({email: user.email ?? "", emailVerified: user.emailVerified})
            setErrorMessage(undefined)
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            setUser(undefined)
            setErrorMessage(errorMessage)
        });
    }

    const signout = async function() {
        const auth = await getAuth()
        await signOut(auth)
        setUser(undefined)
    }

    return (
      <>
      <IonHeader>
        {
            !user && (
                <>
                    <IonInput label="email" type="email" value={email} onIonInput={(e: any) => setEmail(e.target.value)}></IonInput>
                    <IonInput label="password" type="password" value={password} onIonInput={(e: any) => setPassword(e.target.value)}></IonInput>
                    <IonButton onClick={signup}>
                    Sign up
                    </IonButton>
                    <IonButton onClick={signin}>
                    Sign in
                    </IonButton>
                </>
            )                
        }
        {
            user && (
                <>
                <IonCard>
                <IonCardHeader>
                    <IonCardTitle>{user.email}</IonCardTitle>
                </IonCardHeader>

                <IonCardContent>
                    email verified: {user.emailVerified ? "v" : "x"}
                </IonCardContent>
                </IonCard>
                <IonButton onClick={checkEmailVerified}>
                Check
                </IonButton>
                <IonButton onClick={signout}>
                Sign out
                </IonButton>
                </>
            )
        }
        {
            errorMessage && (
                <IonCard color="danger">
                    <IonCardHeader>
                    <IonCardTitle>ERROR</IonCardTitle>
                    </IonCardHeader>

                    <IonCardContent>
                    {errorMessage}
                    </IonCardContent>
                </IonCard>
            )
        }        
      </IonHeader>
        </>
    );
}

export default UserAccount;