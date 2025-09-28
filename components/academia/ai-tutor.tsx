"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TutorMessage } from "@/lib/exam-engine/types";
import { aiTutorService } from "@/lib/ai-agents/ai-tutor-service";
import { getRealtimeManager } from "@/utils/supabase/realtime";

// Types for AI Tutor
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    userLevel?: string;
    language?: string;
    skill?: string;
    suggestions?: string[];
    resources?: Array<{
      type: string;
      title: string;
      url: string;
    }>;
    exercises?: Array<{
      type: string;
      title: string;
      words?: Array<{
        correct: string;
        incorrect: string;
      }>;
      question?: string;
      options?: string[];
      correctAnswer?: string;
    }>;
    quickReplies?: string[];
  };
}

interface UserProfile {
  id: string;
  name: string;
  level: string;
  language: string;
  preferences: {
    aiPersonality: string;
    responseLength: string;
    includeExamples: boolean;
    voiceEnabled: boolean;
    language: string;
  };
  learningGoals: string[];
  weakAreas: string[];
  strengths: string[];
}

interface AITutorProps {
  chatHistory?: ChatMessage[];
  userProfile?: UserProfile;
  sessionId?: string;
  userId?: string;
  courseId?: string;
  initialMessages?: TutorMessage[];
  voiceEnabled?: boolean;
  isTyping?: boolean;
  isLoading?: boolean;
  error?: string | null;
  networkError?: boolean;
  voiceInputActive?: boolean;
  voiceError?: string | null;
  onSendMessage?: (message: { content: string; role: string; metadata: any }) => void;
  onStartVoiceInput?: () => void;
  onSpeak?: (text: string) => void;
  onSuggestionClick?: (suggestion: string) => void;
  onExerciseComplete?: (result: { exercise: any; answer: string; correct: boolean }) => void;
  onContextUpdate?: (context: { currentTopic: string; userNeeds: string[]; suggestedActions: string[] }) => void;
  onProgressUpdate?: (progress: { skill: string; activity: string; duration: number; interaction_count: number }) => void;
  onTyping?: (isTyping: boolean) => void;
}

// Export for testing
export { AITutorProps, ChatMessage, UserProfile };

