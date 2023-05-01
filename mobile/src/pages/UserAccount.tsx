import React, { useEffect } from 'react';
import { IonHeader, IonButton, IonInput, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonPage, IonContent, IonToolbar, IonButtons, IonMenuButton, IonTitle } from '@ionic/react';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  signInAnonymously,
  EmailAuthProvider,
  linkWithCredential
} from 'firebase/auth';
import {app} from "../firebase"
import { useState } from 'react';

interface User {
    anonymous: boolean,
    id: string,
    email: string,
    emailVerified: boolean
}

const UserAccount: React.FC = () => {
    const [email, setEmail] = useState<string>("")
    const [password, setPassword] = useState<string>("")

    const [user, setUser] = useState<User | undefined>(undefined)
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)

    const auth = getAuth(app)

    const signup = async function() {
        if (auth.currentUser) {
            // upgrade anonymous user
            const credential = EmailAuthProvider.credential(email, password);
            linkWithCredential(auth.currentUser, credential)
            .then((userCredential) => {
              const user = userCredential.user;
              console.log("Anonymous account successfully upgraded", user);
              sendEmailVerification(user)
              loadUser(user)
              setErrorMessage(undefined)
            }).catch((error) => {
                setErrorMessage(error.message)
            });          
        } else {
            createUserWithEmailAndPassword(auth, email ?? "", password ?? "")
            .then((userCredential) => {
              const user = userCredential.user;
              sendEmailVerification(user)
              setErrorMessage(undefined)
            })
            .catch((error) => {
              setUser(undefined)
              setErrorMessage(error.message)
            });
          }
    }

    const reloadUser = async function() {
        await auth.currentUser?.reload()
        loadUser(auth.currentUser ?? undefined)
    }

    const loadUser = async function(user: FirebaseUser | undefined) {
        if (user) {
            setUser({
                anonymous: !user.email, 
                id: user.uid, 
                email: user.email ?? "", 
                emailVerified: user.emailVerified
            })
        } else {
            setUser(undefined)
        }
    }

    const signin = async function() {
      signInWithEmailAndPassword(auth, email ?? "", password ?? "")
        .then((userCredential) => {
            setErrorMessage(undefined)
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            setUser(undefined)
            setErrorMessage(errorMessage)
        });
    }

    const signinAnonymously = async function() {
        signInAnonymously(auth)
          .then(() => {
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
        await signOut(auth)
        setUser(undefined)
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            loadUser(user ?? undefined)
          });
        return unsubscribe
    }, [])

    return (
      <IonPage id="account-page">
        <IonHeader>
          <IonToolbar>
              <IonButtons slot="start">
                <IonMenuButton></IonMenuButton>
              </IonButtons>
              <IonTitle>Account</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent class="ion-padding">
        {
            user && (
                <>
                <IonCard>
                <IonCardHeader>
                    <IonCardTitle>{user.anonymous && "Anonymous"} {user.email || user.id}</IonCardTitle>
                </IonCardHeader>

                <IonCardContent>
                    email verified: {user.emailVerified ? "v" : "x"}
                </IonCardContent>
                </IonCard>
                <IonButton onClick={reloadUser}>
                Check
                </IonButton>
                <IonButton onClick={signout}>
                Sign out
                </IonButton>
                </>
            )
        }
        {
            (!user || user.anonymous) && (
                <>
                <IonCard>
                <IonCardContent>
                    <IonInput label="email" type="email" value={email} onIonInput={(e: any) => setEmail(e.target.value)}></IonInput>
                    <IonInput label="password" type="password" value={password} onIonInput={(e: any) => setPassword(e.target.value)}></IonInput>
                </IonCardContent>
                </IonCard>
                    <IonButton onClick={signup}>
                        Sign up
                    </IonButton>
                    {
                    (!user && (
                        <>
                        <IonButton onClick={signin}>
                        Sign in
                        </IonButton>
                        <IonButton onClick={signinAnonymously}>
                        Anonymous Sign in
                        </IonButton>
                        </>
                    ))
                    }
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
        </IonContent>
      </IonPage>
    );
}

export default UserAccount;