import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../firebase';

export default function useUserId() {
    const [userId, setUserId] = useState<string | undefined>(undefined)

    useEffect(() => {
        const auth = getAuth(app)
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUserId(user?.uid ?? undefined)
        });
        return unsubscribe
    }, [])

    return userId
}