-- Migration: Scoring Engine Seed Data
-- Creates initial rubrics, correctors, and settings for the scoring engine
-- Date: 2025-09-22

-- Insert EOI Writing Rubrics
INSERT INTO scoring_rubrics (provider, level, task, version, json, is_active) VALUES
('EOI', 'B2', 'writing', 'EOI-B2-WR-v1', '{
  "version": "EOI-B2-WR-v1",
  "provider": "EOI",
  "level": "B2",
  "task": "writing",
  "criteria": [
    {
      "id": "content",
      "name": "Content & Ideas",
      "description": "Quality and relevance of content",
      "weight": 0.3,
      "bands": [
        {
          "score": 4,
          "descriptor": "Content is relevant, interesting and shows complexity of thought. Ideas are well-developed with supporting details.",
          "examples": ["Complex argumentation", "Multiple perspectives", "Cultural awareness"]
        },
        {
          "score": 3,
          "descriptor": "Content is mostly relevant and shows some complexity. Ideas are adequately developed.",
          "examples": ["Clear main ideas", "Some supporting details", "Generally appropriate content"]
        },
        {
          "score": 2,
          "descriptor": "Content is simple but relevant. Limited development of ideas.",
          "examples": ["Basic ideas", "Minimal support", "Some irrelevant content"]
        },
        {
          "score": 1,
          "descriptor": "Content is minimal or largely irrelevant. Very limited development.",
          "examples": ["Off-topic", "Insufficient content", "No clear ideas"]
        }
      ]
    },
    {
      "id": "organization",
      "name": "Organization & Coherence",
      "description": "Text structure and logical flow",
      "weight": 0.25,
      "bands": [
        {
          "score": 4,
          "descriptor": "Clear overall progression with effective paragraphing and linking. Coherent throughout.",
          "examples": ["Logical structure", "Smooth transitions", "Clear introduction/conclusion"]
        },
        {
          "score": 3,
          "descriptor": "Generally well organized with mostly effective paragraphing and linking.",
          "examples": ["Generally clear structure", "Most transitions work", "Adequate paragraphing"]
        },
        {
          "score": 2,
          "descriptor": "Some organizational structure but limited coherence and linking.",
          "examples": ["Basic structure", "Some unclear transitions", "Weak paragraphing"]
        },
        {
          "score": 1,
          "descriptor": "Little or no organizational structure. Ideas not logically connected.",
          "examples": ["No clear structure", "Confusing organization", "Ideas scattered"]
        }
      ]
    },
    {
      "id": "language",
      "name": "Language Use",
      "description": "Grammar, vocabulary, and language complexity",
      "weight": 0.3,
      "bands": [
        {
          "score": 4,
          "descriptor": "Wide range of vocabulary and grammar used flexibly and precisely. Few errors.",
          "examples": ["Complex structures", "Varied vocabulary", "Natural language use"]
        },
        {
          "score": 3,
          "descriptor": "Good range of vocabulary and grammar. Some errors but message is clear.",
          "examples": ["Generally accurate", "Some variety", "Clear communication"]
        },
        {
          "score": 2,
          "descriptor": "Limited range of vocabulary and grammar. Errors may impede communication.",
          "examples": ["Basic language", "Noticeable errors", "Simple structures"]
        },
        {
          "score": 1,
          "descriptor": "Very limited language. Frequent errors impede understanding.",
          "examples": ["Elementary language", "Many errors", "Communication unclear"]
        }
      ]
    },
    {
      "id": "register",
      "name": "Register & Style",
      "description": "Appropriateness of tone and style",
      "weight": 0.15,
      "bands": [
        {
          "score": 4,
          "descriptor": "Consistently appropriate register and style for the task and audience.",
          "examples": ["Perfect tone", "Appropriate formality", "Audience awareness"]
        },
        {
          "score": 3,
          "descriptor": "Generally appropriate register with minor inconsistencies.",
          "examples": ["Mostly appropriate", "Minor tone issues", "Generally suitable"]
        },
        {
          "score": 2,
          "descriptor": "Some awareness of register but inconsistent application.",
          "examples": ["Mixed register", "Some inappropriate choices", "Limited awareness"]
        },
        {
          "score": 1,
          "descriptor": "Little awareness of appropriate register for task and audience.",
          "examples": ["Inappropriate tone", "Wrong register", "No audience awareness"]
        }
      ]
    }
  ],
  "total_score": {
    "min": 4,
    "max": 16,
    "pass_threshold": 10
  },
  "instructions": "Assess the B2 level writing according to EOI standards",
  "time_limit": 3600
}', true),

