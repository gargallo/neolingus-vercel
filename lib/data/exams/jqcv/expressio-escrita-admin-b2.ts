import type { Question, ExamInfo, ExamData, SimpleExamTemplate } from '@/lib/services/exam-data.service';

const EXAM_ID = 'jqcv_valenciano_b2_expressio_escrita_admin';
const NOW = new Date().toISOString();

const taskOneContext = `
  <h3>Tasca 1. Informe administratiu</h3>
  <p>Sou tècnic/a lingüístic/a en una conselleria de la Generalitat Valenciana. Heu de redactar un informe administratiu d'unes 250 paraules adreçat al vostre superior per resumir els resultats d'una campanya interna sobre transformació digital.</p>
  <p>L'informe ha d'incloure:</p>
  <ul>
    <li>Objectius de la campanya i departaments implicats.</li>
    <li>Principals conclusions extretes de les enquestes al personal.</li>
    <li>Propostes concretes per consolidar els avanços obtinguts.</li>
  </ul>
`;

const taskTwoContext = `
  <h3>Tasca 2. Carta formal</h3>
  <p>Redacteu una carta formal de 200-220 paraules adreçada a la Direcció General de Recursos Humans sol·licitant la participació del vostre departament en un programa de formació sobre sostenibilitat.</p>
  <p>La carta ha d'incloure:</p>
  <ul>
    <li>Motiu de la sol·licitud i context de la iniciativa.</li>
    <li>Beneficis esperats per al personal i per a la ciutadania.</li>
    <li>Disponibilitat de dates i proposta d'organització logística.</li>
  </ul>
`;

const questions: Question[] = [
  {
    id: `${EXAM_ID}_tasca1`,
    exam_template_id: EXAM_ID,
    exam_content_id: 'expressio_escrita_tasca1',
    question_type: 'essay',
    skill: 'expressio_escrita',
    question_text: 'Redacta l\'informe administratiu seguint les indicacions proporcionades.',
    options: [],
    correct_answer: '',
    points: 0,
    order_index: 1,
    context: taskOneContext,
    section: 'Tasca 1',
    created_at: NOW,
    updated_at: NOW
  },
  {
    id: `${EXAM_ID}_tasca2`,
    exam_template_id: EXAM_ID,
    exam_content_id: 'expressio_escrita_tasca2',
    question_type: 'essay',
    skill: 'expressio_escrita',
    question_text: 'Escriu la carta formal seguint les indicacions proporcionades.',
    options: [],
    correct_answer: '',
    points: 0,
    order_index: 2,
    context: taskTwoContext,
    section: 'Tasca 2',
    created_at: NOW,
    updated_at: NOW
  }
];

const template: SimpleExamTemplate = {
  id: EXAM_ID,
  title: 'JQCV B2 Expressió Escrita (Administració)',
  description: 'Prova oficial d\'expressió escrita per al certificat administratiu en valencià nivell B2.',
  language: 'valenciano',
  level: 'B2',
  provider: 'jqcv',
  estimated_duration: 120,
  total_questions: questions.length,
  instructions: 'Completa les dues tasques d\'expressió escrita. Gestiona el temps per dedicar aproximadament 60 minuts a cada tasca i segueix els registres formals propis de l\'administració pública.',
  created_at: NOW,
  updated_at: NOW,
  version: '1.0'
};

const info: ExamInfo = {
  id: EXAM_ID,
  title: template.title,
  description: template.description,
  duration: template.estimated_duration,
  total_questions: template.total_questions,
  difficulty: 'advanced',
  exam_type: 'writing',
  provider: 'jqcv',
  language: 'valenciano',
  level: 'B2'
};

export const jqcvB2ExpressioEscritaAdmin: ExamData & { info: ExamInfo } = {
  info,
  template,
  content: [],
  questions
};
