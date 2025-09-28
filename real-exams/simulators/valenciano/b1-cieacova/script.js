/**
 * NEOLINGUS B1 VALENCIANO CIEACOVA SIMULATOR
 * Intermediate JavaScript functionality for Valenciano B1 CIEACOVA exam simulation
 */

class B1ValencianoSimulator {
    constructor() {
        this.currentSection = 'reading-writing';
        this.timeRemaining = 150 * 60; // 2 hours 30 minutes in seconds
        this.isPaused = false;
        this.answers = {};
        this.progress = 0;
        this.totalQuestions = 45; // 40 reading + writing + 2 writing tasks
        this.timerInterval = null;

        // Answer keys for automatic scoring
        this.answerKeys = {
            reading: {
                // Exercise 1: Informative text (5 questions)
                q1: 'B', q2: 'A', q3: 'C', q4: 'B', q5: 'A',
                // Exercise 2: Literary fragment (5 questions)
                q6: 'B', q7: 'C', q8: 'A', q9: 'B', q10: 'C',
                // Exercise 3: Argumentative text (5 questions)
                q11: 'A', q12: 'B', q13: 'C', q14: 'A', q15: 'B',
                // Exercise 4: Matching short texts (25 questions)
                q16: 'A', q17: 'B', q18: 'C', q19: 'D', q20: 'A',
                q21: 'C', q22: 'B', q23: 'D', q24: 'A', q25: 'B',
                q26: 'C', q27: 'D', q28: 'B', q29: 'A', q30: 'C',
                q31: 'D', q32: 'B', q33: 'A', q34: 'C', q35: 'B',
                q36: 'D', q37: 'A', q38: 'C', q39: 'B', q40: 'A'
            }
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.startTimer();
        this.loadProgress();
        this.updateProgress();
        this.initWordCounters();
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.navigateToSection(section);
            });
        });

        // Section navigation buttons
        document.getElementById('next-to-listening')?.addEventListener('click', () => {
            this.navigateToSection('listening');
        });

        document.getElementById('next-to-speaking')?.addEventListener('click', () => {
            this.navigateToSection('speaking');
        });

        // Timer controls
        document.getElementById('pause-btn')?.addEventListener('click', () => {
            this.toggleTimer();
        });

        // Save progress buttons
        document.getElementById('save-reading-writing')?.addEventListener('click', () => {
            this.saveProgress();
        });

        document.getElementById('save-listening')?.addEventListener('click', () => {
            this.saveProgress();
        });

        document.getElementById('save-speaking')?.addEventListener('click', () => {
            this.saveProgress();
        });

        // Finish exam
        document.getElementById('finish-exam')?.addEventListener('click', () => {
            this.finishExam();
        });

        // FAB controls
        document.getElementById('fab-main')?.addEventListener('click', () => {
            this.toggleFAB();
        });

        document.getElementById('fab-help')?.addEventListener('click', () => {
            this.showHelp();
        });

        document.getElementById('fab-bookmark')?.addEventListener('click', () => {
            this.bookmarkQuestion();
        });

        document.getElementById('fab-calculator')?.addEventListener('click', () => {
            this.openCalculator();
        });

        // Modal controls
        document.getElementById('close-results')?.addEventListener('click', () => {
            this.closeResults();
        });

        // Answer tracking
        this.trackAnswers();

        // Window events
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = '';
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    navigateToSection(section) {
        // Hide current section
        document.querySelectorAll('.exam-section').forEach(sec => {
            sec.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(`${section}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update nav pills
        document.querySelectorAll('.nav-pill').forEach(pill => {
            pill.classList.remove('active');
        });

        const targetPill = document.querySelector(`[data-section="${section}"]`);
        if (targetPill) {
            targetPill.classList.add('active');
        }

        this.currentSection = section;
        this.saveProgress();

        // Smooth scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    startTimer() {
        this.updateTimerDisplay();
        
        this.timerInterval = setInterval(() => {
            if (!this.isPaused && this.timeRemaining > 0) {
                this.timeRemaining--;
                this.updateTimerDisplay();

                // Auto-save every minute
                if (this.timeRemaining % 60 === 0) {
                    this.saveProgress();
                }

                // Warning at 30 minutes
                if (this.timeRemaining === 30 * 60) {
                    this.showTimeWarning('30 minuts restants!');
                }

                // Warning at 15 minutes
                if (this.timeRemaining === 15 * 60) {
                    this.showTimeWarning('15 minuts restants!');
                }

                // Time up
                if (this.timeRemaining === 0) {
                    this.timeUp();
                }
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const hours = Math.floor(this.timeRemaining / 3600);
        const minutes = Math.floor((this.timeRemaining % 3600) / 60);
        const seconds = this.timeRemaining % 60;

        const display = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const timerElement = document.getElementById('time-display');
        if (timerElement) {
            timerElement.textContent = display;
        }

        // Color coding for urgency
        const timerContainer = document.querySelector('.timer');
        if (timerContainer) {
            if (this.timeRemaining < 15 * 60) {
                timerContainer.style.background = '#dc2626'; // Red
            } else if (this.timeRemaining < 30 * 60) {
                timerContainer.style.background = '#d97706'; // Orange
            } else {
                timerContainer.style.background = '#f59e0b'; // Orange (B1 theme)
            }
        }
    }

    toggleTimer() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pause-btn');
        
        if (this.isPaused) {
            pauseBtn.innerHTML = '<i class="fas fa-play"></i> Reprendre';
            pauseBtn.style.background = '#f59e0b'; // Orange
        } else {
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pausar';
            pauseBtn.style.background = '#d97706'; // Dark orange
        }
    }

    showTimeWarning(message) {
        // Create notification
        const notification = document.createElement('div');
        notification.className = 'time-warning';
        notification.innerHTML = `
            <div class="warning-content">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
            </div>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #dc2626;
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.3);
            z-index: 3000;
            animation: fadeIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);

        // Play warning sound (if permitted)
        this.playWarningSound();
    }

    timeUp() {
        clearInterval(this.timerInterval);
        alert('El temps ha acabat! L\'examen es lliurarà automàticament.');
        this.finishExam();
    }

    trackAnswers() {
        // Track multiple choice answers
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const questionName = e.target.name;
                const answer = e.target.value;
                this.answers[questionName] = answer;
                this.updateProgress();
                this.saveProgress();
            });
        });

        // Track select answers (matching)
        document.querySelectorAll('select').forEach(select => {
            select.addEventListener('change', (e) => {
                const questionName = e.target.name;
                const answer = e.target.value;
                this.answers[questionName] = answer;
                this.updateProgress();
                this.saveProgress();
            });
        });

        // Track textarea answers
        document.querySelectorAll('textarea').forEach(textarea => {
            textarea.addEventListener('input', (e) => {
                const id = e.target.id;
                const answer = e.target.value;
                this.answers[id] = answer;
                
                // Update word count
                this.updateWordCount(id);
                
                // Debounced save
                clearTimeout(this.saveTimeout);
                this.saveTimeout = setTimeout(() => {
                    this.saveProgress();
                }, 2000);
            });
        });
    }

    updateProgress() {
        const answeredQuestions = Object.keys(this.answers).filter(key => {
            const answer = this.answers[key];
            return answer && answer.toString().trim() !== '';
        }).length;

        this.progress = answeredQuestions;
        
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        if (progressFill && progressText) {
            const percentage = (this.progress / this.totalQuestions) * 100;
            progressFill.style.width = `${percentage}%`;
            progressText.textContent = `${this.progress} / ${this.totalQuestions} preguntes completades`;
        }
    }

    initWordCounters() {
        const emailTextarea = document.getElementById('email-text');
        const argumentTextarea = document.getElementById('argument-text');

        if (emailTextarea) {
            this.setupWordCounter(emailTextarea, 'email-word-count', 'email-counter-fill', 120, 150);
        }

        if (argumentTextarea) {
            this.setupWordCounter(argumentTextarea, 'argument-word-count', 'argument-counter-fill', 150, 180);
        }
    }

    setupWordCounter(textarea, counterId, fillId, minWords, maxWords) {
        const updateCounter = () => {
            const text = textarea.value;
            const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
            
            const counterElement = document.getElementById(counterId);
            const fillElement = document.getElementById(fillId);
            
            if (counterElement) {
                counterElement.textContent = wordCount;
                
                // Color coding for B1 level
                if (wordCount < minWords) {
                    counterElement.style.color = '#dc2626'; // Red - too few
                } else if (wordCount > maxWords + 15) {
                    counterElement.style.color = '#d97706'; // Orange - too many
                } else {
                    counterElement.style.color = '#f59e0b'; // Orange - good
                }
            }
            
            if (fillElement) {
                const maxDisplay = maxWords + 20;
                const percentage = Math.min((wordCount / maxDisplay) * 100, 100);
                fillElement.style.width = `${percentage}%`;
                
                if (wordCount >= minWords && wordCount <= maxWords + 15) {
                    fillElement.style.background = '#f59e0b'; // Orange - good range
                } else if (wordCount > maxWords + 15) {
                    fillElement.style.background = '#d97706'; // Dark orange - too many
                } else {
                    fillElement.style.background = '#dc2626'; // Red - too few
                }
            }
        };

        textarea.addEventListener('input', updateCounter);
        updateCounter(); // Initial update
    }

    updateWordCount(textareaId) {
        if (textareaId === 'email-text') {
            this.setupWordCounter(
                document.getElementById('email-text'),
                'email-word-count',
                'email-counter-fill',
                120,
                150
            );
        } else if (textareaId === 'argument-text') {
            this.setupWordCounter(
                document.getElementById('argument-text'),
                'argument-word-count',
                'argument-counter-fill',
                150,
                180
            );
        }
    }

    saveProgress() {
        const progressData = {
            currentSection: this.currentSection,
            timeRemaining: this.timeRemaining,
            answers: this.answers,
            progress: this.progress,
            timestamp: Date.now()
        };

        localStorage.setItem('b1ValencianoProgress', JSON.stringify(progressData));
    }

    loadProgress() {
        const savedData = localStorage.getItem('b1ValencianoProgress');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.currentSection = data.currentSection || 'reading-writing';
                this.timeRemaining = data.timeRemaining || this.timeRemaining;
                this.answers = data.answers || {};
                this.progress = data.progress || 0;

                // Restore answers to form
                this.restoreAnswers();
                
                // Navigate to saved section
                this.navigateToSection(this.currentSection);
                
                console.log('Progrés carregat correctament');
            } catch (error) {
                console.error('Error en carregar el progrés:', error);
            }
        }
    }

    restoreAnswers() {
        Object.keys(this.answers).forEach(key => {
            const value = this.answers[key];
            
            // Radio buttons
            const radio = document.querySelector(`input[name="${key}"][value="${value}"]`);
            if (radio) {
                radio.checked = true;
            }
            
            // Selects (matching)
            const select = document.querySelector(`select[name="${key}"]`);
            if (select) {
                select.value = value;
            }
            
            // Textareas
            const textarea = document.getElementById(key);
            if (textarea) {
                textarea.value = value;
                this.updateWordCount(key);
            }
        });
    }

    hasUnsavedChanges() {
        const savedData = localStorage.getItem('b1ValencianoProgress');
        if (!savedData) return Object.keys(this.answers).length > 0;
        
        try {
            const data = JSON.parse(savedData);
            return JSON.stringify(data.answers) !== JSON.stringify(this.answers);
        } catch {
            return true;
        }
    }

    finishExam() {
        if (confirm('Segur que vols acabar l\'examen? Aquesta acció no es pot desfer.')) {
            clearInterval(this.timerInterval);
            this.calculateResults();
            this.showResults();
        }
    }

    calculateResults() {
        const results = {
            readingWriting: this.calculateReadingWritingScore(),
            listening: { score: 0, total: 25, percentage: 0 }, // Placeholder
            speaking: { score: 0, total: 25, percentage: 0 }, // Placeholder
            overall: { score: 0, total: 100, grade: 'Incomplet' }
        };

        // Calculate overall score (only reading & writing for now)
        results.overall.score = results.readingWriting.score;
        results.overall.percentage = (results.overall.score / 80) * 100; // Only R&W for now

        // Determine grade based on B1 Valenciano standards
        if (results.overall.percentage >= 90) {
            results.overall.grade = 'Nota A';
        } else if (results.overall.percentage >= 80) {
            results.overall.grade = 'Nota B';
        } else if (results.overall.percentage >= 70) {
            results.overall.grade = 'Nota C';
        } else if (results.overall.percentage >= 50) {
            results.overall.grade = 'Nivell A2';
        } else {
            results.overall.grade = 'Suspés';
        }

        this.results = results;
    }

    calculateReadingWritingScore() {
        let readingScore = 0;
        let writingScore = 0;
        const readingTotal = 40; // All reading exercises
        const writingTotal = 40; // Email (20) + Argument (20)

        // Reading score calculation
        Object.keys(this.answerKeys.reading).forEach(key => {
            const userAnswer = this.answers[key];
            const correctAnswer = this.answerKeys.reading[key];
            
            if (userAnswer && userAnswer.toString().toLowerCase().trim() === correctAnswer.toString().toLowerCase()) {
                readingScore++;
            }
        });

        // Writing tasks scoring
        const emailText = this.answers['email-text'] || '';
        const argumentText = this.answers['argument-text'] || '';

        // Email scoring (20 points max)
        if (emailText.trim().length > 0) {
            const emailWords = emailText.trim().split(/\s+/).length;
            if (emailWords >= 120 && emailWords <= 165) {
                writingScore += 15; // Good word count range
            } else if (emailWords >= 100 && emailWords <= 180) {
                writingScore += 10; // Acceptable range
            } else if (emailWords >= 80) {
                writingScore += 5; // Minimal content
            }
            
            // Content analysis for informal email
            const emailLower = emailText.toLowerCase();
            let emailContent = 0;
            if (emailLower.includes('hola') || emailLower.includes('dear') || emailLower.includes('estimat')) emailContent++;
            if (emailLower.includes('nadal') || emailLower.includes('christmas') || emailLower.includes('festes')) emailContent++;
            if (emailLower.includes('restaurant') || emailLower.includes('menjar') || emailLower.includes('food')) emailContent++;
            if (emailLower.includes('recomanar') || emailLower.includes('recommend') || emailLower.includes('suggest')) emailContent++;
            
            writingScore += emailContent; // Up to 5 points for content relevance
        }

        // Argumentative text scoring (20 points max)
        if (argumentText.trim().length > 0) {
            const argumentWords = argumentText.trim().split(/\s+/).length;
            if (argumentWords >= 150 && argumentWords <= 195) {
                writingScore += 15; // Good word count range
            } else if (argumentWords >= 130 && argumentWords <= 210) {
                writingScore += 10; // Acceptable range
            } else if (argumentWords >= 100) {
                writingScore += 5; // Minimal content
            }
            
            // Content analysis for argumentative text
            const argumentLower = argumentText.toLowerCase();
            let argumentContent = 0;
            if (argumentLower.includes('xarxes socials') || argumentLower.includes('social media') || argumentLower.includes('facebook')) argumentContent++;
            if (argumentLower.includes('privacitat') || argumentLower.includes('privacy') || argumentLower.includes('dades')) argumentContent++;
            if (argumentLower.includes('però') || argumentLower.includes('however') || argumentLower.includes('tanmateix')) argumentContent++;
            if (argumentLower.includes('opinió') || argumentLower.includes('opinion') || argumentLower.includes('crec')) argumentContent++;
            
            writingScore += argumentContent; // Up to 5 points for argumentative content
        }

        const totalScore = readingScore + writingScore;
        
        return {
            score: totalScore,
            total: readingTotal + writingTotal,
            percentage: (totalScore / (readingTotal + writingTotal)) * 100,
            breakdown: {
                reading: readingScore,
                writing: writingScore,
                readingTotal: readingTotal,
                writingTotal: writingTotal
            }
        };
    }

    showResults() {
        const modal = document.getElementById('results-modal');
        const modalBody = modal.querySelector('.modal-body .results-summary');

        modalBody.innerHTML = `
            <div class="results-overview">
                <div class="overall-score">
                    <h3>Puntuació Total: ${this.results.overall.score}/80</h3>
                    <div class="grade-badge grade-${this.results.overall.grade.toLowerCase().replace(/\s+/g, '-')}">
                        ${this.results.overall.grade}
                    </div>
                    <div class="percentage">${this.results.overall.percentage.toFixed(1)}%</div>
                </div>
            </div>

            <div class="skills-breakdown">
                <div class="skill-result">
                    <h4><i class="fas fa-book"></i> Lectura i Escriptura</h4>
                    <div class="score">${this.results.readingWriting.score}/${this.results.readingWriting.total} (${this.results.readingWriting.percentage.toFixed(1)}%)</div>
                    <div class="part-breakdown">
                        <span>Lectura: ${this.results.readingWriting.breakdown.reading}/${this.results.readingWriting.breakdown.readingTotal}</span>
                        <span>Escriptura: ${this.results.readingWriting.breakdown.writing}/${this.results.readingWriting.breakdown.writingTotal}</span>
                    </div>
                </div>

                <div class="skill-result incomplete">
                    <h4><i class="fas fa-headphones"></i> Comprensió Oral</h4>
                    <div class="score">No completat</div>
                </div>

                <div class="skill-result incomplete">
                    <h4><i class="fas fa-microphone"></i> Expressió Oral</h4>
                    <div class="score">No completat</div>
                </div>
            </div>

            <div class="feedback-section">
                <h4>Comentaris i Recomanacions</h4>
                ${this.generateFeedback()}
            </div>

            <div class="results-actions">
                <button class="btn-primary" onclick="window.print()">
                    <i class="fas fa-print"></i> Imprimir Resultats
                </button>
                <button class="btn-secondary" onclick="simulator.exportResults()">
                    <i class="fas fa-download"></i> Exportar PDF
                </button>
                <button class="btn-success" onclick="simulator.retakeExam()">
                    <i class="fas fa-redo"></i> Repetir Examen
                </button>
            </div>
        `;

        modal.classList.add('active');
    }

    generateFeedback() {
        const rw = this.results.readingWriting;
        let feedback = '<ul>';

        // Reading & Writing feedback
        if (rw.percentage >= 85) {
            feedback += '<li class="positive">✅ Excel·lent rendiment en Lectura i Escriptura</li>';
        } else if (rw.percentage >= 75) {
            feedback += '<li class="positive">✅ Bon rendiment amb petites àrees de millora</li>';
        } else if (rw.percentage >= 65) {
            feedback += '<li class="warning">⚠️ Rendiment adequat, enfoca\'t en habilitats intermèdies</li>';
        } else {
            feedback += '<li class="negative">❌ Cal millorar significativament les habilitats en valencià</li>';
        }

        // Specific feedback based on performance
        if (rw.breakdown.reading < rw.breakdown.readingTotal * 0.7) {
            feedback += '<li class="warning">📚 Practica més la comprensió lectora de textos intermedis</li>';
        }

        if (rw.breakdown.writing < rw.breakdown.writingTotal * 0.7) {
            feedback += '<li class="warning">✍️ Treballa l\'estructura de textos i la coherència argumentativa</li>';
        }

        // B1 specific feedback
        if (rw.percentage >= 80) {
            feedback += '<li class="positive">🎯 Considereu passar al nivell B2 de valencià</li>';
        } else {
            feedback += '<li class="neutral">📈 Enfoqueu-vos en expandir vocabulari i estructures gramaticals</li>';
        }

        // Incomplete sections
        feedback += '<li class="neutral">🎧 Completeu la secció oral per a l\'avaluació completa</li>';
        feedback += '<li class="neutral">🎤 Completeu la secció d\'expressió oral per a l\'avaluació completa</li>';

        feedback += '</ul>';
        return feedback;
    }

    toggleFAB() {
        const fabOptions = document.getElementById('fab-options');
        fabOptions.classList.toggle('active');
    }

    showHelp() {
        alert(`Ajuda de l'Examen B1 Valenciano CIEACOVA:

Navegació:
• Utilitzeu les pestanyes per navegar entre seccions
• El vostre progrés es desa automàticament
• El temporitzador mostra el temps restant

Consells:
• Llegiu atentament les instruccions de cada part
• Per a l'escriptura: respecteu els límits de paraules
• Gestioneu bé el temps entre totes les seccions
• Penseu en la coherència i cohesió dels textos

Dreceres de teclat:
• Ctrl+S: Desar progrés
• Ctrl+P: Imprimir
• Esc: Tancar modals`);
    }

    bookmarkQuestion() {
        alert('Pregunta marcada! (Funció disponible properament)');
    }

    openCalculator() {
        window.open('data:text/html,<html><head><title>Calculadora</title></head><body><iframe src="https://www.google.com/search?q=calculator" width="100%" height="100%" frameborder="0"></iframe></body></html>', 'calculator', 'width=300,height=400');
    }

    closeResults() {
        document.getElementById('results-modal').classList.remove('active');
    }

    exportResults() {
        const resultsData = {
            timestamp: new Date().toISOString(),
            examType: 'B1_Valenciano_CIEACOVA',
            timeSpent: this.formatTime(150 * 60 - this.timeRemaining),
            ...this.results
        };

        const dataStr = JSON.stringify(resultsData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `B1_Valenciano_Resultats_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    retakeExam() {
        if (confirm('Segur que voleu repetir l\'examen? Es perdrà tot el progrés actual.')) {
            localStorage.removeItem('b1ValencianoProgress');
            location.reload();
        }
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours}h ${minutes}m ${secs}s`;
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    this.saveProgress();
                    break;
                case 'p':
                    e.preventDefault();
                    window.print();
                    break;
            }
        }

        if (e.key === 'Escape') {
            // Close any open modals
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
            
            // Close FAB options
            document.getElementById('fab-options')?.classList.remove('active');
        }
    }

    playWarningSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
            console.log('Audio not supported or permission denied');
        }
    }
}

// Initialize simulator when page loads
let simulator;

document.addEventListener('DOMContentLoaded', function() {
    simulator = new B1ValencianoSimulator();
    
    // Add smooth scrolling for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Add loading animation removal
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
});

// Expose simulator globally for debugging
window.simulator = simulator;

// Service Worker registration for offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed');
            });
    });
}