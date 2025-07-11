class MoneyCounter {
    constructor() {
        // Ganancias mensuales
        this.monthlyEarnings = {
            consultora: 1182000,
            fits: 593400,
            medlog: 1300000
        };
        
        // Calcular ganancias por segundo
        this.secondlyEarnings = {
            consultora: this.monthlyEarnings.consultora / (30 * 24 * 60 * 60),
            fits: this.monthlyEarnings.fits / (30 * 24 * 60 * 60),
            medlog: this.monthlyEarnings.medlog / (30 * 24 * 60 * 60)
        };
        
        // Estado del contador - se carga desde localStorage
        this.currentEarnings = this.loadProgress() || {
            consultora: 0,
            fits: 0,
            medlog: 0,
            total: 0
        };
        
        this.isRunning = this.loadRunningState();
        this.startTime = this.loadStartTime();
        this.lastSaveTime = this.loadLastSaveTime();
        this.intervalId = null;
        this.animationId = null;
        
        // Elementos DOM
        this.elements = {
            consultora: document.getElementById('consultora-counter'),
            fits: document.getElementById('fits-counter'),
            medlog: document.getElementById('medlog-counter'),
            total: document.getElementById('total-counter'),
            currentTime: document.getElementById('current-time'),
            sessionStart: document.getElementById('session-start'),
            startBtn: document.getElementById('start-btn'),
            pauseBtn: document.getElementById('pause-btn'),
            resetBtn: document.getElementById('reset-btn'),
            floatingMoney: document.querySelector('.floating-money')
        };
        
        this.initializeEventListeners();
        this.updateTime();
        this.createFloatingMoney();
        this.createParticles();
        
        // Calcular el progreso acumulado mientras la app estaba cerrada
        this.calculateOfflineProgress();
        
        // Auto-guardar cada 5 segundos
        this.autoSaveInterval = setInterval(() => this.saveProgress(), 5000);
        
        // Guardar antes de cerrar la ventana
        window.addEventListener('beforeunload', () => this.saveProgress());
        
        // Si estaba corriendo, continuar automáticamente
        if (this.isRunning) {
            this.start();
        }
    }
    
    initializeEventListeners() {
        this.elements.startBtn.addEventListener('click', () => this.start());
        this.elements.pauseBtn.addEventListener('click', () => this.pause());
        this.elements.resetBtn.addEventListener('click', () => this.reset());
        
        // Actualizar tiempo cada segundo
        setInterval(() => this.updateTime(), 1000);
    }
    
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            if (!this.startTime) {
                this.startTime = new Date();
                this.updateSessionStart();
            }
            this.lastSaveTime = new Date();
            
            this.intervalId = setInterval(() => this.updateCounters(), 50); // Actualizar cada 50ms para suavidad
            this.elements.startBtn.style.opacity = '0.5';
            this.elements.pauseBtn.style.opacity = '1';
            
            // Guardar estado
            this.saveProgress();
            
            // Efectos visuales
            this.createMoneyRain();
            this.addCounterEffects();
        }
    }
    
    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            clearInterval(this.intervalId);
            this.elements.startBtn.style.opacity = '1';
            this.elements.pauseBtn.style.opacity = '0.5';
            
            // Guardar estado al pausar
            this.saveProgress();
        }
    }
    
    reset() {
        this.isRunning = false;
        clearInterval(this.intervalId);
        
        this.currentEarnings = {
            consultora: 0,
            fits: 0,
            medlog: 0,
            total: 0
        };
        
        this.startTime = null;
        this.lastSaveTime = null;
        this.updateDisplay();
        this.elements.sessionStart.textContent = '--:--';
        this.elements.startBtn.style.opacity = '1';
        this.elements.pauseBtn.style.opacity = '0.5';
        
        // Resetear barras de progreso
        this.updateProgressBars();
        
        // Limpiar localStorage
        this.clearProgress();
    }
    
    updateCounters() {
        if (!this.isRunning) return;
        
        // Incrementar ganancias
        this.currentEarnings.consultora += this.secondlyEarnings.consultora * 0.05; // 50ms
        this.currentEarnings.fits += this.secondlyEarnings.fits * 0.05;
        this.currentEarnings.medlog += this.secondlyEarnings.medlog * 0.05;
        this.currentEarnings.total = this.currentEarnings.consultora + this.currentEarnings.fits + this.currentEarnings.medlog;
        
        this.updateDisplay();
        this.updateProgressBars();
        
        // Efectos especiales en números redondos
        if (Math.floor(this.currentEarnings.total) % 10000 === 0 && this.currentEarnings.total > 0) {
            this.jackpotEffect();
        }
    }
    
    updateDisplay() {
        this.elements.consultora.textContent = this.formatMoney(this.currentEarnings.consultora);
        this.elements.fits.textContent = this.formatMoney(this.currentEarnings.fits);
        this.elements.medlog.textContent = this.formatMoney(this.currentEarnings.medlog);
        this.elements.total.textContent = this.formatMoney(this.currentEarnings.total);
    }
    
    updateProgressBars() {
        const consultoraPct = (this.currentEarnings.consultora / this.monthlyEarnings.consultora) * 100;
        const fitsPct = (this.currentEarnings.fits / this.monthlyEarnings.fits) * 100;
        const medlogPct = (this.currentEarnings.medlog / this.monthlyEarnings.medlog) * 100;
        
        document.querySelector('.consultora-progress').style.width = `${Math.min(consultoraPct, 100)}%`;
        document.querySelector('.fits-progress').style.width = `${Math.min(fitsPct, 100)}%`;
        document.querySelector('.medlog-progress').style.width = `${Math.min(medlogPct, 100)}%`;
    }
    
    formatMoney(amount) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Math.floor(amount));
    }
    
    updateTime() {
        const now = new Date();
        this.elements.currentTime.textContent = now.toLocaleTimeString('es-CO');
    }
    
    updateSessionStart() {
        if (this.startTime) {
            this.elements.sessionStart.textContent = this.startTime.toLocaleTimeString('es-CO');
        }
    }
    
    createFloatingMoney() {
        const symbols = ['💰', '💵', '💸', '🤑', '💳', '💎', '🏆', '⭐'];
        
        setInterval(() => {
            if (this.isRunning) {
                const symbol = document.createElement('div');
                symbol.className = 'money-symbol';
                symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)];
                symbol.style.left = Math.random() * 100 + '%';
                symbol.style.animationDuration = (4 + Math.random() * 4) + 's';
                
                this.elements.floatingMoney.appendChild(symbol);
                
                setTimeout(() => {
                    if (symbol.parentNode) {
                        symbol.parentNode.removeChild(symbol);
                    }
                }, 8000);
            }
        }, 1000);
    }
    
    createMoneyRain() {
        if (!this.isRunning) return;
        
        const symbols = ['💰', '💵', '💸', '🤑'];
        
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const symbol = document.createElement('div');
                symbol.className = 'money-symbol';
                symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)];
                symbol.style.left = Math.random() * 100 + '%';
                symbol.style.animationDuration = '2s';
                symbol.style.fontSize = '3rem';
                
                this.elements.floatingMoney.appendChild(symbol);
                
                setTimeout(() => {
                    if (symbol.parentNode) {
                        symbol.parentNode.removeChild(symbol);
                    }
                }, 2000);
            }, i * 200);
        }
    }
    
    createParticles() {
        const container = document.body;
        
        setInterval(() => {
            if (this.isRunning && Math.random() < 0.3) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                particle.style.width = (2 + Math.random() * 4) + 'px';
                particle.style.height = particle.style.width;
                
                container.appendChild(particle);
                
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 3000);
            }
        }, 500);
    }
    
    addCounterEffects() {
        // Efectos de pulsación en los contadores
        const counters = [this.elements.consultora, this.elements.fits, this.elements.medlog];
        
        counters.forEach(counter => {
            counter.style.animation = 'counterPulse 0.5s ease-in-out';
            setTimeout(() => {
                counter.style.animation = '';
            }, 500);
        });
    }
    
    jackpotEffect() {
        // Efecto especial para números redondos grandes
        const jackpotText = document.querySelector('.jackpot-text');
        const totalCard = document.querySelector('.total');
        
        // Flash effect
        totalCard.style.animation = 'none';
        totalCard.offsetHeight; // Trigger reflow
        totalCard.style.animation = 'pulse 0.5s ease-in-out 3';
        
        // Jackpot text animation
        jackpotText.style.animation = 'none';
        jackpotText.offsetHeight;
        jackpotText.style.animation = 'jackpotBounce 0.3s ease-in-out 5, gradientShift 0.5s ease infinite';
        
        // Crear explosión de partículas
        this.createParticleExplosion();
        
        // Sonido de casino (simulado con vibración en móviles)
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100, 50, 100]);
        }
    }
    
    createParticleExplosion() {
        const totalCard = document.querySelector('.total');
        const rect = totalCard.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.position = 'fixed';
            particle.style.left = centerX + 'px';
            particle.style.top = centerY + 'px';
            particle.style.width = '6px';
            particle.style.height = '6px';
            particle.style.background = '#FFD700';
            particle.style.zIndex = '1000';
            
            const angle = (i / 20) * Math.PI * 2;
            const velocity = 100 + Math.random() * 100;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;
            
            document.body.appendChild(particle);
            
            let startTime = Date.now();
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / 1000;
                
                if (progress < 1) {
                    const x = centerX + vx * progress;
                    const y = centerY + vy * progress + 0.5 * 500 * progress * progress; // Gravity
                    
                    particle.style.left = x + 'px';
                    particle.style.top = y + 'px';
                    particle.style.opacity = 1 - progress;
                    
                    requestAnimationFrame(animate);
                } else {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }
            };
            
            requestAnimationFrame(animate);
        }
    }
    
    // Métodos para persistencia de datos
    saveProgress() {
        const data = {
            currentEarnings: this.currentEarnings,
            isRunning: this.isRunning,
            startTime: this.startTime ? this.startTime.getTime() : null,
            lastSaveTime: new Date().getTime()
        };
        localStorage.setItem('moneyViewerProgress', JSON.stringify(data));
    }
    
    loadProgress() {
        const saved = localStorage.getItem('moneyViewerProgress');
        if (saved) {
            const data = JSON.parse(saved);
            return data.currentEarnings;
        }
        return null;
    }
    
    loadRunningState() {
        const saved = localStorage.getItem('moneyViewerProgress');
        if (saved) {
            const data = JSON.parse(saved);
            return data.isRunning || false;
        }
        return false;
    }
    
    loadStartTime() {
        const saved = localStorage.getItem('moneyViewerProgress');
        if (saved) {
            const data = JSON.parse(saved);
            return data.startTime ? new Date(data.startTime) : null;
        }
        return null;
    }
    
    loadLastSaveTime() {
        const saved = localStorage.getItem('moneyViewerProgress');
        if (saved) {
            const data = JSON.parse(saved);
            return data.lastSaveTime ? new Date(data.lastSaveTime) : null;
        }
        return null;
    }
    
    clearProgress() {
        localStorage.removeItem('moneyViewerProgress');
    }
    
    calculateOfflineProgress() {
        if (!this.isRunning || !this.lastSaveTime) return;
        
        const now = new Date();
        const offlineSeconds = (now.getTime() - this.lastSaveTime.getTime()) / 1000;
        
        if (offlineSeconds > 0) {
            // Calcular ganancias acumuladas mientras estaba cerrada la app
            const offlineEarnings = {
                consultora: this.secondlyEarnings.consultora * offlineSeconds,
                fits: this.secondlyEarnings.fits * offlineSeconds,
                medlog: this.secondlyEarnings.medlog * offlineSeconds
            };
            
            this.currentEarnings.consultora += offlineEarnings.consultora;
            this.currentEarnings.fits += offlineEarnings.fits;
            this.currentEarnings.medlog += offlineEarnings.medlog;
            this.currentEarnings.total = this.currentEarnings.consultora + this.currentEarnings.fits + this.currentEarnings.medlog;
            
            // Mostrar notificación de ganancias offline
            this.showOfflineEarnings(offlineEarnings, offlineSeconds);
            
            this.updateDisplay();
            this.updateProgressBars();
        }
    }
    
    showOfflineEarnings(offlineEarnings, seconds) {
        const totalOffline = offlineEarnings.consultora + offlineEarnings.fits + offlineEarnings.medlog;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        // Crear notificación
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(45deg, #FFD700, #FF6B35);
            color: #000;
            padding: 20px;
            border-radius: 15px;
            font-family: 'Orbitron', monospace;
            font-weight: 700;
            z-index: 10000;
            box-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
            border: 2px solid #FFD700;
            animation: slideIn 0.5s ease-out;
            max-width: 300px;
        `;
        
        let timeText = '';
        if (hours > 0) timeText += `${hours}h `;
        if (minutes > 0) timeText += `${minutes}m`;
        if (!timeText) timeText = '< 1m';
        
        notification.innerHTML = `
            <div style="text-align: center; margin-bottom: 10px; font-size: 1.2rem;">
                🎰 ¡GANANCIAS OFFLINE! 🎰
            </div>
            <div style="margin-bottom: 5px;">
                ⏰ Tiempo offline: ${timeText}
            </div>
            <div style="font-size: 1.5rem; text-align: center; margin: 10px 0;">
                ${this.formatMoney(totalOffline)}
            </div>
            <div style="font-size: 0.9rem; opacity: 0.8;">
                💰 ${this.formatMoney(offlineEarnings.consultora)}<br>
                💪 ${this.formatMoney(offlineEarnings.fits)}<br>
                🏥 ${this.formatMoney(offlineEarnings.medlog)}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remover después de 8 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.5s ease-in';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 500);
            }
        }, 8000);
        
        // Efecto especial para ganancias offline
        this.createOfflineEffect();
    }
    
    createOfflineEffect() {
        // Efecto de lluvia de dinero especial
        const symbols = ['💰', '💵', '💸', '🤑', '💎', '🏆'];
        
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const symbol = document.createElement('div');
                symbol.className = 'money-symbol';
                symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)];
                symbol.style.left = Math.random() * 100 + '%';
                symbol.style.animationDuration = '3s';
                symbol.style.fontSize = '2.5rem';
                symbol.style.color = '#FFD700';
                symbol.style.textShadow = '0 0 20px #FFD700';
                
                this.elements.floatingMoney.appendChild(symbol);
                
                setTimeout(() => {
                    if (symbol.parentNode) {
                        symbol.parentNode.removeChild(symbol);
                    }
                }, 3000);
            }, i * 100);
        }
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new MoneyCounter();
    
    // Efecto de entrada
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 1s ease-in-out';
        document.body.style.opacity = '1';
    }, 100);
    
    // Easter egg: doble click en el título para modo turbo
    document.querySelector('.main-title').addEventListener('dblclick', () => {
        document.body.style.filter = 'hue-rotate(180deg) saturate(2)';
        setTimeout(() => {
            document.body.style.filter = '';
        }, 3000);
    });
});

// Efectos de sonido simulados con Web Audio API
class SoundEffects {
    constructor() {
        this.audioContext = null;
        this.initAudio();
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API no soportada');
        }
    }
    
    playTone(frequency, duration) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
}

// Instanciar efectos de sonido
const soundEffects = new SoundEffects();

// Agregar sonidos a los botones
document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.control-btn');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            soundEffects.playTone(800, 0.1);
        });
    });
}); 