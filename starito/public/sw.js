const CACHE_NAME = 'starito-v1'
const urlsToCache = [
  '/',
  '/login',
  '/kid',
  '/parent',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache)
      })
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response
        }
        return fetch(event.request)
      })
  )
})

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  
  const options = {
    body: data.body || 'A task has been completed!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: data.tag || 'task-completed',
    requireInteraction: true,
    actions: [
      {
        action: 'approve',
        title: '✅ Approve',
        icon: '/icons/approve.png'
      },
      {
        action: 'view',
        title: '👀 View Details',
        icon: '/icons/view.png'
      }
    ],
    data: {
      taskId: data.taskId,
      kidId: data.kidId,
      url: data.url || '/parent'
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Task Completed!', options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'approve') {
    event.waitUntil(
      fetch('/api/tasks/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: event.notification.data.taskId,
          kidId: event.notification.data.kidId
        })
      }).then(() => {
        return clients.openWindow('/parent')
      })
    )
  } else if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    )
  } else {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    )
  }
})