export function AITutor({
  chatHistory = [],
  userProfile,
  sessionId: initialSessionId,
  userId,
  courseId,
  initialMessages = [],
  voiceEnabled = false,
  isTyping = false,
  isLoading = false,
  error = null,
  networkError = false,
  voiceInputActive = false,
  voiceError = null,
  onSendMessage,
  onStartVoiceInput,
  onSpeak,
  onSuggestionClick,
  onExerciseComplete,
  onContextUpdate,
  onProgressUpdate,
  onTyping,
}: AITutorProps) {
  const [sessionId, setSessionId] = useState<string | null>(
    initialSessionId || null
  );
  const [messages, setMessages] = useState<ChatMessage[]>(
    chatHistory.length > 0 ? chatHistory : []
  );
  const [inputMessage, setInputMessage] = useState("");
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [interactionCount, setInteractionCount] = useState(0);
  const [sessionStartTime] = useState(Date.now());
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const realtimeManager = getRealtimeManager();
  
  // Use provided states or internal states
  const effectiveLoading = isLoading ?? internalLoading;
  const effectiveError = error ?? internalError;

  // Responsive design detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update messages when chatHistory changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      setMessages(chatHistory);
    }
  }, [chatHistory]);

  // Context and progress tracking
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.metadata?.skill) {
        setCurrentTopic(lastMessage.metadata.skill);
        
        // Update context
        if (onContextUpdate) {
          onContextUpdate({
            currentTopic: lastMessage.metadata.skill,
            userNeeds: [lastMessage.content.slice(0, 50)],
            suggestedActions: lastMessage.metadata.suggestions || []
          });
        }
      }
      
      // Update progress
      if (onProgressUpdate) {
        onProgressUpdate({
          skill: currentTopic || 'pronunciation',
          activity: 'ai_tutoring',
          duration: Math.floor((Date.now() - sessionStartTime) / 1000),
          interaction_count: interactionCount
        });
      }
    }
  }, [messages, currentTopic, interactionCount, sessionStartTime, onContextUpdate, onProgressUpdate]);

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (sessionId) {
      console.log("Setting up real-time features for tutor session:", sessionId);
    }

    return () => {
      // Clean up subscriptions
    };
  }, [sessionId]);

  const handleNewMessage = (message: TutorMessage) => {
    // Handle real-time message updates
    const chatMessage: ChatMessage = {
      id: message.id,
      role: message.sender === 'user' ? 'user' : 'assistant',
      content: message.content,
      timestamp: new Date(message.timestamp),
    };
    setMessages((prev) => [...prev, chatMessage]);
  };

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || effectiveLoading) return;

    try {
      setInternalLoading(true);
      setInternalError(null);
      setInteractionCount(prev => prev + 1);

      // Create message metadata
      const messageMetadata = {
        userLevel: userProfile?.level || 'B2',
        language: userProfile?.language || 'english',
        timestamp: Date.now()
      };

      // Call external handler if provided
      if (onSendMessage) {
        onSendMessage({
          content: inputMessage,
          role: 'user',
          metadata: messageMetadata
        });
        setInputMessage("");
        return;
      }

      // Internal message handling
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        role: "user",
        content: inputMessage,
        timestamp: new Date(),
        metadata: messageMetadata
      };

      setMessages((prev) => [...prev, userMessage]);
      const currentMessage = inputMessage;
      setInputMessage("");
      
      // Trigger typing event
      if (onTyping) {
        onTyping(false);
      }

      // Create session if it doesn't exist
      let currentSessionId = sessionId;
      if (!currentSessionId && userId && courseId) {
        try {
          const session = await aiTutorService.createTutorSession(
            userId,
            courseId,
            "General tutoring"
          );
          currentSessionId = session.id;
          setSessionId(currentSessionId);
        } catch (sessionError) {
          console.error('Failed to create session:', sessionError);
          // Continue without session for demo purposes
          currentSessionId = `demo_${Date.now()}`;
          setSessionId(currentSessionId);
        }
      }

      // Send message to AI tutor or mock response
      let aiResponse;
      if (currentSessionId && currentSessionId.startsWith('demo_')) {
        // Mock response for demo
        aiResponse = {
          id: `response_${Date.now()}`,
          content: `Thank you for your message: "${currentMessage}". This is a demo response. In a real implementation, this would connect to our AI tutoring service.`,
          timestamp: new Date().toISOString(),
          metadata: {
            suggestions: ['Tell me more', 'Give examples', 'Practice this'],
            resources: [{
              type: 'exercise',
              title: 'Related Practice',
              url: '#practice'
            }]
          }
        };
      } else if (currentSessionId) {
        try {
          aiResponse = await aiTutorService.sendMessage(
            currentSessionId,
            currentMessage
          );
        } catch (serviceError) {
          console.error('AI service error:', serviceError);
          // Fallback to mock response
          aiResponse = {
            id: `fallback_${Date.now()}`,
            content: "I'm having trouble connecting to the AI service right now. Please try again later.",
            timestamp: new Date().toISOString()
          };
        }
      }

      if (aiResponse) {
        // Add AI response to UI
        const aiMessage: ChatMessage = {
          id: aiResponse.id,
          role: "assistant",
          content: aiResponse.content,
          timestamp: new Date(aiResponse.timestamp || Date.now()),
          metadata: aiResponse.metadata || {}
        };

        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (err) {
      console.error('Send message error:', err);
      setInternalError(err instanceof Error ? err.message : "Failed to send message");
      // Remove the user message if it failed to send
      setMessages((prev) =>
        prev.filter((msg) => !msg.id.includes(`${Date.now()}_user`))
      );
    } finally {
      setInternalLoading(false);
    }
  }, [inputMessage, effectiveLoading, onSendMessage, userProfile, sessionId, userId, courseId, onTyping]);

  const handleEndSession = async () => {
    try {
      if (sessionId) {
        await aiTutorService.endTutoringSession(sessionId);
        router.push("/dashboard/dashboard");
      }
    } catch (err) {
      setInternalError(err instanceof Error ? err.message : "Failed to end session");
    }
  };

  // Voice input handlers
  const handleStartVoiceInput = useCallback(() => {
    if (onStartVoiceInput) {
      onStartVoiceInput();
    }
  }, [onStartVoiceInput]);

  const handleSpeak = useCallback((text: string) => {
    if (onSpeak) {
      onSpeak(text);
    }
  }, [onSpeak]);

  // Suggestion click handler
  const handleSuggestionClick = useCallback((suggestion: string) => {
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    } else {
      // Default behavior: add suggestion to input
      setInputMessage(suggestion);
    }
  }, [onSuggestionClick]);

  // Exercise completion handler
  const handleExerciseComplete = useCallback((exercise: any, answer: string) => {
    const correct = answer === exercise.correctAnswer;
    if (onExerciseComplete) {
      onExerciseComplete({ exercise, answer, correct });
    }
  }, [onExerciseComplete]);

  // Typing handler with debouncing
  const handleTyping = useCallback((value: string) => {
    setInputMessage(value);
    if (onTyping) {
      onTyping(value.length > 0);
    }
  }, [onTyping]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === "Enter" && e.shiftKey) {
      // Allow line breaks
      return;
    }
  };

  return (
    <main className={`max-w-4xl mx-auto px-4 py-8 ${isMobile ? 'mobile-layout' : ''}`} aria-label="AI Tutor Chat Interface">
      {/* Tutor Header */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              AI Tutor
            </h1>
            <p className="text-gray-600 mt-1">
              Get personalized help with your language learning
            </p>
            {userProfile && (
              <div className="mt-2 flex items-center space-x-2">
                <span className="text-sm text-gray-500">Level: {userProfile.level}</span>
                <span className="text-sm text-gray-500">Language: {userProfile.language}</span>
                {userProfile.preferences.voiceEnabled && voiceEnabled && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Voice Enabled
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {voiceEnabled && (
              <button
                onClick={handleStartVoiceInput}
                disabled={voiceInputActive}
                className={`p-2 rounded-full transition-colors ${
                  voiceInputActive
                    ? 'bg-red-100 text-red-600'
                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                }`}
                aria-label="Voice input"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </button>
            )}
            <button
              onClick={handleEndSession}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              End Session
            </button>
          </div>
        </div>
      </div>

      {/* Error States */}
      {effectiveError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" role="alert">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-600 mt-1">{effectiveError}</p>
          <button
            onClick={() => setInternalError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            aria-label="Retry"
          >
            Retry
          </button>
        </div>
      )}
      
      {networkError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6" role="alert">
          <h3 className="text-yellow-800 font-medium">Connection Issue</h3>
          <p className="text-yellow-600 mt-1">Please check your internet connection and try again.</p>
        </div>
      )}
      
      {voiceError && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6" role="alert">
          <h3 className="text-orange-800 font-medium">Voice Input Error</h3>
          <p className="text-orange-600 mt-1">{voiceError}</p>
        </div>
      )}
      
      {/* Voice Status */}
      {voiceInputActive && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6" data-testid="voice-status">
          <div className="flex items-center">
            <div className="animate-pulse w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <p className="text-blue-800">Listening for your voice...</p>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        {isTyping && (
          <div className="mb-4" data-testid="typing-indicator">
            <div className="flex items-center text-gray-500 text-sm">
              <div className="flex space-x-1 mr-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span>AI tutor is typing...</span>
            </div>
          </div>
        )}
        <div className="space-y-6" role="log" aria-label="Chat history">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Start a conversation with your AI Tutor!
              </h3>
              <p className="text-gray-600">
                Ask me anything about your language learning journey.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                } ${isMobile ? 'compact-layout' : ''}`}
                data-testid="chat-message"
              >
                <div
                  className={`max-w-3xl rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-800 rounded-bl-none"
                  }`}
                >
                  {/* Message avatar for assistant */}
                  {message.role === "assistant" && (
                    <div className="flex items-start space-x-2 mb-2">
                      <img 
                        src="/api/placeholder-avatar-ai.svg" 
                        alt="AI Tutor avatar" 
                        className="w-6 h-6 rounded-full"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236B7280"><circle cx="12" cy="12" r="10"/></svg>';
                        }}
                      />
                      <span className="text-xs text-gray-600 font-medium">AI Tutor</span>
                    </div>
                  )}
                  
                  {/* Message content */}
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Voice controls */}
                  {voiceEnabled && message.role === "assistant" && (
                    <button
                      onClick={() => handleSpeak(message.content)}
                      className="mt-2 text-xs text-gray-500 hover:text-blue-600 underline"
                      aria-label="Speak message"
                    >
                      🔊 Speak
                    </button>
                  )}
                  
                  {/* Quick replies */}
                  {message.metadata?.quickReplies && message.metadata.quickReplies.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.metadata.quickReplies.map((reply, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(reply)}
                          className="px-3 py-1 bg-white text-gray-700 rounded-full text-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Exercises */}
                  {message.metadata?.exercises && message.metadata.exercises.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {message.metadata.exercises.map((exercise, exerciseIndex) => (
                        <div key={exerciseIndex} className="bg-white rounded-lg p-3 border">
                          <h4 className="font-medium text-gray-900 mb-2">{exercise.title}</h4>
                          {exercise.question && (
                            <p className="text-sm text-gray-700 mb-3">{exercise.question}</p>
                          )}
                          {exercise.type === 'multiple_choice' && exercise.options && (
                            <div className="space-y-2">
                              {exercise.options.map((option, optionIndex) => (
                                <label key={optionIndex} className="flex items-center">
                                  <input
                                    type="radio"
                                    name={`exercise-${exerciseIndex}`}
                                    value={option}
                                    className="mr-2"
                                  />
                                  <span className="text-sm">{option}</span>
                                </label>
                              ))}
                              <button
                                onClick={() => {
                                  const selectedOption = document.querySelector(`input[name="exercise-${exerciseIndex}"]:checked`) as HTMLInputElement;
                                  if (selectedOption) {
                                    handleExerciseComplete(exercise, selectedOption.value);
                                  }
                                }}
                                className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                                aria-label="Submit answer"
                              >
                                Submit Answer
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Resources */}
                  {message.metadata?.resources && message.metadata.resources.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-xs font-medium text-gray-600 mb-2">Helpful Resources:</h4>
                      <div className="space-y-1">
                        {message.metadata.resources.map((resource, index) => (
                          <a
                            key={index}
                            href={resource.url}
                            className="block text-xs text-blue-600 hover:text-blue-800 underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {resource.title} →
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Timestamp */}
                  <div
                    className={`text-xs mt-2 ${
                      message.role === "user"
                        ? "text-blue-200"
                        : "text-gray-500"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex space-x-4">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message here... (Press Enter to send)"
              rows={3}
              disabled={effectiveLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              aria-label="Type your message"
            />
          </div>
          <div className="flex flex-col items-end space-y-2">
            {/* Voice Input Button */}
            {voiceEnabled && (
              <button
                onClick={handleStartVoiceInput}
                disabled={voiceInputActive || effectiveLoading}
                className={`p-2 rounded-lg transition-colors ${
                  voiceInputActive
                    ? 'bg-red-100 text-red-600'
                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                } disabled:opacity-50`}
                aria-label="Voice input"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </button>
            )}
            
            {/* Text-to-Speech Button */}
            {voiceEnabled && (
              <button
                onClick={() => {
                  const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
                  if (lastAssistantMessage) {
                    handleSpeak(lastAssistantMessage.content);
                  }
                }}
                disabled={messages.filter(m => m.role === 'assistant').length === 0}
                className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors disabled:opacity-50"
                aria-label="Text to speech"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
              </button>
            )}
            
            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={effectiveLoading || !inputMessage.trim()}
              className={`h-12 px-6 rounded-lg font-medium ${
                effectiveLoading || !inputMessage.trim()
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
              aria-label="Send message"
            >
              {effectiveLoading ? (
                <div data-testid="loading-spinner">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              ) : (
                "Send"
              )}
            </button>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          <p>
            Tip: Be specific about what you need help with. For example: "Can
            you explain the difference between ser and estar in Spanish?"
          </p>
          {userProfile?.level && (
            <p className="mt-1 text-xs text-blue-600">
              Based on your level ({userProfile.level}), I'll adjust my responses accordingly.
            </p>
          )}
          {userProfile?.preferences.includeExamples && (
            <p className="mt-1 text-xs text-green-600">
              Recommended for you: I'll include plenty of examples in my responses.
            </p>
          )}
        </div>
      </div>
      
      {/* Loading status */}
      {effectiveLoading && (
        <div className="mt-4 text-center text-sm text-gray-500">
          <span>Generating response...</span>
        </div>
      )}
      
      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {messages.length > 0 && messages[messages.length - 1].role === 'assistant' && (
          <span>New message from AI tutor received</span>
        )}
      </div>
    </main>
  );
}

export default AITutor;