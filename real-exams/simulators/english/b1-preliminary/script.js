/**
 * NEOLINGUS B1 PRELIMINARY SIMULATOR
 * Advanced JavaScript functionality for Cambridge B1 Preliminary exam simulation
 */

class B1PreliminarySimulator {
    constructor() {
        this.currentSection = 'reading-writing';
        this.timeRemaining = 140 * 60; // 2 hours 20 minutes in seconds
        this.isPaused = false;
        this.answers = {};
        this.progress = 0;
        this.totalQuestions = 44; // 37 reading + 5 writing + 2 writing tasks
        this.timerInterval = null;
        this.gappedTextAnswers = {};

        // Answer keys for automatic scoring
        this.answerKeys = {
            reading: {
                // Part 1: Real-world notices
                q1: 'A', q2: 'C', q3: 'A', q4: 'B', q5: 'C',
                // Part 2: Matching
                q6: 'A', q7: 'G', q8: 'B', q9: 'C', q10: 'E',
                // Part 3: Long text
                q11: 'B', q12: 'A', q13: 'C', q14: 'D', q15: 'B',
                // Part 4: Gapped text
                q16: 'B', q17: 'C', q18: 'F', q19: 'G', q20: 'A',
                // Part 5: Multiple choice cloze
                q21: 'A', q22: 'A', q23: 'C', q24: 'B', q25: 'B', q26: 'A',
                // Part 6: Open cloze
                q27: 'to', q28: 'is', q29: 'which', q30: 'how', q31: 'who', q32: 'up',
                // Part 7: Word formation
                q33: 'success', q34: 'really', q35: 'careful'
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
        this.initGappedText();
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
                timerContainer.style.background = '#3b82f6'; // Blue (B1 theme)
            }
        }
    }

    toggleTimer() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pause-btn');
        
