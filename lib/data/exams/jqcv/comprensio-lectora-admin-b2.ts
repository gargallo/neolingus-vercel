import type { Question, ExamInfo, ExamData, SimpleExamTemplate } from '@/lib/services/exam-data.service';

const EXAM_ID = 'jqcv_valenciano_b2_comprensio_lectora_admin';
const NOW = new Date().toISOString();

const passageDigitalitzacio = `
  <h3>La Revolució Digital en l'Educació: Oportunitats i Desafiaments</h3>
  <p>La integració de les tecnologies digitals en l'àmbit educatiu ha representat una de les transformacions més significatives dels darrers decennis. <strong>Aquest procés d'innovació tecnològica</strong> no sols ha modificat les metodologies d'ensenyament tradicionals, sinó que també ha redefinit el concepte mateix d'aprenentatge en el segle XXI.</p>
  <p>D'una banda, les plataformes digitals ofereixen possibilitats pedagògiques inèdites. La personalització de l'aprenentatge, mitjançant algoritmes adaptatius que s'ajusten al ritme individual de cada estudiant, permet un enfocament més inclusiu i efectiu. A més, l'accés a recursos educatius oberts i la col·laboració internacional faciliten l'intercanvi de coneixements i experiències entre institucions de tot el món.</p>
  <p>No obstant això, aquest procés de digitalització presenta reptes considerables. <strong>La bretxa digital</strong> continua sent una realitat que afecta principalment els col·lectius més vulnerables, perpetuant les desigualtats socioeconòmiques existents. Així mateix, la sobreexposició a les pantalles i la dependència tecnològica plantegen interrogants sobre els efectes a llarg termini en el desenvolupament cognitiu dels estudiants.</p>
  <p>El paper del professorat també ha evolucionat substancialment. Els docents han passat de ser transmissors de continguts a actuar com a facilitadors i orientadors de l'aprenentatge. Aquesta transició requereix una formació contínua i una adaptació constant a les noves eines tecnològiques, cosa que suposa un esforç considerable per part dels professionals de l'educació.</p>
  <p>En definitiva, la revolució digital educativa exigeix un enfocament equilibrat que aprofiti les oportunitats que ofereixen les noves tecnologies sense perdre de vista la importància de la dimensió humana en l'educació.</p>
`;

const passageMiralls = `
  <h3>Fragment de "Miralls de la Ciutat" de Carme Miquel</h3>
  <p><em>La ciutat es desperta amb el murmuri dels primers tramvies que creuen els bulevards modernitzats. València, amb la seua fisonomia canviant, acull les reminiscències d'un passat noble i les aspiracions d'un futur cosmopolita.</em></p>
  <p>Caminant pels carrers del Carme, on les façanes centenàries conviuen amb els grafitis contemporanis, <strong>m'adone que cada pedra conta una història diferent</strong>. Les dones que van al mercat central mantenen vives les tradicions orals, mentre que els joves artistes transformen els murs en galeries a l'aire lliure.</p>
  <p>L'Albufera, eixe espill natural que reflecteix les nostres arrels, sembla contemplar amb serenitat les transformacions urbanes. <strong>Els arrossars, testimonis silenciosos de generacions de pagesos</strong>, resisteixen l'avenç inexorable de la modernitat, recordant-nos que la identitat no es pot desconnectar de la terra.</p>
  <p>En les nits de juliol, quan la calor s'adhereix a l'asfalt com una segona pell, la ciutat revela la seua ànima mediterrània. Les terrasses s'omplen de converses en valencià, castellà i idiomes estrangers, creant una simfonia poliglota que defineix la València del segle XXI.</p>
  <p>Tanmateix, aquest equilibri entre tradició i modernitat no està exempt de tensions. La gentrificació amenaça els barris històrics, i l'especulació immobiliària desplaça les famílies que han viscut ací durant generacions. <strong>La ciutat, com un organisme viu, ha de trobar la manera de créixer sense perdre la seua essència</strong>.</p>
`;

