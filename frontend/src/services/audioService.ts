import { Howl } from 'howler'
import { AUDIO_FILES } from '@/utils/constants'

class AudioService {
  private sounds: Map<string, Howl> = new Map()
  private isEnabled = true
  private volume = 0.7

  initialize() {
    // Load audio settings from localStorage
    const settings = this.loadSettings()
    this.isEnabled = settings.enabled
    this.volume = settings.volume

    // Preload essential sounds
    this.preloadSounds()
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem('chess_v4_audio_settings')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.warn('Failed to load audio settings:', error)
    }

    return {
      enabled: true,
      volume: 0.7,
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem('chess_v4_audio_settings', JSON.stringify({
        enabled: this.isEnabled,
        volume: this.volume,
      }))
    } catch (error) {
      console.warn('Failed to save audio settings:', error)
    }
  }

  private preloadSounds() {
    // Only preload if audio is enabled
    if (!this.isEnabled) return

    Object.entries(AUDIO_FILES).forEach(([key, src]) => {
      try {
        const sound = new Howl({
          src: [src],
          volume: this.volume,
          preload: true,
          html5: true, // Use HTML5 Audio for better mobile support
          onloaderror: (id, error) => {
            console.warn(`Failed to load sound ${key}:`, error)
          }
        })
        this.sounds.set(key.toLowerCase(), sound)
      } catch (error) {
        console.warn(`Failed to create sound ${key}:`, error)
      }
    })
  }

  private getSound(soundKey: string): Howl | null {
    const sound = this.sounds.get(soundKey.toLowerCase())
    if (!sound) {
      console.warn(`Sound not found: ${soundKey}`)
      return null
    }
    return sound
  }

  // Public methods
  playMove() {
    if (!this.isEnabled) return
    const sound = this.getSound('move')
    sound?.play()
  }

  playCapture() {
    if (!this.isEnabled) return
    const sound = this.getSound('capture')
    sound?.play()
  }

  playCheck() {
    if (!this.isEnabled) return
    const sound = this.getSound('check')
    sound?.play()
  }

  playCheckmate() {
    if (!this.isEnabled) return
    const sound = this.getSound('checkmate')
    sound?.play()
  }

  playDraw() {
    if (!this.isEnabled) return
    const sound = this.getSound('draw')
    sound?.play()
  }

  playNotification() {
    if (!this.isEnabled) return
    const sound = this.getSound('notification')
    sound?.play()
  }

  playVictory() {
    if (!this.isEnabled) return
    const sound = this.getSound('victory')
    sound?.play()
  }

  playDefeat() {
    if (!this.isEnabled) return
    const sound = this.getSound('defeat')
    sound?.play()
  }

  // Settings methods
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
    this.saveSettings()

    if (enabled && this.sounds.size === 0) {
      // Preload sounds if they weren't loaded before
      this.preloadSounds()
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume)) // Clamp between 0 and 1
    this.saveSettings()

    // Update volume for all loaded sounds
    this.sounds.forEach(sound => {
      sound.volume(this.volume)
    })
  }

  getEnabled(): boolean {
    return this.isEnabled
  }

  getVolume(): number {
    return this.volume
  }

  // Utility methods
  stopAll() {
    this.sounds.forEach(sound => {
      sound.stop()
    })
  }

  unload() {
    this.sounds.forEach(sound => {
      sound.unload()
    })
    this.sounds.clear()
  }

  // Context-aware sound playing
  playMoveSound(isCapture: boolean, isCheck: boolean, isCheckmate: boolean) {
    if (isCheckmate) {
      this.playCheckmate()
    } else if (isCheck) {
      this.playCheck()
    } else if (isCapture) {
      this.playCapture()
    } else {
      this.playMove()
    }
  }

  playGameEndSound(result: 'victory' | 'defeat' | 'draw') {
    switch (result) {
      case 'victory':
        this.playVictory()
        break
      case 'defeat':
        this.playDefeat()
        break
      case 'draw':
        this.playDraw()
        break
    }
  }
}

export const audioService = new AudioService()