        if (this.isPaused) {
            pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
            pauseBtn.style.background = '#3b82f6'; // Blue
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

    initGappedText() {
        // Initialize gapped text interactions
        const gaps = document.querySelectorAll('.gap');
        const sentenceOptions = document.querySelectorAll('.sentence-option');

        gaps.forEach(gap => {
            gap.addEventListener('click', () => {
                if (this.selectedSentence) {
                    this.fillGap(gap, this.selectedSentence);
                }
            });
        });

        sentenceOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectSentence(e.currentTarget);
            });
        });
    }

    selectSentence(sentenceElement) {
        // Remove previous selection
        document.querySelectorAll('.sentence-option').forEach(opt => {
            opt.classList.remove('selected');
        });

        // Add selection if not used
        if (!sentenceElement.classList.contains('used')) {
            sentenceElement.classList.add('selected');
            this.selectedSentence = sentenceElement;
        }
    }

    fillGap(gapElement, sentenceElement) {
        const gapNumber = gapElement.dataset.gap;
        const sentenceValue = sentenceElement.dataset.value;

        // Remove any existing answer from this gap
        if (this.gappedTextAnswers[gapNumber]) {
            const previousSentence = document.querySelector(`[data-value="${this.gappedTextAnswers[gapNumber]}"]`);
            if (previousSentence) {
                previousSentence.classList.remove('used');
            }
        }

        // Fill the gap
        gapElement.textContent = `(${gapNumber}) ${sentenceValue}`;
        gapElement.classList.add('filled');
        
        // Mark sentence as used
        sentenceElement.classList.add('used');
        sentenceElement.classList.remove('selected');
        
        // Store answer
        this.gappedTextAnswers[gapNumber] = sentenceValue;
        this.answers[`q${gapNumber}`] = sentenceValue;

        // Clear selection
        this.selectedSentence = null;

        this.updateProgress();
        this.saveProgress();
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

        // Track text input answers (open cloze and word formation)
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
            progressText.textContent = `${this.progress} / ${this.totalQuestions} questions completed`;
        }
    }

    initWordCounters() {
        const emailTextarea = document.getElementById('email-text');
        const part2Textarea = document.getElementById('part2-text');

        if (emailTextarea) {
            this.setupWordCounter(emailTextarea, 'email-word-count', 'email-counter-fill', 100, true);
        }

        if (part2Textarea) {
            this.setupWordCounter(part2Textarea, 'part2-word-count', 'part2-counter-fill', 100, true);
        }
    }

    setupWordCounter(textarea, counterId, fillId, targetWords, hasTarget = true) {
        const updateCounter = () => {
            const text = textarea.value;
            const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
            
            const counterElement = document.getElementById(counterId);
            const fillElement = document.getElementById(fillId);
            
            if (counterElement) {
                counterElement.textContent = wordCount;
                
                // Color coding for B1 level
                if (hasTarget) {
                    if (wordCount < targetWords - 20) {
                        counterElement.style.color = '#dc2626'; // Red - too few
                    } else if (wordCount > targetWords + 20) {
                        counterElement.style.color = '#d97706'; // Orange - too many
                    } else {
                        counterElement.style.color = '#3b82f6'; // Blue - good
                    }
                } else {
                    counterElement.style.color = wordCount >= targetWords ? '#3b82f6' : '#dc2626';
                }
            }
            
            if (fillElement) {
                const maxDisplay = hasTarget ? targetWords + 30 : targetWords + 20;
                const percentage = Math.min((wordCount / maxDisplay) * 100, 100);
                fillElement.style.width = `${percentage}%`;
                
                if (hasTarget) {
                    if (wordCount >= targetWords - 20 && wordCount <= targetWords + 20) {
                        fillElement.style.background = '#3b82f6'; // Blue - good range
                    } else if (wordCount > targetWords + 20) {
                        fillElement.style.background = '#d97706'; // Orange - too many
                    } else {
                        fillElement.style.background = '#dc2626'; // Red - too few
                    }
                } else {
                    fillElement.style.background = wordCount >= targetWords ? '#3b82f6' : '#dc2626';
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
                100,
                true
            );
        } else if (textareaId === 'part2-text') {
            this.setupWordCounter(
                document.getElementById('part2-text'),
                'part2-word-count',
                'part2-counter-fill',
                100,
                true
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
                        article: 'Write your article about the perfect day out...',
                        story: 'When I opened the door, I couldn\'t believe what I saw...'
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
            gappedTextAnswers: this.gappedTextAnswers,
            progress: this.progress,
            timestamp: Date.now()
        };

        localStorage.setItem('b1PreliminaryProgress', JSON.stringify(progressData));
    }

    loadProgress() {
        const savedData = localStorage.getItem('b1PreliminaryProgress');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.currentSection = data.currentSection || 'reading-writing';
                this.timeRemaining = data.timeRemaining || this.timeRemaining;
                this.answers = data.answers || {};
                this.gappedTextAnswers = data.gappedTextAnswers || {};
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
            
            // Task selection
            if (key === 'selectedTask') {
                const taskOption = document.querySelector(`[data-task="${value}"]`);
                if (taskOption) {
                    taskOption.click();
                }
            }
        });

        // Restore gapped text answers
        Object.keys(this.gappedTextAnswers).forEach(gapNumber => {
            const value = this.gappedTextAnswers[gapNumber];
            const gapElement = document.getElementById(`gap-${gapNumber}`);
            const sentenceElement = document.getElementById(`option-${value}`);
            
            if (gapElement && sentenceElement) {
                gapElement.textContent = `(${gapNumber}) ${value}`;
                gapElement.classList.add('filled');
                sentenceElement.classList.add('used');
            }
        });
    }

    hasUnsavedChanges() {
        const savedData = localStorage.getItem('b1PreliminaryProgress');
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
            readingWriting: this.calculateReadingWritingScore(),
            listening: { score: 0, total: 25, percentage: 0 }, // Placeholder
            speaking: { score: 0, total: 25, percentage: 0 }, // Placeholder
            overall: { score: 0, total: 170, grade: 'Incomplete' }
        };

        // Calculate overall score (only reading & writing for now)
        results.overall.score = results.readingWriting.score;
        results.overall.percentage = (results.overall.score / 120) * 100; // Only R&W for now

        // Determine grade based on B1 Preliminary standards
        if (results.overall.percentage >= 85) {
            results.overall.grade = 'Pass with Distinction';
        } else if (results.overall.percentage >= 70) {
            results.overall.grade = 'Pass with Merit';
        } else if (results.overall.percentage >= 60) {
            results.overall.grade = 'Pass';
        } else if (results.overall.percentage >= 45) {
            results.overall.grade = 'Level A2';
        } else {
            results.overall.grade = 'Fail';
        }

        this.results = results;
    }

    calculateReadingWritingScore() {
        let readingScore = 0;
        let writingScore = 0;
        const readingTotal = 35; // Parts 1-7
        const writingTotal = 20; // Email + Part 2

        // Reading Parts 1-7
        Object.keys(this.answerKeys.reading).forEach(key => {
            const userAnswer = this.answers[key];
            const correctAnswer = this.answerKeys.reading[key];
            
            if (userAnswer && userAnswer.toString().toLowerCase().trim() === correctAnswer.toString().toLowerCase()) {
                readingScore++;
            }
        });

        // Writing tasks (basic scoring based on word count and content)
        const emailText = this.answers['email-text'] || '';
        const part2Text = this.answers['part2-text'] || '';

        // Email scoring (10 points max)
        if (emailText.trim().length > 0) {
            const emailWords = emailText.trim().split(/\s+/).length;
            if (emailWords >= 80 && emailWords <= 120) {
                writingScore += 8; // Good word count range
            } else if (emailWords >= 60 && emailWords <= 140) {
                writingScore += 6; // Acceptable range
            } else if (emailWords >= 40) {
                writingScore += 3; // Minimal content
            }
            
            // Basic content check (mentions addressing the notes)
            if (emailText.toLowerCase().includes('food') || 
                emailText.toLowerCase().includes('indoor') || 
                emailText.toLowerCase().includes('outdoor') ||
                emailText.toLowerCase().includes('decoration')) {
                writingScore += 2; // Content relevance
            }
        }

        // Part 2 scoring (10 points max)
        if (part2Text.trim().length > 0) {
            const part2Words = part2Text.trim().split(/\s+/).length;
            if (part2Words >= 80 && part2Words <= 120) {
                writingScore += 8; // Good word count range
            } else if (part2Words >= 60 && part2Words <= 140) {
                writingScore += 6; // Acceptable range
            } else if (part2Words >= 40) {
                writingScore += 3; // Minimal content
            }
            
            // Task-specific content check
            if (this.answers.selectedTask === 'story' && 
                part2Text.toLowerCase().includes('opened') && 
                part2Text.toLowerCase().includes('door')) {
                writingScore += 2;
            } else if (this.answers.selectedTask === 'article') {
                writingScore += 2;
            }
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
                    <h3>Overall Score: ${this.results.overall.score}/120</h3>
                    <div class="grade-badge grade-${this.results.overall.grade.toLowerCase().replace(/\s+/g, '-')}">
                        ${this.results.overall.grade}
                    </div>
                    <div class="percentage">${this.results.overall.percentage.toFixed(1)}%</div>
                </div>
            </div>

            <div class="skills-breakdown">
                <div class="skill-result">
                    <h4><i class="fas fa-book-pen"></i> Reading & Writing</h4>
                    <div class="score">${this.results.readingWriting.score}/${this.results.readingWriting.total} (${this.results.readingWriting.percentage.toFixed(1)}%)</div>
                    <div class="part-breakdown">
                        <span>Reading: ${this.results.readingWriting.breakdown.reading}/${this.results.readingWriting.breakdown.readingTotal}</span>
                        <span>Writing: ${this.results.readingWriting.breakdown.writing}/${this.results.readingWriting.breakdown.writingTotal}</span>
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
        const rw = this.results.readingWriting;
        let feedback = '<ul>';

        // Reading & Writing feedback
        if (rw.percentage >= 85) {
            feedback += '<li class="positive">✅ Excellent performance in Reading & Writing</li>';
        } else if (rw.percentage >= 70) {
            feedback += '<li class="positive">✅ Good performance with room for improvement</li>';
        } else if (rw.percentage >= 60) {
            feedback += '<li class="warning">⚠️ Adequate performance, focus on weaker areas</li>';
        } else {
            feedback += '<li class="negative">❌ Need significant improvement in reading and writing skills</li>';
        }

        // Specific feedback based on performance
        if (rw.breakdown.reading < rw.breakdown.readingTotal * 0.7) {
            feedback += '<li class="warning">📚 Practice reading comprehension and vocabulary building</li>';
        }

        if (rw.breakdown.writing < rw.breakdown.writingTotal * 0.7) {
            feedback += '<li class="warning">✍️ Work on writing structure, word count management, and task completion</li>';
        }

        // Gapped text specific feedback
        const gappedCorrect = Object.keys(this.gappedTextAnswers).length;
        if (gappedCorrect < 4) {
            feedback += '<li class="warning">🧩 Practice text coherence and logical flow (gapped text)</li>';
        }

        // Incomplete sections
        feedback += '<li class="neutral">🎧 Complete listening section for full assessment</li>';
        feedback += '<li class="neutral">🎤 Complete speaking section for full assessment</li>';

        feedback += '</ul>';
        return feedback;
    }

    toggleFAB() {
        const fabOptions = document.getElementById('fab-options');
        fabOptions.classList.toggle('active');
    }

    showHelp() {
        alert(`Cambridge B1 Preliminary Help:

Navigation:
• Use the section pills to navigate between exam parts
• Your progress is automatically saved
• Timer shows remaining time for the entire exam

Tips:
• Read instructions carefully for each part
• For gapped text: click sentence, then click gap to fill
• For writing: aim for about 100 words per task
• Manage your time effectively across all sections

Keyboard Shortcuts:
• Ctrl+S: Save progress
• Ctrl+P: Print
• Esc: Close modals`);
    }

    bookmarkQuestion() {
        alert('Question bookmarked! (Feature coming soon)');
    }

    openCalculator() {
        window.open('data:text/html,<html><head><title>Calculator</title></head><body><iframe src="https://www.google.com/search?q=calculator" width="100%" height="100%" frameborder="0"></iframe></body></html>', 'calculator', 'width=300,height=400');
    }

    closeResults() {
        document.getElementById('results-modal').classList.remove('active');
    }

    exportResults() {
        const resultsData = {
            timestamp: new Date().toISOString(),
            examType: 'B1_Preliminary',
            timeSpent: this.formatTime(140 * 60 - this.timeRemaining),
            ...this.results
        };

        const dataStr = JSON.stringify(resultsData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `B1_Preliminary_Results_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    retakeExam() {
        if (confirm('Are you sure you want to retake the exam? All progress will be lost.')) {
            localStorage.removeItem('b1PreliminaryProgress');
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
    simulator = new B1PreliminarySimulator();
    
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