const passageSostenibilitat = `
  <h3>Informe: Estratègies de Sostenibilitat Urbana per a les Ciutats Mediterrànies</h3>
  <p><strong>Context i objectius:</strong> L'actual crisi climàtica requereix una resposta coordinada i efectiva per part dels governs locals, especialment en l'àmbit mediterrani, on la pressió demogràfica i turística intensifica els reptes ambientals. Aquest informe examina les estratègies implementades en diverses ciutats de la conca mediterrània per promoure un desenvolupament urbà més sostenible.</p>
  <p><strong>Metodologia:</strong> S'han analitzat 25 ciutats mediterrànies amb poblacions superiors als 200.000 habitants, avaluant indicadors com la qualitat de l'aire, la gestió de residus, l'eficiència energètica i la mobilitat sostenible. Les dades s'han obtingut mitjançant enquestes directes als ajuntaments i organismes ambientals locals.</p>
  <p><strong>Resultats principals:</strong> Les ciutats que han implementat polítiques integrals de sostenibilitat mostren una reducció mitjana del 23% en les emissions de CO₂ durant el període 2018-2023. <strong>Barcelona i València destaquen per les seues iniciatives en mobilitat elèctrica</strong>, mentre que Niça i Palma han excel·lit en la gestió eficient dels recursos hídrics.</p>
  <p><strong>Bones pràctiques identificades:</strong> La creació de zones de baixes emissions, la promoció del transport públic elèctric, la implementació de sistemes de recollida selectiva de residus i el foment dels espais verds urbans han demostrat ser les mesures més efectives. A més, la participació ciutadana en els processos de decisió ha resultat fonamental per garantir l'acceptació i l'èxit de les polítiques implementades.</p>
  <p><strong>Recomanacions:</strong> Per optimitzar els resultats, es proposa l'establiment d'una xarxa de col·laboració entre ciutats mediterrànies que facilite l'intercanvi d'experiències i recursos. Així mateix, és imprescindible incrementar la inversió en tecnologies verdes i establir sistemes de monitoratge permanent per avaluar l'impacte real de les mesures adoptades.</p>
`;

