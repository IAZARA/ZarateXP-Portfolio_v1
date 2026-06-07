// Sound Manager Module
export class SoundManager {
    constructor() {
        this.sounds = new Map();
        this.enabled = true;
        this.volume = 0.5;
        this.soundsPath = './assets/sounds/';
        
        // Define system sounds. Only startup/shutdown are shipped as audio files;
        // the rest use short Web Audio cues so the XP feedback is consistent.
        this.systemSounds = {
            startup: { file: 'windows-xp-startup.mp3' },
            shutdown: { file: 'shutdown-custom.mp3' },
            'shutdown-custom': { file: 'shutdown-custom.mp3' },
            logon: { file: 'windows-xp-startup.mp3' },
            logoff: { file: 'shutdown-custom.mp3' },
            error: { tone: [196, 146], duration: 0.12, type: 'square' },
            warning: { tone: [392, 330], duration: 0.1, type: 'triangle' },
            information: { tone: [523, 659], duration: 0.08, type: 'sine' },
            question: { tone: [440, 587], duration: 0.09, type: 'sine' },
            maximize: { tone: [392, 523], duration: 0.075, type: 'triangle' },
            minimize: { tone: [523, 330], duration: 0.075, type: 'triangle' },
            restore: { tone: [349, 440], duration: 0.075, type: 'triangle' },
            menuOpen: { tone: [523], duration: 0.045, type: 'sine' },
            menuClose: { tone: [392], duration: 0.045, type: 'sine' },
            menuSelect: { tone: [660], duration: 0.035, type: 'sine' },
            click: { tone: [880], duration: 0.025, type: 'square' },
            hover: { tone: [740], duration: 0.018, type: 'sine' },
            recycle: { tone: [294, 392, 523], duration: 0.055, type: 'triangle' },
            empty: { tone: [220, 196], duration: 0.08, type: 'sawtooth' },
            navigate: { tone: [494], duration: 0.04, type: 'sine' },
            print: { tone: [330, 330], duration: 0.055, type: 'square' },
            screenshot: { tone: [784, 988], duration: 0.045, type: 'triangle' }
        };
    }
    
    init() {
        // Preload all system sounds
        this.preloadSounds();
        
        // Load user preferences
        this.loadPreferences();
        
        // Set up global sound handlers
        this.setupGlobalHandlers();
    }
    
    preloadSounds() {
        Object.entries(this.systemSounds).forEach(([name, config]) => {
            if (config.file) {
                const audio = new Audio(this.soundsPath + config.file);
                audio.volume = this.volume;
                audio.preload = 'auto';
                this.sounds.set(name, audio);

                audio.addEventListener('error', () => {
                    console.warn(`Failed to load sound: ${config.file}; using generated XP cue.`);
                    this.sounds.set(name, this.getFallbackTone(name));
                });
            } else {
                this.sounds.set(name, config);
            }
        });
    }
    
    loadPreferences() {
        // Load from localStorage
        const savedPrefs = localStorage.getItem('zarateXP_soundPrefs');
        if (savedPrefs) {
            try {
                const prefs = JSON.parse(savedPrefs);
                this.enabled = prefs.enabled !== false;
                this.volume = prefs.volume || 0.5;
                this.updateVolume();
            } catch (e) {
                console.error('Failed to load sound preferences:', e);
            }
        }
    }
    
    savePreferences() {
        const prefs = {
            enabled: this.enabled,
            volume: this.volume
        };
        localStorage.setItem('zarateXP_soundPrefs', JSON.stringify(prefs));
    }
    
    setupGlobalHandlers() {
        // Add click sounds to buttons
        document.addEventListener('click', (e) => {
            if (!this.enabled) return;
            
            const target = e.target;
            
            // Button clicks
            if (target.closest('button, .button')) {
                this.play('click');
            }
            
            // Menu items
            if (target.closest('.menu-item, .start-menu-item, .all-programs-item, .recently-used-item, .context-menu-item')) {
                this.play('menuSelect');
            }
            
            // Desktop icons
            if (target.closest('.desktop-icon')) {
                this.play('click');
            }
        });
        
        // Add hover sounds
        document.addEventListener('mouseover', (e) => {
            if (!this.enabled) return;
            
            const target = e.target;
            
            // Menu items hover
            if (target.closest('.menu-item, .start-menu-item, .all-programs-item, .recently-used-item, .context-menu-item')) {
                this.playQuiet('hover');
            }
        });
    }
    
