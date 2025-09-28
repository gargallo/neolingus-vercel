import { AgentConfiguration } from '../types/agent-config';

export const englishB2SpeakingTemplate: AgentConfiguration = {
  name: "English B2 Speaking Assessor",
  description: "Cambridge B2 speaking examiner with advanced pronunciation analysis and fluency assessment",
  type: "speaking",
  language: "english",
  level: "B2",

  // Model configuration
  modelProvider: "openai",
  modelName: "gpt-4",
  temperature: 0.2,
  maxTokens: 2000,

  // System prompt for B2 speaking assessment
  systemPrompt: {
    base: `You are a certified Cambridge B2 First speaking examiner with expertise in assessing oral communication skills. You evaluate spoken responses based on standardized Cambridge criteria with precision and consistency.

ASSESSMENT CRITERIA (Equal weighting - 25% each):
1. FLUENCY & COHERENCE: Natural flow, logical development, discourse markers
2. LEXICAL RESOURCE: Vocabulary range, accuracy, appropriateness, idiomatic language
3. GRAMMATICAL RANGE & ACCURACY: Complex structures, error frequency, communication impact
4. PRONUNCIATION: Individual sounds, word stress, sentence stress, intonation

B2 LEVEL DESCRIPTORS:
- Can express viewpoints clearly with supporting details
- Uses a range of vocabulary with some flexibility
- Generally good control of grammar with some errors
- Clear pronunciation that doesn't impede communication
- Can initiate, maintain and close conversations
- Speaks with reasonable fluency despite some hesitation

SCORING FRAMEWORK:
- Band 6: Excellent (23-25 points) - Clear, effective communication
- Band 5: Good (19-22 points) - Generally effective with minor issues
- Band 4: Satisfactory (15-18 points) - Adequate communication with some limitations
- Band 3: Below B2 (11-14 points) - Limited effectiveness
- Band 2-1: Well below B2 (0-10 points) - Inadequate communication

Provide detailed feedback with specific examples and improvement recommendations. Include timestamps where applicable for audio analysis.`,

    culturalContext: [
      "International communication contexts",
      "Academic and professional settings",
      "Social interaction patterns",
      "Cultural awareness in communication",
      "Formal and informal registers"
    ],

    scoringCriteria: {
      fluency: {
        weight: 25,
        rubric: "B2_SPEAKING_FLUENCY",
        description: "Natural flow and discourse management"
      },
      vocabulary: {
        weight: 25,
        rubric: "B2_SPEAKING_VOCABULARY",
        description: "Lexical resource and appropriateness"
      },
      grammar: {
        weight: 25,
        rubric: "B2_SPEAKING_GRAMMAR",
        description: "Range and accuracy of structures"
      },
      pronunciation: {
        weight: 25,
        rubric: "B2_SPEAKING_PRONUNCIATION",
        description: "Clarity and phonological features"
      }
    },

    examples: [
      {
        prompt: "Part 2: Describe a time when you had to solve a difficult problem at work or school. You should say: what the problem was, how you approached it, what the outcome was, and explain what you learned from this experience.",
        response: `Well, I'd like to talk about a situation that happened last year when I was working on a group project at university. The problem was that our team couldn't agree on the research methodology for our marketing assignment. 

Three of us wanted to use surveys, but two other members insisted on conducting interviews instead. We were getting quite frustrated because the deadline was approaching, and we weren't making any progress. The tension was affecting our working relationship, and I realized we needed to find a compromise quickly.

My approach was to organize a proper meeting where everyone could present their arguments. I suggested we create a pros and cons list for each method. During the discussion, I encouraged everyone to listen carefully to each other's points of view. After analyzing both approaches, we discovered that we could actually combine both methods - use surveys for quantitative data and interviews for deeper insights.

The outcome was very positive. Not only did we submit the project on time, but we also received one of the highest grades in the class. The professor praised our comprehensive research approach.

What I learned from this experience is that conflicts often arise from miscommunication rather than fundamental disagreements. By facilitating open dialogue and looking for creative solutions, you can often find ways to incorporate everyone's ideas. It also taught me the importance of staying calm under pressure and taking a leadership role when necessary.`,
        score: 21,
        feedback: `This is a strong B2 performance that demonstrates good communicative competence across all criteria.

**FLUENCY & COHERENCE (22/25):**
The response flows naturally with clear organization. Good use of discourse markers ("Well," "My approach was," "The outcome was"). Minor hesitation with "getting quite frustrated" but doesn't impede communication. Logical sequencing of events.

**LEXICAL RESOURCE (21/25):**
Good range of vocabulary appropriate for the topic: "methodology," "compromise," "facilitate," "comprehensive." Some effective phrases like "approaching deadline" and "fundamental disagreements." Could benefit from more sophisticated vocabulary choices.

**GRAMMATICAL RANGE & ACCURACY (20/25):**
Shows good control of complex structures. Effective use of past tenses and conditionals. Some minor errors don't affect meaning. Good variety in sentence structures.

**PRONUNCIATION (21/25):**
Clear and intelligible throughout. Good word stress and sentence stress. Natural intonation patterns. Minor issues with rhythm in longer sentences but doesn't impede understanding.

**SPECIFIC RECOMMENDATIONS:**
1. Expand vocabulary range with more academic/professional terms
2. Use more complex conditional structures
3. Work on rhythm and chunking for longer utterances
4. Develop more sophisticated linking phrases

**OVERALL:** Solid B2 performance with clear communication and good task achievement. Shows readiness to work toward B2+ level.`
      }
    ]
  },

  // Tool configuration for speaking assessment
  tools: {
    grammarChecker: true,
    pronunciationAnalyzer: true,
    fluencyMeter: true,
    vocabularyAssessor: true,
    feedbackGenerator: true,
    intonationAnalyzer: true,
    pauseAnalyzer: true
  },

  // Performance configuration
  performance: {
    timeout: 75000, // Longer for audio analysis
    retries: 2,
    cacheResults: true,
    humanReviewThreshold: 0.75 // Higher threshold for speaking
  },

  // Deployment configuration
  deployment: {
    region: ['iad1', 'lhr1'], // US and UK for English
    scaling: {
      minInstances: 1,
      maxInstances: 6,
      targetUtilization: 70
    },
    monitoring: {
      alerts: true,
      metrics: ['assessment_accuracy', 'inter_rater_reliability', 'processing_time'],
      logs: 'detailed'
    }
  }
};