('EOI', 'C1', 'writing', 'EOI-C1-WR-v1', '{
  "version": "EOI-C1-WR-v1",
  "provider": "EOI",
  "level": "C1",
  "task": "writing",
  "criteria": [
    {
      "id": "content",
      "name": "Content & Ideas",
      "description": "Complexity and depth of content",
      "weight": 0.35,
      "bands": [
        {
          "score": 5,
          "descriptor": "Ideas are complex, sophisticated and show deep understanding. Content is compelling and insightful.",
          "examples": ["Abstract concepts", "Critical analysis", "Original insights"]
        },
        {
          "score": 4,
          "descriptor": "Ideas are well-developed with good complexity. Shows clear understanding of topic.",
          "examples": ["Complex argumentation", "Good analysis", "Clear insights"]
        },
        {
          "score": 3,
          "descriptor": "Ideas are adequately developed with some complexity.",
          "examples": ["Some analysis", "Adequate development", "Basic insights"]
        },
        {
          "score": 2,
          "descriptor": "Ideas are simple with limited development.",
          "examples": ["Basic ideas", "Limited analysis", "Superficial treatment"]
        },
        {
          "score": 1,
          "descriptor": "Ideas are minimal or poorly developed.",
          "examples": ["Very basic", "No analysis", "Inadequate content"]
        }
      ]
    },
    {
      "id": "organization",
      "name": "Organization & Coherence",
      "description": "Sophisticated text structure",
      "weight": 0.25,
      "bands": [
        {
          "score": 5,
          "descriptor": "Sophisticated organization with seamless flow and effective rhetorical devices.",
          "examples": ["Complex structure", "Elegant transitions", "Rhetorical sophistication"]
        },
        {
          "score": 4,
          "descriptor": "Well-organized with clear progression and effective linking.",
          "examples": ["Clear structure", "Good transitions", "Logical flow"]
        },
        {
          "score": 3,
          "descriptor": "Generally well-organized with mostly clear progression.",
          "examples": ["Adequate structure", "Some transitions", "Generally clear"]
        },
        {
          "score": 2,
          "descriptor": "Some organizational problems affecting clarity.",
          "examples": ["Weak structure", "Poor transitions", "Some confusion"]
        },
        {
          "score": 1,
          "descriptor": "Poor organization impedes understanding.",
          "examples": ["No clear structure", "Confusing", "Incoherent"]
        }
      ]
    },
    {
      "id": "language",
      "name": "Language Use",
      "description": "Advanced language control",
      "weight": 0.25,
      "bands": [
        {
          "score": 5,
          "descriptor": "Sophisticated use of language with excellent control of complex structures.",
          "examples": ["Complex grammar", "Rich vocabulary", "Natural expression"]
        },
        {
          "score": 4,
          "descriptor": "Good control of language with variety in structures and vocabulary.",
          "examples": ["Good range", "Mostly accurate", "Some complexity"]
        },
        {
          "score": 3,
          "descriptor": "Adequate language control with some variety.",
          "examples": ["Reasonable range", "Generally accurate", "Some errors"]
        },
        {
          "score": 2,
          "descriptor": "Limited language range with noticeable errors.",
          "examples": ["Basic language", "Clear errors", "Limited variety"]
        },
        {
          "score": 1,
          "descriptor": "Very limited language with frequent errors.",
          "examples": ["Elementary level", "Many errors", "Poor control"]
        }
      ]
    },
    {
      "id": "register",
      "name": "Register & Style",
      "description": "Sophisticated style awareness",
      "weight": 0.15,
      "bands": [
        {
          "score": 5,
          "descriptor": "Excellent control of register with sophisticated stylistic devices.",
          "examples": ["Perfect tone", "Stylistic sophistication", "Cultural awareness"]
        },
        {
          "score": 4,
          "descriptor": "Good control of register with appropriate style.",
          "examples": ["Appropriate tone", "Good style", "Audience awareness"]
        },
        {
          "score": 3,
          "descriptor": "Generally appropriate register and style.",
          "examples": ["Mostly appropriate", "Adequate style", "Some awareness"]
        },
        {
          "score": 2,
          "descriptor": "Some problems with register or style.",
          "examples": ["Mixed register", "Style issues", "Limited awareness"]
        },
        {
          "score": 1,
          "descriptor": "Poor control of register and style.",
          "examples": ["Inappropriate", "No style awareness", "Wrong register"]
        }
      ]
    }
  ],
  "total_score": {
    "min": 4,
    "max": 20,
    "pass_threshold": 12
  },
  "instructions": "Assess the C1 level writing according to EOI standards",
  "time_limit": 3600
}', true);

