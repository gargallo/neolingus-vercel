# Cambridge A2 Key (KET) - Complete Exam Specification

## 📋 Overview

- **Exam Name**: Cambridge A2 Key (KET)
- **Level**: A2 (Elementary) 
- **Duration**: ~1.5 hours total
- **Skills Tested**: Reading & Writing, Listening, Speaking
- **Total Questions**: 32 + writing tasks
- **Provider**: Cambridge Assessment English

## 📚 Exam Structure

### Part 1: Reading & Writing (1 hour 10 minutes)

#### **Reading (Questions 1-30)**

**Part 1: Multiple Choice (Questions 1-6)**
- **Format**: 6 very short texts (signs, notices, messages)
- **Task**: Choose the correct explanation (A, B, or C)
- **Skills**: Understanding short public information
- **Time**: ~8 minutes

**Part 2: Matching (Questions 7-13)** 
- **Format**: 7 people descriptions + 8 options to choose from
- **Task**: Match each person to the most suitable option
- **Skills**: Understanding specific information and detail
- **Time**: ~10 minutes

**Part 3: Multiple Choice (Questions 14-20)**
- **Format**: Long text (email, article, etc.)
- **Task**: 7 multiple choice questions (A, B, C, or D)
- **Skills**: Understanding attitude, opinion, main idea
- **Time**: ~15 minutes

**Part 4: Multiple Choice Cloze (Questions 21-27)**
- **Format**: Text with 6 gaps
- **Task**: Choose correct word from 4 options (A, B, C, D)
- **Skills**: Grammar and vocabulary in context
- **Time**: ~10 minutes

**Part 5: Open Cloze (Questions 28-32)**
- **Format**: Text with 5 gaps
- **Task**: Write one word in each gap
- **Skills**: Grammar and vocabulary
- **Time**: ~7 minutes

#### **Writing (Questions 33-35)**

**Question 33: Sentence Transformations**
- **Format**: Complete 5 sentences using given words
- **Skills**: Grammar and vocabulary control
- **Word limit**: Complete the sentence only
- **Time**: ~5 minutes

**Questions 34-35: Email + Story Writing**

**Question 34: Email (25+ words)**
- **Format**: Respond to an email
- **Task**: Write a short email response
- **Word count**: At least 25 words
- **Skills**: Communicative writing
- **Time**: ~7 minutes

**Question 35: Story from Pictures (35+ words)**
- **Format**: Write a story based on 3 pictures
- **Task**: Tell the story shown in pictures
- **Word count**: At least 35 words
- **Skills**: Narrative writing
- **Time**: ~8 minutes

### Part 2: Listening (~30 minutes)

**Part 1: Multiple Choice (Questions 1-5)**
- **Format**: 5 short conversations or monologues
- **Task**: Choose best answer (A, B, or C)
- **Audio**: Heard twice
- **Skills**: Understanding specific information
- **Time**: ~8 minutes

**Part 2: Matching (Questions 6-10)**
- **Format**: 5 short monologues on same theme
- **Task**: Match to 8 given options (A-H)
- **Audio**: Heard twice
- **Skills**: Understanding gist and specific details
- **Time**: ~6 minutes

**Part 3: Multiple Choice (Questions 11-15)**
- **Format**: Conversation between two people
- **Task**: 5 multiple choice questions (A, B, or C)
- **Audio**: Heard twice
- **Skills**: Understanding attitude and opinion
- **Time**: ~8 minutes

**Part 4: Note Completion (Questions 16-20)**
- **Format**: Informational monologue
- **Task**: Complete notes with 1-3 words/numbers
- **Audio**: Heard twice
- **Skills**: Understanding and recording specific information
- **Time**: ~8 minutes

### Part 3: Speaking (~8-10 minutes per pair)

**Part 1: Interview (3-4 minutes)**
- **Format**: Individual questions to each candidate
- **Topics**: Personal information, likes/dislikes, experiences
- **Skills**: Giving personal information
- **Assessment**: Grammar, vocabulary, pronunciation, interactive communication

**Part 2: Collaborative Task (5-6 minutes)**
- **Format**: Discussion between two candidates
- **Task**: Discuss situation and make decision together
- **Materials**: Visual prompts provided
- **Skills**: Turn-taking, agreeing/disagreeing, making suggestions
- **Assessment**: Grammar, vocabulary, discourse management, pronunciation, interactive communication

## 🎯 Answer Keys & Solutions

### Reading Part 1 (Based on analyzed PDF)
1. B
2. C  
3. B
4. A
5. B
6. C

### Reading Part 2 (Matching)
7. E
8. A
9. H
10. F
11. D
12. C
13. B

### Reading Part 3 (Multiple Choice)
14. A
15. C
16. B
17. D
18. B
19. A
20. C

### Reading Part 4 (Cloze)
21. C (but)
22. A (where)
23. D (with)
24. B (decided)
25. C (ago)
26. A (find)
27. D (through)

