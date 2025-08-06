export interface VoiceRecorderOptions {
  onStart?: () => void
  onStop?: (audioBlob: Blob, duration: number) => void
  onError?: (error: Error) => void
  onDataAvailable?: (data: BlobEvent) => void
  maxDuration?: number // milliseconds
}

export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private stream: MediaStream | null = null
  private chunks: Blob[] = []
  private startTime: number = 0
  private options: VoiceRecorderOptions = {}

  constructor(options: VoiceRecorderOptions = {}) {
    this.options = {
      maxDuration: 60000, // 1 minute default
      ...options
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop()) // Stop immediately after permission check
      return true
    } catch (error) {
      console.error('Microphone permission denied:', error)
      return false
    }
  }

  async start(): Promise<void> {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      console.warn('Already recording')
      return
    }

    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      })

      // Create MediaRecorder
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/wav'
      ]

      let selectedMimeType = ''
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType
          break
        }
      }

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: selectedMimeType
      })

      this.chunks = []
      this.startTime = Date.now()

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data)
        }
        if (this.options.onDataAvailable) {
          this.options.onDataAvailable(event)
        }
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.chunks, { type: selectedMimeType })
        const duration = Date.now() - this.startTime
        
        if (this.options.onStop) {
          this.options.onStop(audioBlob, duration)
        }

        this.cleanup()
      }

      this.mediaRecorder.onerror = (event) => {
        const error = new Error('Recording failed')
        console.error('MediaRecorder error:', event)
        
        if (this.options.onError) {
          this.options.onError(error)
        }

        this.cleanup()
      }

      // Start recording
      this.mediaRecorder.start(250) // Collect data every 250ms

      if (this.options.onStart) {
        this.options.onStart()
      }

      // Auto-stop after max duration
      if (this.options.maxDuration) {
        setTimeout(() => {
          if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.stop()
          }
        }, this.options.maxDuration)
      }

    } catch (error) {
      const recordingError = error instanceof Error ? error : new Error('Recording initialization failed')
      
      if (this.options.onError) {
        this.options.onError(recordingError)
      }

      this.cleanup()
      throw recordingError
    }
  }

  stop(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop()
    }
  }

  pause(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause()
    }
  }

  resume(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume()
    }
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording' || false
  }

  isPaused(): boolean {
    return this.mediaRecorder?.state === 'paused' || false
  }

  getDuration(): number {
    return this.startTime > 0 ? Date.now() - this.startTime : 0
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
    this.mediaRecorder = null
    this.chunks = []
    this.startTime = 0
  }

  // Static utility methods
  static async isSupported(): Promise<boolean> {
    return !!(
      navigator.mediaDevices && 
      typeof navigator.mediaDevices.getUserMedia === 'function' && 
      typeof window.MediaRecorder !== 'undefined'
    )
  }

  static async getAudioDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices.filter(device => device.kind === 'audioinput')
    } catch (error) {
      console.error('Failed to get audio devices:', error)
      return []
    }
  }

  // Convert audio blob to base64 for offline storage
  static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // Create audio blob from base64 (for offline sync)
  static base64ToBlob(base64: string): Blob {
    const [header, data] = base64.split(',')
    const mimeType = header.match(/data:([^;]+)/)?.[1] || 'audio/webm'
    const bytes = atob(data)
    const array = new Uint8Array(bytes.length)
    
    for (let i = 0; i < bytes.length; i++) {
      array[i] = bytes.charCodeAt(i)
    }
    
    return new Blob([array], { type: mimeType })
  }
}