-- Insert Cambridge Writing Rubrics
INSERT INTO scoring_rubrics (provider, level, task, version, json, is_active) VALUES
('Cambridge', 'B2', 'writing', 'CAM-B2-WR-v1', '{
  "version": "CAM-B2-WR-v1",
  "provider": "Cambridge",
  "level": "B2",
  "task": "writing",
  "criteria": [
    {
      "id": "content",
      "name": "Content",
      "description": "How well the candidate has fulfilled the task requirements",
      "weight": 0.25,
      "bands": [
        {
          "score": 5,
          "descriptor": "All content is relevant to the task. Target reader is fully informed.",
          "examples": ["Complete task coverage", "All points addressed", "Reader fully informed"]
        },
        {
          "score": 4,
          "descriptor": "Content is relevant to the task. Target reader is informed.",
          "examples": ["Good task coverage", "Most points addressed", "Reader informed"]
        },
        {
          "score": 3,
          "descriptor": "Content is generally relevant. Target reader is reasonably informed.",
          "examples": ["Adequate coverage", "Some points addressed", "Reader reasonably informed"]
        },
        {
          "score": 2,
          "descriptor": "Some content relevant. Limited information for reader.",
          "examples": ["Partial coverage", "Few points addressed", "Limited information"]
        },
        {
          "score": 1,
          "descriptor": "Limited content relevance. Minimal information for reader.",
          "examples": ["Poor coverage", "Few relevant points", "Minimal information"]
        }
      ]
    },
    {
      "id": "communicative_achievement",
      "name": "Communicative Achievement",
      "description": "How well the candidate handles the communicative task",
      "weight": 0.25,
      "bands": [
        {
          "score": 5,
          "descriptor": "Uses conventions of communicative task effectively to hold target reader'\''s attention.",
          "examples": ["Engaging style", "Perfect conventions", "Holds attention"]
        },
        {
          "score": 4,
          "descriptor": "Uses conventions of communicative task to hold target reader'\''s attention.",
          "examples": ["Good style", "Appropriate conventions", "Maintains interest"]
        },
        {
          "score": 3,
          "descriptor": "Uses conventions of communicative task generally successfully.",
          "examples": ["Adequate style", "Generally appropriate", "Some engagement"]
        },
        {
          "score": 2,
          "descriptor": "Limited control of conventions. Some attempt to engage reader.",
          "examples": ["Basic style", "Limited appropriateness", "Little engagement"]
        },
        {
          "score": 1,
          "descriptor": "Poor control of conventions. Little engagement with reader.",
          "examples": ["Inappropriate style", "Wrong conventions", "No engagement"]
        }
      ]
    },
    {
      "id": "organisation",
      "name": "Organisation",
      "description": "How well the text is organized and structured",
      "weight": 0.25,
      "bands": [
        {
          "score": 5,
          "descriptor": "Text is well organized with clear progression throughout. Cohesive devices used effectively.",
          "examples": ["Excellent structure", "Clear progression", "Effective linking"]
        },
        {
          "score": 4,
          "descriptor": "Text is well organized with generally clear progression. Good use of cohesive devices.",
          "examples": ["Good structure", "Clear progression", "Good linking"]
        },
        {
          "score": 3,
          "descriptor": "Text is generally organized with some progression. Adequate use of cohesive devices.",
          "examples": ["Adequate structure", "Some progression", "Some linking"]
        },
        {
          "score": 2,
          "descriptor": "Some organization but limited progression. Basic use of cohesive devices.",
          "examples": ["Basic structure", "Limited progression", "Basic linking"]
        },
        {
          "score": 1,
          "descriptor": "Little organization. Minimal use of cohesive devices.",
          "examples": ["Poor structure", "No progression", "Little linking"]
        }
      ]
    },
    {
      "id": "language",
      "name": "Language",
      "description": "Range and accuracy of vocabulary and grammar",
      "weight": 0.25,
      "bands": [
        {
          "score": 5,
          "descriptor": "Uses wide range of vocabulary and grammar naturally and appropriately. Minor errors.",
          "examples": ["Wide range", "Natural use", "Very few errors"]
        },
        {
          "score": 4,
          "descriptor": "Uses range of vocabulary and grammar appropriately. Some errors but meaning clear.",
          "examples": ["Good range", "Appropriate use", "Some errors"]
        },
        {
          "score": 3,
          "descriptor": "Uses adequate range of vocabulary and grammar. Errors may impede communication.",
          "examples": ["Adequate range", "Generally appropriate", "Noticeable errors"]
        },
        {
          "score": 2,
          "descriptor": "Uses limited range of vocabulary and grammar. Errors impede communication.",
          "examples": ["Limited range", "Basic use", "Clear errors"]
        },
        {
          "score": 1,
          "descriptor": "Uses very limited vocabulary and grammar. Frequent errors impede communication.",
          "examples": ["Very limited", "Elementary use", "Many errors"]
        }
      ]
    }
  ],
  "total_score": {
    "min": 4,
    "max": 20,
    "pass_threshold": 12
  },
  "instructions": "Cambridge B2 First writing assessment criteria",
  "time_limit": 4800
}', true);

