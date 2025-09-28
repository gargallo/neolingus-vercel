"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Volume2,
  Image as ImageIcon,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import type { ExamContent, UserAnswer } from "@/types/exam-system";

interface QuestionRendererProps {
  content: ExamContent;
  userAnswer?: UserAnswer;
  onAnswer: (answer: any) => void;
  showFeedback: boolean;
  readonly: boolean;
  timeLimit?: number;
}

export function QuestionRenderer({
  content,
  userAnswer,
  onAnswer,
  showFeedback,
  readonly,
  timeLimit
}: QuestionRendererProps) {
  const [localAnswer, setLocalAnswer] = useState<any>(userAnswer?.answer || null);
  const [timeSpent, setTimeSpent] = useState(0);

  // Update local answer when userAnswer changes
  useEffect(() => {
    setLocalAnswer(userAnswer?.answer || null);
  }, [userAnswer]);

  // Track time spent on question
  useEffect(() => {
    if (timeLimit && !readonly) {
      const interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timeLimit, readonly]);

  const handleAnswerChange = (answer: any) => {
    if (readonly) return;

    setLocalAnswer(answer);
    onAnswer(answer);
  };

  const renderQuestionText = () => {
    if (!content.question_text && !content.question_data.text) {
      return null;
    }

    const text = content.question_text || content.question_data.text || '';

    return (
      <div className="prose dark:prose-invert max-w-none">
        <div
          className="text-gray-900 dark:text-white leading-relaxed"
          dangerouslySetInnerHTML={{ __html: text }}
        />
      </div>
    );
  };

  const renderMediaContent = () => {
    if (!content.media_urls || Object.keys(content.media_urls).length === 0) {
      return null;
    }

    return (
      <div className="space-y-4">
        {/* Audio */}
        {content.media_urls.audio && content.media_urls.audio.length > 0 && (
          <div className="space-y-2">
            {content.media_urls.audio.map((audioUrl, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Volume2 className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <audio controls className="w-full">
                    <source src={audioUrl} type="audio/mpeg" />
                    Tu navegador no soporta audio.
                  </audio>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Images */}
        {content.media_urls.images && content.media_urls.images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {content.media_urls.images.map((imageUrl, index) => (
              <div key={index} className="space-y-2">
                <img
                  src={imageUrl}
                  alt={`Question image ${index + 1}`}
                  className="w-full h-auto rounded-lg shadow-sm border"
                />
              </div>
            ))}
          </div>
        )}

        {/* Documents */}
        {content.media_urls.documents && content.media_urls.documents.length > 0 && (
          <div className="space-y-2">
            {content.media_urls.documents.map((docUrl, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <FileText className="w-5 h-5 text-gray-600" />
                <a
                  href={docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Ver documento {index + 1}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderQuestionInput = () => {
    switch (content.question_type) {
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            <RadioGroup
              value={localAnswer || ''}
              onValueChange={handleAnswerChange}
              disabled={readonly}
            >
              {content.answer_options.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label
                    htmlFor={option.id}
                    className="flex-1 cursor-pointer text-gray-900 dark:text-white"
                  >
                    {option.text}
                  </Label>
                  {showFeedback && option.is_correct && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  {showFeedback && localAnswer === option.id && !option.is_correct && (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'true_false':
        return (
          <div className="space-y-3">
            <RadioGroup
              value={localAnswer || ''}
              onValueChange={handleAnswerChange}
              disabled={readonly}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="true" />
                <Label htmlFor="true" className="cursor-pointer text-gray-900 dark:text-white">
                  Verdadero
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="false" />
                <Label htmlFor="false" className="cursor-pointer text-gray-900 dark:text-white">
                  Falso
                </Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 'fill_blank':
        const blanks = content.question_data.blanks || [];
        return (
          <div className="space-y-4">
            {blanks.map((blank, index) => (
              <div key={blank.id} className="space-y-2">
                <Label className="text-sm font-medium text-gray-900 dark:text-white">
                  Espacio en blanco {index + 1}
                </Label>
                <Input
                  value={localAnswer?.[blank.id] || ''}
                  onChange={(e) => {
                    const newAnswer = { ...localAnswer, [blank.id]: e.target.value };
                    handleAnswerChange(newAnswer);
                  }}
                  placeholder="Escribe tu respuesta..."
                  disabled={readonly}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        );

      case 'open_ended':
      case 'essay':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-900 dark:text-white">
              Tu respuesta:
            </Label>
            <Textarea
              value={localAnswer || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Escribe tu respuesta aquí..."
              disabled={readonly}
              rows={content.question_type === 'essay' ? 8 : 4}
              className="w-full resize-vertical"
            />
            {!readonly && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Caracteres: {(localAnswer || '').length}
              </div>
            )}
          </div>
        );

      case 'matching':
        const matches = content.question_data.matches || [];
        return (
          <div className="space-y-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Relaciona los elementos de ambas columnas:
            </div>
            {matches.map((match, index) => (
              <div key={match.left_id} className="flex items-center gap-4">
                <div className="flex-1 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  {match.left_text}
                </div>
                <div className="text-gray-400">→</div>
                <div className="flex-1">
                  <Select
                    value={localAnswer?.[match.left_id] || ''}
                    onValueChange={(value) => {
                      const newAnswer = { ...localAnswer, [match.left_id]: value };
                      handleAnswerChange(newAnswer);
                    }}
                    disabled={readonly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona..." />
                    </SelectTrigger>
                    <SelectContent>
                      {matches.map((rightOption) => (
                        <SelectItem key={rightOption.right_id} value={rightOption.right_id}>
                          {rightOption.right_text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        );

      case 'drag_drop':
        // Simplified drag and drop - in a real implementation you'd use a library like react-beautiful-dnd
        return (
          <div className="space-y-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Arrastra los elementos al orden correcto:
            </div>
            <div className="grid grid-cols-1 gap-2">
              {content.answer_options.map((option, index) => (
                <div
                  key={option.id}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 cursor-move"
                  draggable={!readonly}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">#{index + 1}</span>
                    <span className="text-gray-900 dark:text-white">{option.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'speaking_task':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                  Tarea de Speaking
                </span>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Graba tu respuesta usando el micrófono. Duración recomendada: 1-2 minutos.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="gap-2"
                disabled={readonly}
              >
                <Volume2 className="w-4 h-4" />
                {localAnswer ? 'Volver a grabar' : 'Empezar grabación'}
              </Button>

              {localAnswer && (
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Respuesta grabada
                </Badge>
              )}
            </div>
          </div>
        );

      case 'listening_comprehension':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Tarea de Listening
                </span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Escucha el audio y responde a la pregunta.
              </p>
            </div>

            {/* This would typically include audio controls and then a question type */}
            <RadioGroup
              value={localAnswer || ''}
              onValueChange={handleAnswerChange}
              disabled={readonly}
            >
              {content.answer_options.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label
                    htmlFor={option.id}
                    className="flex-1 cursor-pointer text-gray-900 dark:text-white"
                  >
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      default:
        return (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">
                Tipo de pregunta no soportado: {content.question_type}
              </span>
            </div>
          </div>
        );
    }
  };

  const renderFeedback = () => {
    if (!showFeedback || !userAnswer) return null;

    const isCorrect = userAnswer.score && userAnswer.score > 0;

    return (
      <Card className={`border-2 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'} dark:${isCorrect ? 'border-green-800 bg-green-900/20' : 'border-red-800 bg-red-900/20'}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {isCorrect ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white mb-1">
                {isCorrect ? '¡Correcto!' : 'Incorrecto'}
              </div>
              {content.answer_explanation && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {content.answer_explanation}
                </p>
              )}
              {userAnswer.feedback && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {userAnswer.feedback}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Question metadata */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline">
          {content.section_id.replace('_', ' ').toUpperCase()}
        </Badge>
        <Badge variant="outline">
          {content.question_type.replace('_', ' ').toUpperCase()}
        </Badge>
        <Badge variant="outline">
          {content.points} punto{content.points !== 1 ? 's' : ''}
        </Badge>
        {timeLimit && (
          <Badge variant="outline" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            {Math.max(0, timeLimit - timeSpent)}s restantes
          </Badge>
        )}
      </div>

      {/* Question context/stimulus */}
      {content.question_data.context && (
        <Card className="bg-slate-50 dark:bg-slate-700/50">
          <CardContent className="p-4">
            <div className="prose dark:prose-invert max-w-none">
              <div
                className="text-gray-900 dark:text-white"
                dangerouslySetInnerHTML={{ __html: content.question_data.context }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Media content */}
      {renderMediaContent()}

      {/* Question text */}
      {renderQuestionText()}

      {/* Question input */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border p-4">
        {renderQuestionInput()}
      </div>

      {/* Feedback */}
      {renderFeedback()}

      {/* Question info */}
      {(content.difficulty_tags.length > 0 || content.topic_tags.length > 0) && (
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          {content.topic_tags.length > 0 && (
            <div>
              <span className="font-medium">Temas: </span>
              {content.topic_tags.join(', ')}
            </div>
          )}
          {content.difficulty_tags.length > 0 && (
            <div>
              <span className="font-medium">Dificultad: </span>
              {content.difficulty_tags.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}