    play(soundName, options = {}) {
        if (!this.enabled) return;
        
        const sound = this.sounds.get(soundName);
        if (!sound) {
            console.warn(`Sound not found: ${soundName}`);
            return;
        }

        if (!(sound instanceof HTMLAudioElement)) {
            return this.playTone(sound, options);
        }
        
        // Clone the audio to allow overlapping sounds
        const audio = sound.cloneNode();
        audio.volume = options.volume || this.volume;
        
        // Play the sound
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // Auto-play was prevented
                console.warn('Sound play prevented:', error);
            });
        }
        
        // Clean up after playing
        audio.addEventListener('ended', () => {
            audio.remove();
        });
        
        return audio;
    }

    getFallbackTone(soundName) {
        return this.systemSounds[soundName]?.tone
            ? this.systemSounds[soundName]
            : { tone: [440], duration: 0.05, type: 'sine' };
    }

    playTone(config, options = {}) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;

        if (!this.audioContext) {
            this.audioContext = new AudioContextClass();
        }

        const context = this.audioContext;
        const volume = Math.max(0, Math.min(1, options.volume ?? this.volume));
        const frequencies = Array.isArray(config.tone) ? config.tone : [config.tone || 440];
        const step = config.duration || 0.05;
        const startedAt = context.currentTime + 0.005;

        frequencies.forEach((frequency, index) => {
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            const start = startedAt + index * step;
            const end = start + step;

            oscillator.type = config.type || 'sine';
            oscillator.frequency.setValueAtTime(frequency, start);
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume * 0.08), start + 0.006);
            gain.gain.exponentialRampToValueAtTime(0.0001, end);

            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start(start);
            oscillator.stop(end + 0.01);
        });

        return { generated: true };
    }
    
    playQuiet(soundName) {
        return this.play(soundName, { volume: this.volume * 0.3 });
    }
    
    playSequence(soundNames, delay = 100) {
        if (!this.enabled) return;
        
        soundNames.forEach((soundName, index) => {
            setTimeout(() => {
                this.play(soundName);
            }, index * delay);
        });
    }
    
    stop(audio) {
        if (audio && !audio.paused) {
            audio.pause();
            audio.currentTime = 0;
        }
    }
    
    stopAll() {
        // Stop all currently playing sounds
        document.querySelectorAll('audio').forEach(audio => {
            this.stop(audio);
        });
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
        this.savePreferences();
        
        if (!enabled) {
            this.stopAll();
        }
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.updateVolume();
        this.savePreferences();
    }
    
    updateVolume() {
        this.sounds.forEach(audio => {
            audio.volume = this.volume;
        });
    }
    
    // Special sound effects
    playStartup() {
        if (!this.enabled) return;
        
        // Play the classic Windows XP startup sound
        const audio = this.play('startup');
        
        // Add visual feedback
        if (audio) {
            audio.addEventListener('playing', () => {
                document.body.classList.add('sound-playing');
            });
            
            audio.addEventListener('ended', () => {
                document.body.classList.remove('sound-playing');
            });
        }
        
        return audio;
    }
    
    playShutdown() {
        if (!this.enabled) return;
        
        // Play shutdown sound and wait for it to finish
        const audio = this.play('shutdown');
        
        return new Promise(resolve => {
            if (audio) {
                audio.addEventListener('ended', resolve);
                audio.addEventListener('error', resolve);
            } else {
                resolve();
            }
        });
    }
    
    playError() {
        if (!this.enabled) return;
        
        // Play error sound with screen shake effect
        const audio = this.play('error');
        
        // Add screen shake
        document.body.classList.add('error-shake');
        setTimeout(() => {
            document.body.classList.remove('error-shake');
        }, 500);
        
        return audio;
    }
    
    // Create sound scheme
    createSoundScheme(name, sounds) {
        const scheme = new Map();
        
        Object.entries(sounds).forEach(([soundName, filename]) => {
            const audio = new Audio(this.soundsPath + filename);
            audio.volume = this.volume;
            audio.preload = 'auto';
            scheme.set(soundName, audio);
        });
        
        return scheme;
    }
    
    // Apply sound scheme
    applySoundScheme(scheme) {
        if (scheme instanceof Map) {
            // Merge with existing sounds
            scheme.forEach((audio, name) => {
                this.sounds.set(name, audio);
            });
        }
    }
}

// Add CSS for sound effects
const style = document.createElement('style');
style.textContent = `
    @keyframes error-shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
        20%, 40%, 60%, 80% { transform: translateX(2px); }
    }
    
    .error-shake {
        animation: error-shake 0.5s ease-in-out;
    }
    
    .sound-playing::after {
        content: '🔊';
        position: fixed;
        bottom: 60px;
        right: 20px;
        font-size: 20px;
        opacity: 0.5;
        animation: pulse 1s ease-in-out infinite;
        pointer-events: none;
        z-index: 10000;
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 0.5; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.1); }
    }
`;
document.head.appendChild(style);

// Legacy support
window.SoundManager = SoundManager;