-- Insert Speaking Rubrics
INSERT INTO scoring_rubrics (provider, level, task, version, json, is_active) VALUES
('EOI', 'B2', 'speaking', 'EOI-B2-SP-v1', '{
  "version": "EOI-B2-SP-v1",
  "provider": "EOI",
  "level": "B2",
  "task": "speaking",
  "criteria": [
    {
      "id": "fluency",
      "name": "Fluency & Interaction",
      "description": "Ability to speak smoothly and interact effectively",
      "weight": 0.25,
      "bands": [
        {
          "score": 4,
          "descriptor": "Speaks fluently with only occasional repetition or self-correction. Natural interaction.",
          "examples": ["Smooth delivery", "Natural pace", "Effective interaction"]
        },
        {
          "score": 3,
          "descriptor": "Generally fluent with some hesitation. Good interaction skills.",
          "examples": ["Generally smooth", "Some hesitation", "Good interaction"]
        },
        {
          "score": 2,
          "descriptor": "Some fluency but noticeable hesitation. Limited interaction.",
          "examples": ["Some hesitation", "Uneven pace", "Basic interaction"]
        },
        {
          "score": 1,
          "descriptor": "Limited fluency with frequent hesitation. Poor interaction.",
          "examples": ["Frequent hesitation", "Slow pace", "Minimal interaction"]
        }
      ]
    },
    {
      "id": "vocabulary",
      "name": "Lexical Resource",
      "description": "Range and accuracy of vocabulary",
      "weight": 0.25,
      "bands": [
        {
          "score": 4,
          "descriptor": "Wide range of vocabulary used flexibly and precisely.",
          "examples": ["Varied vocabulary", "Precise word choice", "Flexible use"]
        },
        {
          "score": 3,
          "descriptor": "Good range of vocabulary with generally accurate usage.",
          "examples": ["Good range", "Generally accurate", "Some variety"]
        },
        {
          "score": 2,
          "descriptor": "Adequate vocabulary for most topics with some inaccuracies.",
          "examples": ["Adequate range", "Some inaccuracy", "Limited variety"]
        },
        {
          "score": 1,
          "descriptor": "Limited vocabulary with frequent inaccuracies.",
          "examples": ["Basic vocabulary", "Many errors", "Very limited"]
        }
      ]
    },
    {
      "id": "grammar",
      "name": "Grammatical Range & Accuracy",
      "description": "Complexity and accuracy of grammar",
      "weight": 0.25,
      "bands": [
        {
          "score": 4,
          "descriptor": "Wide range of grammatical structures used accurately and appropriately.",
          "examples": ["Complex structures", "High accuracy", "Natural use"]
        },
        {
          "score": 3,
          "descriptor": "Good range of structures with generally good control.",
          "examples": ["Good range", "Generally accurate", "Some complexity"]
        },
        {
          "score": 2,
          "descriptor": "Adequate range of structures with some errors.",
          "examples": ["Basic structures", "Some errors", "Limited complexity"]
        },
        {
          "score": 1,
          "descriptor": "Limited grammatical range with frequent errors.",
          "examples": ["Very basic", "Many errors", "No complexity"]
        }
      ]
    },
    {
      "id": "pronunciation",
      "name": "Pronunciation",
      "description": "Clarity and intelligibility of speech",
      "weight": 0.25,
      "bands": [
        {
          "score": 4,
          "descriptor": "Clear pronunciation with natural rhythm and stress. Easily understood.",
          "examples": ["Very clear", "Natural rhythm", "Easily understood"]
        },
        {
          "score": 3,
          "descriptor": "Generally clear pronunciation. Mostly easily understood.",
          "examples": ["Generally clear", "Some rhythm issues", "Mostly understood"]
        },
        {
          "score": 2,
          "descriptor": "Some pronunciation problems but generally intelligible.",
          "examples": ["Some unclear", "Rhythm problems", "Generally intelligible"]
        },
        {
          "score": 1,
          "descriptor": "Pronunciation problems impede understanding.",
          "examples": ["Often unclear", "Poor rhythm", "Hard to understand"]
        }
      ]
    }
  ],
  "total_score": {
    "min": 4,
    "max": 16,
    "pass_threshold": 10
  },
  "instructions": "EOI B2 speaking assessment criteria",
  "time_limit": 900
}', true);

