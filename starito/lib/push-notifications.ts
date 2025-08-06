export const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export const subscribeToPushNotifications = async (): Promise<PushSubscription | null> => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push messaging is not supported')
    return null
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    console.warn('Notification permission denied')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HI8ToeysEoYo1eE1mGd8Y5TCPA4sX-6gqL2IiNu6xPO3jv6_xZAyE-a_zg'
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    })

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription)
    })

    return subscription
  } catch (error) {
    console.error('Error subscribing to push notifications:', error)
    return null
  }
}

export const sendPushNotification = async (data: {
  title: string
  body: string
  taskId: string
  kidId: string
  url?: string
}) => {
  try {
    const response = await fetch('/api/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error('Failed to send push notification')
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending push notification:', error)
    throw error
  }
}