### Reading Part 5 (Open Cloze)
28. to
29. the
30. was
31. it
32. have

### Writing Sample Answers

**Question 34: Email Response**
```
Hi Maria,
Thanks for your message! I'd love to come to your birthday party on Saturday. What time should I arrive? Should I bring anything special? I'm really excited to celebrate with you and meet your other friends.
See you soon!
[Your name]
```

**Question 35: Story from Pictures**
```
Last weekend, Tom decided to bake a cake for his mother's birthday. First, he bought all the ingredients at the supermarket. Then he went home and carefully followed the recipe. Finally, when his mother came home, she was very surprised and happy to see the beautiful chocolate cake. It was delicious!
```

## 🏗️ HTML Simulator Implementation Guide

### Required Components

#### 1. Timer Component
```javascript
const EXAM_DURATION = 70 * 60; // 70 minutes for Reading & Writing
const LISTENING_DURATION = 30 * 60; // 30 minutes for Listening
```

#### 2. Question Types to Implement

**Multiple Choice (A, B, C format)**
```html
<div class="question-item">
    <span class="question-number">1</span>
    <div class="options">
        <label><input type="radio" name="q1" value="A"> A) Option 1</label>
        <label><input type="radio" name="q1" value="B"> B) Option 2</label>
        <label><input type="radio" name="q1" value="C"> C) Option 3</label>
    </div>
</div>
```

**Open Cloze (Single word input)**
```html
<div class="gap-question">
    <span class="question-number">28</span>
    <input type="text" name="q28" placeholder="One word only" maxlength="20">
</div>
```

**Word Count Writing Areas**
```html
<div class="writing-area">
    <div class="word-counter">
        <span id="email-word-count">0</span> / 25+ words
    </div>
    <textarea id="email-text" placeholder="Write your email here..." rows="8"></textarea>
</div>
```

#### 3. Scoring Algorithm
```javascript
const scoringCriteria = {
    reading: {
        part1: { questions: 6, points: 1 },
        part2: { questions: 7, points: 1 },
        part3: { questions: 7, points: 1 },
        part4: { questions: 6, points: 1 },
        part5: { questions: 5, points: 1 }
    },
    writing: {
        part1: { questions: 5, points: 1 },
        email: { maxPoints: 5, criteria: ['content', 'organization', 'language'] },
        story: { maxPoints: 5, criteria: ['content', 'organization', 'language'] }
    },
    listening: {
        part1: { questions: 5, points: 1 },
        part2: { questions: 5, points: 1 },
        part3: { questions: 5, points: 1 },
        part4: { questions: 5, points: 1 }
    }
};
```

#### 4. Grade Boundaries
- **Grade A**: 140-150 points (93-100%)
- **Grade B**: 133-139 points (89-92%)
- **Grade C**: 120-132 points (80-88%)
- **Fail**: 0-119 points (0-79%)

### Audio Integration Requirements

#### File References
- Main audio file: `A2_Cambridge.mp3`
- Part-specific timing markers needed
- Replay functionality (each section played twice)

#### Audio Controls
```javascript
const audioTimestamps = {
    part1: { start: 0, end: 480 }, // 8 minutes
    part2: { start: 480, end: 840 }, // 6 minutes  
    part3: { start: 840, end: 1320 }, // 8 minutes
    part4: { start: 1320, end: 1800 } // 8 minutes
};
```

### Responsive Design Requirements

#### Mobile Adaptations
- Touch-friendly answer selection
- Optimized text input for mobile keyboards
- Swipe navigation between sections
- Collapsible text passages on small screens

#### Accessibility Features
- Screen reader compatible
- High contrast mode
- Font size adjustment
- Keyboard navigation support

## 🧪 Testing Requirements

### Automated Tests Needed
1. **Answer validation**: Correct answers marked properly
2. **Word count**: Writing tasks count words accurately
3. **Timer functionality**: Countdown works correctly
4. **Audio synchronization**: Parts play at correct times
5. **Score calculation**: Final grades computed correctly
6. **Data persistence**: Progress saved in localStorage
7. **Cross-browser compatibility**: Works in Chrome, Firefox, Safari, Edge

### Manual Testing Checklist
- [ ] All question types render correctly
- [ ] Audio plays and replays properly
- [ ] Writing areas enforce word limits
- [ ] Timer warnings appear at 15 and 5 minutes
- [ ] Results modal shows detailed breakdown
- [ ] Mobile experience is fully functional
- [ ] Offline mode works with service worker

## 📱 Mobile-Specific Considerations

### Layout Adaptations
- Single column layout for questions
- Larger touch targets (44px minimum)
- Sticky navigation bar
- Collapsible instructions

### Performance Optimizations  
- Lazy load audio files
- Compress images and icons
- Minimize JavaScript bundles
- Enable service worker caching

This specification provides a complete blueprint for implementing the Cambridge A2 Key simulator that AI can follow to create an exact replica of the official exam experience.