-- Insert Default Correctors
INSERT INTO scoring_correctors (name, description, provider, level, task, committee, model_config, prompt_version, active) VALUES
('EOI-B2-Writing-Standard', 'Standard corrector for EOI B2 writing tasks', 'EOI', 'B2', 'writing', '[
  {
    "provider": "openai",
    "name": "gpt-4o-mini",
    "temperature": 0.0,
    "seed": 42,
    "weight": 0.6
  },
  {
    "provider": "deepseek",
    "name": "deepseek-chat",
    "temperature": 0.0,
    "seed": 42,
    "weight": 0.4
  }
]', '{
  "max_tokens": 2000,
  "temperature": 0.0,
  "response_format": "json"
}', 'PROMPT_WR_v1', true),

('EOI-C1-Writing-Advanced', 'Advanced corrector for EOI C1 writing tasks', 'EOI', 'C1', 'writing', '[
  {
    "provider": "openai",
    "name": "gpt-4o-mini",
    "temperature": 0.0,
    "seed": 42,
    "weight": 0.5
  },
  {
    "provider": "deepseek",
    "name": "deepseek-chat",
    "temperature": 0.0,
    "seed": 42,
    "weight": 0.3
  },
  {
    "provider": "anthropic",
    "name": "claude-3-haiku",
    "temperature": 0.0,
    "seed": 42,
    "weight": 0.2
  }
]', '{
  "max_tokens": 3000,
  "temperature": 0.0,
  "response_format": "json"
}', 'PROMPT_WR_v1', true),

('Cambridge-B2-Writing-Standard', 'Standard corrector for Cambridge B2 writing', 'Cambridge', 'B2', 'writing', '[
  {
    "provider": "openai",
    "name": "gpt-4o-mini",
    "temperature": 0.0,
    "seed": 42,
    "weight": 0.7
  },
  {
    "provider": "deepseek",
    "name": "deepseek-chat",
    "temperature": 0.0,
    "seed": 42,
    "weight": 0.3
  }
]', '{
  "max_tokens": 2000,
  "temperature": 0.0,
  "response_format": "json"
}', 'PROMPT_WR_v1', true),

