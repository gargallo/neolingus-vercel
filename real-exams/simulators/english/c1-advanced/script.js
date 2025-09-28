/**
 * NEOLINGUS C1 ADVANCED SIMULATOR
 * Advanced JavaScript functionality for Cambridge C1 Advanced exam simulation
 */

class C1AdvancedSimulator {
    constructor() {
        this.currentSection = 'reading-writing';
        this.timeRemaining = 210 * 60; // 3 hours 30 minutes in seconds
        this.isPaused = false;
        this.answers = {};
        this.progress = 0;
        this.totalQuestions = 56; // 53 reading + writing + 2 writing tasks + essay
        this.timerInterval = null;
        this.gappedTextAnswers = {};

        // Answer keys for automatic scoring
        this.answerKeys = {
            reading: {
                // Part 1: Multiple choice (3 texts, 6 questions)
                q1: 'A', q2: 'B', q3: 'A', q4: 'B', q5: 'B', q6: 'B',
                // Part 2: Gapped text (6 questions)
                q7: 'C', q8: 'A', q9: 'D', q10: 'E', q11: 'F', q12: 'G',
                // Part 3: Multiple choice long text (7 questions)
                q13: 'B', q14: 'B', q15: 'B', q16: 'B', q17: 'C', q18: 'B', q19: 'B',
                // Part 4: Multiple matching (15 questions)
                q20: 'D', q21: 'C', q22: 'A', q23: 'B', q24: 'C', q25: 'A',
                q26: 'D', q27: 'B', q28: 'A', q29: 'B', q30: 'B', q31: 'D',
                q32: 'A', q33: 'C', q34: 'B'
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

                // Warning at 30 minutes
                if (this.timeRemaining === 30 * 60) {
                    this.showTimeWarning('30 minutes remaining!');
                }

                // Warning at 15 minutes
                if (this.timeRemaining === 15 * 60) {
                    this.showTimeWarning('15 minutes remaining!');
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
                timerContainer.style.background = '#7c3aed'; // Purple (C1 theme)
            }
        }
    }

    toggleTimer() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pause-btn');
        
        if (this.isPaused) {
            pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
            pauseBtn.style.background = '#7c3aed'; // Purple
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
        const essayTextarea = document.getElementById('essay-text');
        const part2Textarea = document.getElementById('part2-text');

        if (essayTextarea) {
            this.setupWordCounter(essayTextarea, 'essay-word-count', 'essay-counter-fill', 220, 260);
        }

        if (part2Textarea) {
            this.setupWordCounter(part2Textarea, 'part2-word-count', 'part2-counter-fill', 220, 260);
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
                
                // Color coding for C1 level
                if (wordCount < minWords) {
                    counterElement.style.color = '#dc2626'; // Red - too few
                } else if (wordCount > maxWords + 20) {
                    counterElement.style.color = '#d97706'; // Orange - too many
                } else {
                    counterElement.style.color = '#7c3aed'; // Purple - good
                }
            }
            
            if (fillElement) {
                const maxDisplay = maxWords + 30;
                const percentage = Math.min((wordCount / maxDisplay) * 100, 100);
                fillElement.style.width = `${percentage}%`;
                
                if (wordCount >= minWords && wordCount <= maxWords + 20) {
                    fillElement.style.background = '#7c3aed'; // Purple - good range
                } else if (wordCount > maxWords + 20) {
                    fillElement.style.background = '#d97706'; // Orange - too many
                } else {
                    fillElement.style.background = '#dc2626'; // Red - too few
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
                220,
                260
            );
        } else if (textareaId === 'part2-text') {
            this.setupWordCounter(
                document.getElementById('part2-text'),
                'part2-word-count',
                'part2-counter-fill',
                220,
                260
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
                        letter: 'Dear Editor,\n\nI am writing to express my views on...',
                        proposal: 'PROPOSAL FOR WORKPLACE WELLNESS IMPROVEMENTS\n\nIntroduction\nThis proposal outlines...',
                        review: 'Review of [Technology Name]\n\nAs someone who has used...',
                        report: 'CAREER ASPIRATIONS SURVEY REPORT\n\nIntroduction\nThis report presents...'
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

        localStorage.setItem('c1AdvancedProgress', JSON.stringify(progressData));
    }

    loadProgress() {
        const savedData = localStorage.getItem('c1AdvancedProgress');
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
        const savedData = localStorage.getItem('c1AdvancedProgress');
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
            listening: { score: 0, total: 30, percentage: 0 }, // Placeholder
            speaking: { score: 0, total: 50, percentage: 0 }, // Placeholder
            overall: { score: 0, total: 210, grade: 'Incomplete' }
        };

        // Calculate overall score (only reading & writing for now)
        results.overall.score = results.readingWriting.score;
        results.overall.percentage = (results.overall.score / 130) * 100; // Only R&W for now

        // Determine grade based on C1 Advanced standards
        if (results.overall.percentage >= 90) {
            results.overall.grade = 'Grade A';
        } else if (results.overall.percentage >= 85) {
            results.overall.grade = 'Grade B';
        } else if (results.overall.percentage >= 80) {
            results.overall.grade = 'Grade C';
        } else if (results.overall.percentage >= 60) {
            results.overall.grade = 'Level B2';
        } else {
            results.overall.grade = 'Fail';
        }

        this.results = results;
    }

    calculateReadingWritingScore() {
        let readingScore = 0;
        let writingScore = 0;
        const readingTotal = 34; // Parts 1-4
        const writingTotal = 40; // Essay (20) + Part 2 (20)

        // Reading Parts 1-4
        Object.keys(this.answerKeys.reading).forEach(key => {
            const userAnswer = this.answers[key];
            const correctAnswer = this.answerKeys.reading[key];
            
            if (userAnswer && userAnswer.toString().toLowerCase().trim() === correctAnswer.toString().toLowerCase()) {
                readingScore++;
            }
        });

        // Writing tasks (sophisticated scoring for C1 level)
        const essayText = this.answers['essay-text'] || '';
        const part2Text = this.answers['part2-text'] || '';

        // Essay scoring (20 points max)
        if (essayText.trim().length > 0) {
            const essayWords = essayText.trim().split(/\s+/).length;
            if (essayWords >= 220 && essayWords <= 280) {
                writingScore += 16; // Good word count range
            } else if (essayWords >= 200 && essayWords <= 300) {
                writingScore += 12; // Acceptable range
            } else if (essayWords >= 150) {
                writingScore += 6; // Minimal content
            }
            
            // Content analysis for C1 level
            const essayLower = essayText.toLowerCase();
            let contentScore = 0;
            if (essayLower.includes('artificial intelligence') || essayLower.includes('ai')) contentScore++;
            if (essayLower.includes('employment') || essayLower.includes('job') || essayLower.includes('work')) contentScore++;
            if (essayLower.includes('opinion') || essayLower.includes('think') || essayLower.includes('believe')) contentScore++;
            if (essayLower.includes('however') || essayLower.includes('although') || essayLower.includes('despite')) contentScore++;
            
            writingScore += contentScore; // Up to 4 points for content relevance
        }

        // Part 2 scoring (20 points max)
        if (part2Text.trim().length > 0) {
            const part2Words = part2Text.trim().split(/\s+/).length;
            if (part2Words >= 220 && part2Words <= 280) {
                writingScore += 16; // Good word count range
            } else if (part2Words >= 200 && part2Words <= 300) {
                writingScore += 12; // Acceptable range
            } else if (part2Words >= 150) {
                writingScore += 6; // Minimal content
            }
            
            // Task-specific content check based on selected task
            const selectedTask = this.answers.selectedTask;
            let taskScore = 0;
            
            if (selectedTask === 'letter' && part2Text.toLowerCase().includes('dear')) taskScore += 2;
            if (selectedTask === 'proposal' && part2Text.toLowerCase().includes('proposal')) taskScore += 2;
            if (selectedTask === 'review' && part2Text.toLowerCase().includes('recommend')) taskScore += 2;
            if (selectedTask === 'report' && part2Text.toLowerCase().includes('survey')) taskScore += 2;
            
            writingScore += taskScore; // Up to 4 points for task completion
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
                    <h3>Overall Score: ${this.results.overall.score}/130</h3>
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
            feedback += '<li class="positive">✅ Outstanding performance in Reading & Writing</li>';
        } else if (rw.percentage >= 75) {
            feedback += '<li class="positive">✅ Strong performance with minor areas for improvement</li>';
        } else if (rw.percentage >= 65) {
            feedback += '<li class="warning">⚠️ Adequate performance, focus on advanced language skills</li>';
        } else {
            feedback += '<li class="negative">❌ Significant improvement needed in advanced English skills</li>';
        }

        // Specific feedback based on performance
        if (rw.breakdown.reading < rw.breakdown.readingTotal * 0.7) {
            feedback += '<li class="warning">📚 Practice advanced reading comprehension and critical thinking</li>';
        }

        if (rw.breakdown.writing < rw.breakdown.writingTotal * 0.7) {
            feedback += '<li class="warning">✍️ Work on essay structure, argumentation, and formal writing styles</li>';
        }

        // Gapped text specific feedback
        const gappedCorrect = Object.keys(this.gappedTextAnswers).length;
        if (gappedCorrect < 5) {
            feedback += '<li class="warning">🧩 Practice text coherence and advanced discourse markers</li>';
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
        alert(`Cambridge C1 Advanced Help:

Navigation:
• Use the section pills to navigate between exam parts
• Your progress is automatically saved
• Timer shows remaining time for the entire exam

Tips:
• Read instructions carefully for each part
• For gapped text: click sentence, then click gap to fill
• For writing: aim for 220-260 words per task
• Manage your time effectively across all sections
• Think critically about complex texts and arguments

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
            examType: 'C1_Advanced',
            timeSpent: this.formatTime(210 * 60 - this.timeRemaining),
            ...this.results
        };

        const dataStr = JSON.stringify(resultsData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `C1_Advanced_Results_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    retakeExam() {
        if (confirm('Are you sure you want to retake the exam? All progress will be lost.')) {
            localStorage.removeItem('c1AdvancedProgress');
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
    simulator = new C1AdvancedSimulator();
    
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