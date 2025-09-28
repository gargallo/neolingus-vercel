import type { Question, ExamInfo, ExamData, SimpleExamTemplate } from '@/lib/services/exam-data.service';

const EXAM_ID = 'jqcv_valenciano_b2_expressio_oral_admin';
const NOW = new Date().toISOString();

const taskOneContext = `
  <h3>Tasca 1. Presentació individual</h3>
  <p>
    Disposes d'un minut per a preparar-te i tres minuts per a desenvolupar una intervenció formal sobre el tema
    proposat. Organitza la intervenció en introducció, desenvolupament i tancament.
  </p>
  <p><strong>Tema:</strong> Transformació digital en l'administració pública valenciana.</p>
  <ul>
    <li>Avantatges i reptes principals per al funcionariat i per a la ciutadania.</li>
    <li>Iniciatives que ja s'han implementat amb èxit.</li>
    <li>Proposta de millores prioritàries per als pròxims dos anys.</li>
  </ul>
`;

const taskTwoContext = `
  <h3>Tasca 2. Joc de rols</h3>
  <p>
    Disposes d'un minut per a preparar-te i quatre minuts per a interactuar amb l'examinador/a. Representes una
    persona responsable de comunicació d'un ajuntament. L'examinador/a interpreta el paper d'una representant d'una
    associació veïnal que vol organitzar una jornada sobre sostenibilitat.
  </p>
  <p>Objectius de la interacció:</p>
  <ul>
    <li>Recollir les necessitats de l'associació i oferir suport logístic.</li>
    <li>Explicar els recursos municipals disponibles per a l'esdeveniment.</li>
    <li>Negociar una proposta de data i espai, així com canals de difusió.</li>
  </ul>
`;

const taskThreeContext = `
  <h3>Tasca 3. Debat administratiu</h3>
  <p>
    Després d'una preparació conjunta d'un minut, manteniu un debat de cinc minuts amb l'examinador/a sobre la
    implantació d'un pla de teletreball parcial en l'administració autonòmica.
  </p>
  <ul>
    <li>Argumenta a favor d'un model híbrid i respon a objeccions sobre productivitat i seguretat.</li>
    <li>Proposa mesures de seguiment i formació per a garantir l'èxit del pla.</li>
    <li>Busca punts d'acord i tanca amb conclusions clares.</li>
  </ul>
`;

const questions: Question[] = [
  {
    id: `${EXAM_ID}_tasca1`,
    exam_template_id: EXAM_ID,
    exam_content_id: 'expressio_oral_tasca1',
    question_type: 'speaking_task',
    skill: 'expressio_oral',
    question_text: 'Realitza la presentació individual segons les indicacions.',
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
    exam_content_id: 'expressio_oral_tasca2',
    question_type: 'speaking_task',
    skill: 'expressio_oral',
    question_text: 'Participa en el joc de rols atenent els objectius comunicatius descrits.',
    options: [],
    correct_answer: '',
    points: 0,
    order_index: 2,
    context: taskTwoContext,
    section: 'Tasca 2',
    created_at: NOW,
    updated_at: NOW
  },
  {
    id: `${EXAM_ID}_tasca3`,
    exam_template_id: EXAM_ID,
    exam_content_id: 'expressio_oral_tasca3',
    question_type: 'speaking_task',
    skill: 'expressio_oral',
    question_text: 'Debat amb l’examinador/a sobre la proposta de teletreball i busca un acord final.',
    options: [],
    correct_answer: '',
    points: 0,
    order_index: 3,
    context: taskThreeContext,
    section: 'Tasca 3',
    created_at: NOW,
    updated_at: NOW
  }
];

const template: SimpleExamTemplate = {
  id: EXAM_ID,
  title: 'JQCV B2 Expressió Oral (Administració)',
  description: 'Prova oficial d\'expressió oral per al certificat administratiu en valencià nivell B2.',
  language: 'valenciano',
  level: 'B2',
  provider: 'jqcv',
  estimated_duration: 20,
  total_questions: questions.length,
  instructions: 'Completa les tres tasques orals. Disposes d\'un minut de preparació per tasca. Utilitza la rúbrica oficial per valorar entonació, fluïdesa i adequació.',
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
  exam_type: 'speaking',
  provider: 'jqcv',
  language: 'valenciano',
  level: 'B2'
};

export const jqcvB2ExpressioOralAdmin: ExamData & { info: ExamInfo } = {
  info,
  template,
  content: [],
  questions
};