('EOI-B2-Speaking-Standard', 'Standard corrector for EOI B2 speaking tasks', 'EOI', 'B2', 'speaking', '[
  {
    "provider": "openai",
    "name": "gpt-4o-mini",
    "temperature": 0.0,
    "seed": 42,
    "weight": 0.8
  },
  {
    "provider": "deepseek",
    "name": "deepseek-chat",
    "temperature": 0.0,
    "seed": 42,
    "weight": 0.2
  }
]', '{
  "max_tokens": 1500,
  "temperature": 0.0,
  "response_format": "json"
}', 'PROMPT_SP_v1', true);

-- Insert Default Settings for Common Tenants
INSERT INTO scoring_settings (tenant_id, defaults, weights, equivalences) VALUES
('default', '{
  "model_name": "gpt-4o-mini",
  "committee": [
    {"provider": "openai", "name": "gpt-4o-mini", "weight": 0.6},
    {"provider": "deepseek", "name": "deepseek-chat", "weight": 0.4}
  ],
  "timeout": 60000,
  "retries": 2,
  "quality_threshold": 0.8
}', '{
  "EOI": {"writing": 1.0, "speaking": 1.0, "reading": 1.0, "listening": 1.0},
  "Cambridge": {"writing": 1.0, "speaking": 1.0, "reading": 1.0, "listening": 1.0, "use_of_english": 1.0},
  "JQCV": {"writing": 1.0, "speaking": 1.0, "reading": 1.0, "listening": 1.0},
  "Cervantes": {"writing": 1.0, "speaking": 1.0, "reading": 1.0, "listening": 1.0}
}', '{
  "EOI_to_CEFR": {
    "A1": {"min": 0, "max": 39}, "A2": {"min": 40, "max": 59},
    "B1": {"min": 60, "max": 69}, "B2": {"min": 70, "max": 79},
    "C1": {"min": 80, "max": 89}, "C2": {"min": 90, "max": 100}
  },
  "Cambridge_to_CEFR": {
    "A2": {"min": 120, "max": 139}, "B1": {"min": 140, "max": 159},
    "B2": {"min": 160, "max": 179}, "C1": {"min": 180, "max": 199},
    "C2": {"min": 200, "max": 230}
  }
}'),

('neolingus', '{
  "model_name": "gpt-4o-mini",
  "committee": [
    {"provider": "openai", "name": "gpt-4o-mini", "weight": 0.5},
    {"provider": "deepseek", "name": "deepseek-chat", "weight": 0.3},
    {"provider": "anthropic", "name": "claude-3-haiku", "weight": 0.2}
  ],
  "timeout": 90000,
  "retries": 3,
  "quality_threshold": 0.85,
  "enable_ai_feedback": true,
  "enable_score_appeals": true
}', '{
  "EOI": {"writing": 1.2, "speaking": 1.1, "reading": 1.0, "listening": 1.0},
  "Cambridge": {"writing": 1.0, "speaking": 1.0, "reading": 1.0, "listening": 1.0, "use_of_english": 0.9},
  "JQCV": {"writing": 1.1, "speaking": 1.0, "reading": 1.0, "listening": 1.0},
  "Cervantes": {"writing": 1.0, "speaking": 1.0, "reading": 1.0, "listening": 1.0}
}', '{
  "EOI_to_CEFR": {
    "A1": {"min": 0, "max": 39}, "A2": {"min": 40, "max": 59},
    "B1": {"min": 60, "max": 69}, "B2": {"min": 70, "max": 79},
    "C1": {"min": 80, "max": 89}, "C2": {"min": 90, "max": 100}
  },
  "Cambridge_to_CEFR": {
    "A2": {"min": 120, "max": 139}, "B1": {"min": 140, "max": 159},
    "B2": {"min": 160, "max": 179}, "C1": {"min": 180, "max": 199},
    "C2": {"min": 200, "max": 230}
  },
  "custom_scales": {
    "percentage": {"min": 0, "max": 100},
    "points_20": {"min": 0, "max": 20},
    "grade_letter": {"A": 90, "B": 80, "C": 70, "D": 60, "F": 0}
  }
}');

-- Comments
COMMENT ON TABLE scoring_rubrics IS 'Contains seed data for standard rubrics from major certification providers';
COMMENT ON TABLE scoring_correctors IS 'Contains default corrector configurations for common provider/level/task combinations';
COMMENT ON TABLE scoring_settings IS 'Contains tenant-specific settings with sensible defaults for scoring behavior';