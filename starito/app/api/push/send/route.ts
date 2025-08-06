import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:admin@starito.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HI8ToeysEoYo1eE1mGd8Y5TCPA4sX-6gqL2IiNu6xPO3jv6_xZAyE-a_zg',
  process.env.VAPID_PRIVATE_KEY || 'q1dXpw3UpT5vo4M4xWWfvwZPDMlVBKFzr5d9DXNf9B8'
)

export async function POST(request: NextRequest) {
  try {
    const { title, body, taskId, kidId, url } = await request.json()
    
    const payload = JSON.stringify({
      title,
      body,
      taskId,
      kidId,
      url: url || '/parent',
      tag: 'task-completed'
    })

    const subscriptions = [
      {
        endpoint: 'https://fcm.googleapis.com/fcm/send/demo',
        keys: {
          p256dh: 'demo-key',
          auth: 'demo-auth'
        }
      }
    ]

    const results = await Promise.allSettled(
      subscriptions.map(subscription =>
        webpush.sendNotification(subscription, payload)
      )
    )

    console.log('Push notification results:', results)

    return NextResponse.json({ 
      success: true, 
      sent: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length
    })
  } catch (error) {
    console.error('Error sending push notification:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}