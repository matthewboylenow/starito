import { OfflineAction } from './types'

class OfflineManager {
  private static instance: OfflineManager
  private queue: OfflineAction[] = []
  private syncInProgress = false
  
  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager()
    }
    return OfflineManager.instance
  }
  
  constructor() {
    this.loadQueueFromStorage()
    this.setupNetworkListeners()
  }
  
  private loadQueueFromStorage(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('starito_offline_queue')
      if (stored) {
        try {
          this.queue = JSON.parse(stored)
        } catch (error) {
          console.error('Failed to load offline queue:', error)
          this.queue = []
        }
      }
    }
  }
  
  private saveQueueToStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('starito_offline_queue', JSON.stringify(this.queue))
    }
  }
  
  private setupNetworkListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('📶 Back online - syncing queued actions')
        this.syncQueue()
      })
      
      window.addEventListener('offline', () => {
        console.log('📵 Gone offline - queueing actions')
      })
    }
  }
  
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true
  }
  
  addAction(type: OfflineAction['type'], payload: any): string {
    const action: OfflineAction = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: new Date().toISOString(),
      synced: false
    }
    
    this.queue.push(action)
    this.saveQueueToStorage()
    
    console.log('📦 Action queued for offline sync:', action)
    
    // Try to sync immediately if online
    if (this.isOnline()) {
      this.syncQueue()
    }
    
    return action.id
  }
  
  async syncQueue(): Promise<void> {
    if (this.syncInProgress || this.queue.length === 0 || !this.isOnline()) {
      return
    }
    
    this.syncInProgress = true
    
    try {
      const unsyncedActions = this.queue.filter(action => !action.synced)
      console.log(`🔄 Syncing ${unsyncedActions.length} offline actions`)
      
      for (const action of unsyncedActions) {
        try {
          await this.syncAction(action)
          action.synced = true
          console.log('✅ Synced action:', action.id)
        } catch (error) {
          console.error('❌ Failed to sync action:', action.id, error)
          // Keep unsynced actions in queue for retry
        }
      }
      
      // Remove synced actions
      this.queue = this.queue.filter(action => !action.synced)
      this.saveQueueToStorage()
      
    } finally {
      this.syncInProgress = false
    }
  }
  
  private async syncAction(action: OfflineAction): Promise<void> {
    switch (action.type) {
      case 'task_complete':
        await this.syncTaskComplete(action.payload)
        break
      case 'task_submit':
        await this.syncTaskSubmit(action.payload)
        break
      case 'photo_upload':
        await this.syncPhotoUpload(action.payload)
        break
      case 'voice_note':
        await this.syncVoiceNote(action.payload)
        break
      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }
  }
  
  private async syncTaskComplete(payload: any): Promise<void> {
    const response = await fetch('/api/submit-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      throw new Error(`Task complete sync failed: ${response.statusText}`)
    }
  }
  
  private async syncTaskSubmit(payload: any): Promise<void> {
    const response = await fetch('/api/submit-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      throw new Error(`Task submit sync failed: ${response.statusText}`)
    }
  }
  
  private async syncPhotoUpload(payload: any): Promise<void> {
    // Convert base64 back to FormData for sync
    const formData = new FormData()
    formData.append('taskId', payload.taskId)
    formData.append('notes', payload.notes || '')
    
    // Convert base64 back to blob
    const response = await fetch(payload.photoDataUrl)
    const blob = await response.blob()
    formData.append('photo', blob, 'offline_photo.jpg')
    
    const uploadResponse = await fetch('/api/upload-photo', {
      method: 'POST',
      body: formData
    })
    
    if (!uploadResponse.ok) {
      throw new Error(`Photo upload sync failed: ${uploadResponse.statusText}`)
    }
  }
  
  private async syncVoiceNote(payload: any): Promise<void> {
    const formData = new FormData()
    formData.append('userId', payload.userId)
    formData.append('taskId', payload.taskId || '')
    formData.append('noteType', payload.noteType)
    formData.append('transcription', payload.transcription || '')
    
    // Convert base64 back to blob
    const response = await fetch(payload.audioDataUrl)
    const blob = await response.blob()
    formData.append('audio', blob, 'offline_voice_note.wav')
    
    const uploadResponse = await fetch('/api/voice-notes', {
      method: 'POST',
      body: formData
    })
    
    if (!uploadResponse.ok) {
      throw new Error(`Voice note sync failed: ${uploadResponse.statusText}`)
    }
  }
  
  getQueueSize(): number {
    return this.queue.filter(action => !action.synced).length
  }
  
  clearQueue(): void {
    this.queue = []
    this.saveQueueToStorage()
  }
  
  // Helper methods for common offline actions
  async completeTaskOffline(taskId: string, photoUrl?: string, notes?: string): Promise<string> {
    return this.addAction('task_complete', {
      taskId,
      photoUrl,
      notes,
      timestamp: new Date().toISOString()
    })
  }
  
  async uploadPhotoOffline(taskId: string, photoFile: File, notes?: string): Promise<string> {
    // Convert to base64 for storage
    const reader = new FileReader()
    const photoDataUrl = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(photoFile)
    })
    
    return this.addAction('photo_upload', {
      taskId,
      photoDataUrl,
      notes,
      fileName: photoFile.name,
      fileSize: photoFile.size
    })
  }
  
  async recordVoiceNoteOffline(userId: string, audioBlob: Blob, noteType: string, taskId?: string, transcription?: string): Promise<string> {
    // Convert to base64 for storage
    const reader = new FileReader()
    const audioDataUrl = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(audioBlob)
    })
    
    return this.addAction('voice_note', {
      userId,
      taskId,
      noteType,
      transcription,
      audioDataUrl,
      duration: 0 // Will be calculated on sync
    })
  }
}

export const offlineManager = OfflineManager.getInstance()