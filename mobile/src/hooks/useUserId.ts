import { useState, useEffect } from 'react';
import { Device } from '@capacitor/device';

export default function useUserId() {
    const [userId, setUserId] = useState("")

    useEffect(() => {
        var enabled = true
        Device.getId().then((id) => {
            if (enabled) {
                setUserId(id.uuid)
            }            
        })
        return () => { enabled = false }
    }, [])

    return userId
}