/**
 * NEOLINGUS B2 FIRST SIMULATOR
 * Advanced JavaScript functionality for Cambridge B2 First exam simulation
 */

class B2FirstSimulator {
    constructor() {
        this.currentSection = 'reading';
        this.timeRemaining = 210 * 60; // 3.5 hours in seconds
        this.isPaused = false;
        this.answers = {};
        this.progress = 0;
        this.totalQuestions = 52;
        this.timerInterval = null;

        // Answer keys for automatic scoring
        this.answerKeys = {
            reading: {
                q1: 'B', q2: 'B', q3: 'B', q4: 'A', q5: 'B', q6: 'A', q7: 'A', q8: 'B',
                q9: 'to', q10: 'how', q11: 'at', q12: 'in', q13: 'it', q14: 'to', q15: 'not', q16: 'in'
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
        this.initTaskSelection();
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
        document.getElementById('next-section')?.addEventListener('click', () => {
            this.navigateToSection('writing');
        });

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
        document.getElementById('save-reading')?.addEventListener('click', () => {
            this.saveProgress();
        });

        document.getElementById('save-writing')?.addEventListener('click', () => {
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

                // Warning at 15 minutes
                if (this.timeRemaining === 15 * 60) {
                    this.showTimeWarning('15 minutes remaining!');
                }

                // Warning at 5 minutes
                if (this.timeRemaining === 5 * 60) {
                    this.showTimeWarning('5 minutes remaining!');
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
            if (this.timeRemaining < 5 * 60) {
                timerContainer.style.background = '#dc2626'; // Red
            } else if (this.timeRemaining < 15 * 60) {
                timerContainer.style.background = '#d97706'; // Orange
            } else {
                timerContainer.style.background = '#0f172a'; // Dark
            }
        }
    }

    toggleTimer() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pause-btn');
        
        if (this.isPaused) {
            pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
            pauseBtn.style.background = '#059669'; // Green
        } else {
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
            pauseBtn.style.background = '#d97706'; // Orange
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
        alert('Time is up! Your exam will be automatically submitted.');
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

        // Track text input answers
        document.querySelectorAll('input[type="text"]').forEach(input => {
            input.addEventListener('input', (e) => {
                const questionName = e.target.name;
                const answer = e.target.value.trim();
                this.answers[questionName] = answer;
                this.updateProgress();
                
                // Debounced save
                clearTimeout(this.saveTimeout);
                this.saveTimeout = setTimeout(() => {
                    this.saveProgress();
                }, 1000);
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
            progressText.textContent = `${this.progress} / ${this.totalQuestions} questions completed`;
        }
    }

    initWordCounters() {
        const essayTextarea = document.getElementById('essay-text');
        const part2Textarea = document.getElementById('part2-text');

        if (essayTextarea) {
            this.setupWordCounter(essayTextarea, 'essay-word-count', 'essay-counter-fill', 190);
        }

        if (part2Textarea) {
            this.setupWordCounter(part2Textarea, 'part2-word-count', 'part2-counter-fill', 190);
        }
    }

    setupWordCounter(textarea, counterId, fillId, maxWords) {
        const updateCounter = () => {
            const text = textarea.value;
            const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
            
            const counterElement = document.getElementById(counterId);
            const fillElement = document.getElementById(fillId);
            
            if (counterElement) {
                counterElement.textContent = wordCount;
                
                // Color coding
                if (wordCount < 140) {
                    counterElement.style.color = '#dc2626'; // Red - too few
                } else if (wordCount > maxWords) {
                    counterElement.style.color = '#dc2626'; // Red - too many
                } else {
                    counterElement.style.color = '#059669'; // Green - good
                }
            }
            
            if (fillElement) {
                const percentage = Math.min((wordCount / maxWords) * 100, 100);
                fillElement.style.width = `${percentage}%`;
                
                if (wordCount > maxWords) {
                    fillElement.style.background = '#dc2626';
                } else if (wordCount >= 140) {
                    fillElement.style.background = '#059669';
                } else {
                    fillElement.style.background = '#d97706';
                }
            }
        };

        textarea.addEventListener('input', updateCounter);
        updateCounter(); // Initial update
    }

    updateWordCount(textareaId) {
        if (textareaId === 'essay-text') {
            this.setupWordCounter(
                document.getElementById('essay-text'),
                'essay-word-count',
                'essay-counter-fill',
                190
            );
        } else if (textareaId === 'part2-text') {
            this.setupWordCounter(
                document.getElementById('part2-text'),
                'part2-word-count',
                'part2-counter-fill',
                190
            );
        }
    }

    initTaskSelection() {
        document.querySelectorAll('.task-option').forEach(option => {
            option.addEventListener('click', (e) => {
                // Remove previous selection
                document.querySelectorAll('.task-option').forEach(opt => {
                    opt.classList.remove('selected');
                });

                // Add selection to clicked option
                e.currentTarget.classList.add('selected');

                // Show writing area
                const writingArea = document.getElementById('part2-writing');
                if (writingArea) {
                    writingArea.style.display = 'block';
                }

                // Update placeholder based on task
                const taskType = e.currentTarget.dataset.task;
                const textarea = document.getElementById('part2-text');
                if (textarea) {
                    const placeholders = {
                        article: 'Write your article about the best place to visit in your country...',
                        email: 'Write your email response to Sam...',
                        review: 'Write your app review...'
                    };
                    textarea.placeholder = placeholders[taskType] || 'Write your answer here...';
                }

                // Save task selection
                this.answers.selectedTask = taskType;
                this.saveProgress();
            });
        });
    }

    saveProgress() {
        const progressData = {
            currentSection: this.currentSection,
            timeRemaining: this.timeRemaining,
            answers: this.answers,
            progress: this.progress,
            timestamp: Date.now()
        };

        localStorage.setItem('b2FirstProgress', JSON.stringify(progressData));
    }

    loadProgress() {
        const savedData = localStorage.getItem('b2FirstProgress');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.currentSection = data.currentSection || 'reading';
                this.timeRemaining = data.timeRemaining || this.timeRemaining;
                this.answers = data.answers || {};
                this.progress = data.progress || 0;

                // Restore answers to form
                this.restoreAnswers();
                
                // Navigate to saved section
                this.navigateToSection(this.currentSection);
                
                console.log('Progress loaded successfully');
            } catch (error) {
                console.error('Error loading progress:', error);
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
            
            // Text inputs
            const textInput = document.querySelector(`input[name="${key}"]`);
            if (textInput && textInput.type === 'text') {
                textInput.value = value;
            }
            
            // Textareas
            const textarea = document.getElementById(key);
            if (textarea) {
                textarea.value = value;
                this.updateWordCount(key);
            }
            
            // Task selection
            if (key === 'selectedTask') {
                const taskOption = document.querySelector(`[data-task="${value}"]`);
                if (taskOption) {
                    taskOption.click();
                }
            }
        });
    }

    hasUnsavedChanges() {
        const savedData = localStorage.getItem('b2FirstProgress');
        if (!savedData) return Object.keys(this.answers).length > 0;
        
        try {
            const data = JSON.parse(savedData);
            return JSON.stringify(data.answers) !== JSON.stringify(this.answers);
        } catch {
            return true;
        }
    }

    finishExam() {
        if (confirm('Are you sure you want to finish the exam? This action cannot be undone.')) {
            clearInterval(this.timerInterval);
            this.calculateResults();
            this.showResults();
        }
    }

    calculateResults() {
        const results = {
            reading: this.calculateReadingScore(),
            writing: this.calculateWritingScore(),
            listening: { score: 0, total: 30, percentage: 0 }, // Placeholder
            speaking: { score: 0, total: 60, percentage: 0 }, // Placeholder
            overall: { score: 0, total: 200, grade: 'Incomplete' }
        };

        // Calculate overall score
        results.overall.score = results.reading.score + results.writing.score + 
                               results.listening.score + results.speaking.score;
        results.overall.percentage = (results.overall.score / results.overall.total) * 100;

        // Determine grade
        if (results.overall.percentage >= 80) {
            results.overall.grade = 'A';
        } else if (results.overall.percentage >= 75) {
            results.overall.grade = 'B';
        } else if (results.overall.percentage >= 60) {
            results.overall.grade = 'C';
        } else {
            results.overall.grade = 'Fail';
        }

        this.results = results;
    }

    calculateReadingScore() {
        let score = 0;
        let total = 16; // Parts 1 and 2

        // Part 1 (Multiple Choice)
        for (let i = 1; i <= 8; i++) {
            const userAnswer = this.answers[`q${i}`];
            const correctAnswer = this.answerKeys.reading[`q${i}`];
            if (userAnswer === correctAnswer) {
                score++;
            }
        }

        // Part 2 (Open Cloze)
        for (let i = 9; i <= 16; i++) {
            const userAnswer = this.answers[`q${i}`]?.toLowerCase().trim();
            const correctAnswer = this.answerKeys.reading[`q${i}`];
            if (userAnswer === correctAnswer) {
                score++;
            }
        }

        return {
            score: score,
            total: total,
            percentage: (score / total) * 100,
            breakdown: {
                part1: this.calculatePartScore(1, 8),
                part2: this.calculatePartScore(9, 16)
            }
        };
    }

    calculatePartScore(start, end) {
        let score = 0;
        let total = end - start + 1;

        for (let i = start; i <= end; i++) {
            const userAnswer = this.answers[`q${i}`];
            const correctAnswer = this.answerKeys.reading[`q${i}`];
            
            if (i <= 8) {
                // Multiple choice - exact match
                if (userAnswer === correctAnswer) score++;
            } else {
                // Open cloze - case insensitive
                if (userAnswer?.toLowerCase().trim() === correctAnswer) score++;
            }
        }

        return { score, total, percentage: (score / total) * 100 };
    }

    calculateWritingScore() {
        // Basic writing score based on word count and completion
        let score = 0;
        let total = 40;

        const essayText = this.answers['essay-text'] || '';
        const part2Text = this.answers['part2-text'] || '';

        // Essay scoring (20 points)
        if (essayText.trim().length > 0) {
            const essayWords = essayText.trim().split(/\s+/).length;
            if (essayWords >= 140 && essayWords <= 190) {
                score += 18; // Good word count
            } else if (essayWords >= 120 && essayWords <= 210) {
                score += 15; // Acceptable word count
            } else if (essayWords >= 100) {
                score += 10; // Too short/long but some content
            }
        }

        // Part 2 scoring (20 points)
        if (part2Text.trim().length > 0) {
            const part2Words = part2Text.trim().split(/\s+/).length;
            if (part2Words >= 140 && part2Words <= 190) {
                score += 18; // Good word count
            } else if (part2Words >= 120 && part2Words <= 210) {
                score += 15; // Acceptable word count
            } else if (part2Words >= 100) {
                score += 10; // Too short/long but some content
            }
        }

        return {
            score: score,
            total: total,
            percentage: (score / total) * 100,
            breakdown: {
                essay: Math.min(20, score),
                part2: Math.max(0, score - 20)
            }
        };
    }

    showResults() {
        const modal = document.getElementById('results-modal');
        const modalBody = modal.querySelector('.modal-body .results-summary');

        modalBody.innerHTML = `
            <div class="results-overview">
                <div class="overall-score">
                    <h3>Overall Score: ${this.results.overall.score}/${this.results.overall.total}</h3>
                    <div class="grade-badge grade-${this.results.overall.grade.toLowerCase()}">
                        Grade: ${this.results.overall.grade}
                    </div>
                    <div class="percentage">${this.results.overall.percentage.toFixed(1)}%</div>
                </div>
            </div>

            <div class="skills-breakdown">
                <div class="skill-result">
                    <h4><i class="fas fa-book-open"></i> Reading & Use of English</h4>
                    <div class="score">${this.results.reading.score}/${this.results.reading.total} (${this.results.reading.percentage.toFixed(1)}%)</div>
                    <div class="part-breakdown">
                        <span>Part 1: ${this.results.reading.breakdown.part1.score}/8</span>
                        <span>Part 2: ${this.results.reading.breakdown.part2.score}/8</span>
                    </div>
                </div>

                <div class="skill-result">
                    <h4><i class="fas fa-pen"></i> Writing</h4>
                    <div class="score">${this.results.writing.score}/${this.results.writing.total} (${this.results.writing.percentage.toFixed(1)}%)</div>
                    <div class="part-breakdown">
                        <span>Essay: ${this.results.writing.breakdown.essay}/20</span>
                        <span>Part 2: ${this.results.writing.breakdown.part2}/20</span>
                    </div>
                </div>

                <div class="skill-result incomplete">
                    <h4><i class="fas fa-headphones"></i> Listening</h4>
                    <div class="score">Not completed</div>
                </div>

                <div class="skill-result incomplete">
                    <h4><i class="fas fa-microphone"></i> Speaking</h4>
                    <div class="score">Not completed</div>
                </div>
            </div>

            <div class="feedback-section">
                <h4>Feedback & Recommendations</h4>
                ${this.generateFeedback()}
            </div>

            <div class="results-actions">
                <button class="btn-primary" onclick="window.print()">
                    <i class="fas fa-print"></i> Print Results
                </button>
                <button class="btn-secondary" onclick="simulator.exportResults()">
                    <i class="fas fa-download"></i> Export PDF
                </button>
                <button class="btn-success" onclick="simulator.retakeExam()">
                    <i class="fas fa-redo"></i> Retake Exam
                </button>
            </div>
        `;

        modal.classList.add('active');
    }

    generateFeedback() {
        const reading = this.results.reading;
        const writing = this.results.writing;
        let feedback = '<ul>';

        // Reading feedback
        if (reading.percentage >= 80) {
            feedback += '<li class="positive">✅ Excellent reading comprehension and vocabulary knowledge</li>';
        } else if (reading.percentage >= 60) {
            feedback += '<li class="warning">⚠️ Good reading skills, but review vocabulary and grammar structures</li>';
        } else {
            feedback += '<li class="negative">❌ Focus on improving reading strategies and expanding vocabulary</li>';
        }

        // Writing feedback
        if (writing.percentage >= 80) {
            feedback += '<li class="positive">✅ Strong writing skills with appropriate word count management</li>';
        } else if (writing.percentage >= 60) {
            feedback += '<li class="warning">⚠️ Practice organizing ideas and managing word count effectively</li>';
        } else {
            feedback += '<li class="negative">❌ Work on writing structure, vocabulary, and meeting word count requirements</li>';
        }

        // Incomplete sections
        feedback += '<li class="neutral">📝 Complete listening and speaking sections for full assessment</li>';

        feedback += '</ul>';
        return feedback;
    }

    toggleFAB() {
        const fabOptions = document.getElementById('fab-options');
        fabOptions.classList.toggle('active');
    }

    showHelp() {
        alert(`Cambridge B2 First Help:

Navigation:
• Use the section pills to navigate between exam parts
• Your progress is automatically saved
• Timer shows remaining time for the entire exam

Tips:
• Read instructions carefully for each part
• Manage your time effectively
• Check your answers before moving to the next section

Keyboard Shortcuts:
• Ctrl+S: Save progress
• Ctrl+P: Print
• Esc: Close modals`);
    }

    bookmarkQuestion() {
        // Add visual bookmark to current question
        alert('Question bookmarked! (Feature coming soon)');
    }

    openCalculator() {
        window.open('data:text/html,<html><head><title>Calculator</title></head><body><iframe src="https://www.google.com/search?q=calculator" width="100%" height="100%" frameborder="0"></iframe></body></html>', 'calculator', 'width=300,height=400');
    }

    closeResults() {
        document.getElementById('results-modal').classList.remove('active');
    }

    exportResults() {
        // Create exportable results
        const resultsData = {
            timestamp: new Date().toISOString(),
            timeSpent: this.formatTime(210 * 60 - this.timeRemaining),
            ...this.results
        };

        const dataStr = JSON.stringify(resultsData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `B2_First_Results_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    retakeExam() {
        if (confirm('Are you sure you want to retake the exam? All progress will be lost.')) {
            localStorage.removeItem('b2FirstProgress');
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
        // Create audio context for warning sound
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
    simulator = new B2FirstSimulator();
    
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