const questions: Question[] = [
  {
    id: `${EXAM_ID}_q1`,
    exam_template_id: EXAM_ID,
    exam_content_id: 'digitalitzacio',
    question_type: 'multiple_choice',
    skill: 'comprensio_lectora',
    question_text: 'Segons el text, la principal transformació de la digitalització educativa ha estat:',
    options: [
      'La substitució completa dels mètodes tradicionals',
      "La redefinició del concepte d'aprenentatge",
      "L'eliminació de la bretxa digital",
      'La creació de nous perfils professionals'
    ],
    correct_answer: '1',
    points: 1,
    order_index: 1,
    context: passageDigitalitzacio,
    section: 'Exercici 1',
    created_at: NOW,
    updated_at: NOW
  },
  {
    id: `${EXAM_ID}_q2`,
    exam_template_id: EXAM_ID,
    exam_content_id: 'digitalitzacio',
    question_type: 'multiple_choice',
    skill: 'comprensio_lectora',
    question_text: 'Els algoritmes adaptatius esmentats en el text permeten:',
    options: [
      "Accelerar el procés d'aprenentatge de tots els estudiants",
      "Personalitzar l'educació segons les necessitats individuals",
      'Substituir completament la funció docent',
      "Garantir l'èxit acadèmic de tots els alumnes"
    ],
    correct_answer: '1',
    points: 1,
    order_index: 2,
    context: passageDigitalitzacio,
    section: 'Exercici 1',
    created_at: NOW,
    updated_at: NOW
  },
  {
    id: `${EXAM_ID}_q3`,
    exam_template_id: EXAM_ID,
    exam_content_id: 'digitalitzacio',
    question_type: 'multiple_choice',
    skill: 'comprensio_lectora',
    question_text: 'La “bretxa digital” fa referència a:',
    options: [
      'Les diferències tecnològiques entre països',
      'Els problemes tècnics de les plataformes educatives',
      "Les desigualtats en l'accés a la tecnologia",
      'La resistència dels docents al canvi tecnològic'
    ],
    correct_answer: '2',
    points: 1,
    order_index: 3,
    context: passageDigitalitzacio,
    section: 'Exercici 1',
    created_at: NOW,
    updated_at: NOW
  },
  {
    id: `${EXAM_ID}_q4`,
    exam_template_id: EXAM_ID,
    exam_content_id: 'digitalitzacio',
    question_type: 'multiple_choice',
    skill: 'comprensio_lectora',
    question_text: "Segons l'autor, el nou rol dels docents consisteix a:",
    options: [
      'Transmetre continguts de manera més eficient',
      "Actuar com a facilitadors de l'aprenentatge",
      'Desenvolupar noves tecnologies educatives',
      'Substituir les eines tecnològiques quan falten'
    ],
    correct_answer: '1',
    points: 1,
    order_index: 4,
    context: passageDigitalitzacio,
    section: 'Exercici 1',
    created_at: NOW,
    updated_at: NOW
  },
  {
    id: `${EXAM_ID}_q5`,
    exam_template_id: EXAM_ID,
    exam_content_id: 'digitalitzacio',
    question_type: 'multiple_choice',
    skill: 'comprensio_lectora',
    question_text: "L'actitud de l'autor respecte a la digitalització educativa es pot descriure com:",
    options: [
      'Completament favorable',
      'Moderadament crítica',
      'Equilibrada i reflexiva',
      'Clarament oposada'
    ],
    correct_answer: '2',
    points: 1,
    order_index: 5,
    context: passageDigitalitzacio,
    section: 'Exercici 1',
    created_at: NOW,
    updated_at: NOW
  },
  {
    id: `${EXAM_ID}_q6`,
    exam_template_id: EXAM_ID,
    exam_content_id: 'digitalitzacio',
    question_type: 'multiple_choice',
    skill: 'comprensio_lectora',
    question_text: 'La conclusió principal del text suggereix la necessitat de:',
    options: [
      'Accelerar el procés de digitalització',
      'Tornar als mètodes tradicionals',
      'Mantenir un enfocament equilibrat',
      'Formar més docents especialitzats'
    ],
    correct_answer: '2',
    points: 1,
    order_index: 6,
    context: passageDigitalitzacio,
    section: 'Exercici 1',
    created_at: NOW,
    updated_at: NOW
  },
  {
    id: `${EXAM_ID}_q7`,
    exam_template_id: EXAM_ID,
    exam_content_id: 'miralls',
    question_type: 'multiple_choice',
    skill: 'comprensio_lectora',
    question_text: "L'expressió “fisonomia canviant” fa referència a:",
    options: [
      "L'aspecte físic de les persones",
      'La transformació urbana de la ciutat',
      'Les condicions climàtiques variables',
      "L'estat d'ànim dels habitants"
    ],
    correct_answer: '1',
    points: 1,
    order_index: 7,
    context: passageMiralls,
    section: 'Exercici 2',
    created_at: NOW,
    updated_at: NOW
  },
  {
    id: `${EXAM_ID}_q8`,
    exam_template_id: EXAM_ID,
    exam_content_id: 'miralls',
    question_type: 'multiple_choice',
    skill: 'comprensio_lectora',
    question_text: 'Segons el fragment, els carrers del Carme es caracteritzen per:',
    options: [
      'Estar completament modernitzats',
      "Mantenir només l'arquitectura històrica",
      'Combinar elements històrics i contemporanis',
      'Ser exclusivament zones comercials'
    ],
    correct_answer: '2',
    points: 1,
    order_index: 8,
    context: passageMiralls,
    section: 'Exercici 2',
    created_at: NOW,
    updated_at: NOW
  },
  {
    id: `${EXAM_ID}_q9`,
    exam_template_id: EXAM_ID,
    exam_content_id: 'miralls',
    question_type: 'multiple_choice',
    skill: 'comprensio_lectora',
    question_text: "L'Albufera simbolitza en el text:",
    options: [
      'La resistència al canvi',
      'La connexió amb les arrels culturals',
      "L'atracció turística principal",
      'El conflicte entre rural i urbà'
    ],
    correct_answer: '1',
    points: 1,
    order_index: 9,
    context: passageMiralls,
    section: 'Exercici 2',
    created_at: NOW,
    updated_at: NOW
  },
  {
    id: `${EXAM_ID}_q10`,
    exam_template_id: EXAM_ID,
    exam_content_id: 'miralls',
    question_type: 'multiple_choice',
    skill: 'comprensio_lectora',
    question_text: 'La “simfonia poliglota” esmentada es refereix a:',
    options: [
      'Els concerts multiculturals a les places',
      'La diversitat lingüística de la ciutat',
      'Els programes radiofònics en diferents idiomes',
      'Les tradicions musicals valencianes'
    ],
    correct_answer: '1',
    points: 1,
    order_index: 10,
    context: passageMiralls,
    section: 'Exercici 2',
    created_at: NOW,
    updated_at: NOW
  },
  {
    id: `${EXAM_ID}_q11`,
    exam_template_id: EXAM_ID,
    exam_content_id: 'miralls',
    question_type: 'multiple_choice',
    skill: 'comprensio_lectora',
    question_text: 'El principal conflicte descrit en el text és:',
    options: [
      'La resistència dels habitants als canvis',
      "L'oposició entre joves i grans",
      'La tensió entre desenvolupament i identitat',
      'La competència entre idiomes'
    ],
    correct_answer: '2',
    points: 1,
    order_index: 11,
    context: passageMiralls,
    section: 'Exercici 2',
    created_at: NOW,
    updated_at: NOW
  },
  {
    id: `${EXAM_ID}_q12`,
    exam_template_id: EXAM_ID,
    exam_content_id: 'miralls',
    question_type: 'multiple_choice',
    skill: 'comprensio_lectora',
    question_text: 'El to general del fragment es pot descriure com:',
    options: [
      'Nostàlgic i melancòlic',
      'Crític i pessimista',
      'Reflexiu i equilibrat',
      'Entusiasta i optimista'
    ],
    correct_answer: '2',
    points: 1,
    order_index: 12,
    context: passageMiralls,
    section: 'Exercici 2',
    created_at: NOW,
    updated_at: NOW
  },
  {
    id: `${EXAM_ID}_q13`,
    exam_template_id: EXAM_ID,
    exam_content_id: 'sostenibilitat',
    question_type: 'multiple_choice',
    skill: 'comprensio_lectora',
    question_text: "L'objectiu principal d'aquest informe és:",
    options: [
      'Criticar les polítiques ambientals actuals',
      'Examinar estratègies de sostenibilitat urbana',
      'Promoure el turisme sostenible',
      'Analitzar la crisi climàtica global'
    ],
    correct_answer: '1',
    points: 1,
    order_index: 13,
    context: passageSostenibilitat,
    section: 'Exercici 3',
    created_at: NOW,
    updated_at: NOW
  },
  {
    id: `${EXAM_ID}_q14`,
    exam_template_id: EXAM_ID,
    exam_content_id: 'sostenibilitat',
    question_type: 'multiple_choice',
    skill: 'comprensio_lectora',
    question_text: 'El criteri de selecció de les ciutats analitzades ha estat:',
    options: [
      'La seua proximitat al mar',
      'El nivell de contaminació atmosfèrica',
      'La població superior a 200.000 habitants',
      "L'existència de polítiques ambientals"
    ],
    correct_answer: '2',
    points: 1,
    order_index: 14,
    context: passageSostenibilitat,
    section: 'Exercici 3',
    created_at: NOW,
    updated_at: NOW
  },
  {
    id: `${EXAM_ID}_q15`,
    exam_template_id: EXAM_ID,
    exam_content_id: 'sostenibilitat',
    question_type: 'multiple_choice',
    skill: 'comprensio_lectora',
    question_text: "Segons els resultats, la reducció d'emissions de CO₂ ha estat:",
    options: [
      'Del 23% en totes les ciutats',
      'Variable segons la ciutat',
      'Mitjana del 23% en les ciutats amb polítiques integrals',
      'Insignificant en la majoria de casos'
    ],
    correct_answer: '2',
    points: 1,
    order_index: 15,
    context: passageSostenibilitat,
    section: 'Exercici 3',
    created_at: NOW,
    updated_at: NOW
  },
  {
    id: `${EXAM_ID}_q16`,
    exam_template_id: EXAM_ID,
    exam_content_id: 'sostenibilitat',
    question_type: 'multiple_choice',
    skill: 'comprensio_lectora',
    question_text: 'Barcelona i València es destaquen especialment per:',
    options: [
      'La gestió dels recursos hídrics',
      'Les iniciatives en mobilitat elèctrica',
      "La creació d'espais verds",
      'La recollida selectiva de residus'
    ],
    correct_answer: '1',
    points: 1,
    order_index: 16,
    context: passageSostenibilitat,
    section: 'Exercici 3',
    created_at: NOW,
    updated_at: NOW
  },
  {
    id: `${EXAM_ID}_q17`,
    exam_template_id: EXAM_ID,
    exam_content_id: 'sostenibilitat',
    question_type: 'multiple_choice',
    skill: 'comprensio_lectora',
    question_text: "Segons l'informe, la participació ciutadana és important perquè:",
    options: [
      'Redueix els costos de les polítiques',
      'Accelera la implementació de mesures',
      "Garanteix l'acceptació de les polítiques",
      'Millora la qualitat tècnica de les decisions'
    ],
    correct_answer: '2',
    points: 1,
    order_index: 17,
    context: passageSostenibilitat,
    section: 'Exercici 3',
    created_at: NOW,
    updated_at: NOW
  },
  {
    id: `${EXAM_ID}_q18`,
    exam_template_id: EXAM_ID,
    exam_content_id: 'sostenibilitat',
    question_type: 'multiple_choice',
    skill: 'comprensio_lectora',
    question_text: 'Entre les recomanacions proposades NO es troba:',
    options: [
      'Crear una xarxa de col·laboració mediterrània',
      'Incrementar la inversió en tecnologies verdes',
      'Establir sistemes de monitoratge permanent',
      'Reduir la població urbana de les ciutats'
    ],
    correct_answer: '3',
    points: 1,
    order_index: 18,
    context: passageSostenibilitat,
    section: 'Exercici 3',
    created_at: NOW,
    updated_at: NOW
  }
];

const template: SimpleExamTemplate = {
  id: EXAM_ID,
  title: 'JQCV B2 Comprensió Lectora (Administració)',
  description: 'Prova oficial de comprensió lectora per al certificat administratiu en valencià nivell B2.',
  language: 'valenciano',
  level: 'B2',
  provider: 'jqcv',
  estimated_duration: 120,
  total_questions: questions.length,
  instructions: "Llig atentament cada text i respon les preguntes triant l'opció correcta. Gestiona el teu temps: recomanem dedicar aproximadament 40 minuts a cada bloc de textos.",
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
  exam_type: 'reading',
  provider: 'jqcv',
  language: 'valenciano',
  level: 'B2'
};

export const jqcvB2ComprensioLectoraAdmin: ExamData & { info: ExamInfo } = {
  info,
  template,
  content: [],
  questions
};

