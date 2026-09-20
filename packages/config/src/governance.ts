import {institute,type Locale} from './index';
import type {GovernanceContent} from '@ufde/types';
export const governanceSectionIds=['overview','legal','structure','documents','policies','financial','compliance','contact'];
export const governanceLabels={
 en:{title:'Governance & Transparency',subtitle:'A foundation for trust, collaboration and long-term impact.',sections:['Overview','Legal Information','Governance Structure','Our Documents','Policies','Financial Information','Partners & Compliance','Contact'],facts:['Year of establishment','Organisation type','Registered office','Governance model'],legal:['Official name','Legal form','Registered office','Registration number','Date of registration','Official publication','SIREN/SIRET if applicable'],roles:['General Assembly','Board','Bureau / Executive Body','Advisory Board'],advisory:'Advisory relationship',commitment:'Our Commitment',values:['Integrity','Accountability','Transparency','Responsible Use of Funds','Impact for Society'],ethics:'Read Our Code of Ethics',soon:'Coming soon',pending:'To be updated',download:'Download document',important:'Important',aboutLinks:['About Us','Mission & Values','Strategic Areas','Our Story','Partners','Governance & Transparency'],docTitles:['Statutes','Official registration','Journal Officiel / JOAFE publication','Code of Ethics','Annual Activity Report','Financial Report','Partnership Policy']},
 fr:{title:'Gouvernance et transparence',subtitle:'Un socle de confiance, de collaboration et d’impact durable.',sections:['Vue d’ensemble','Informations juridiques','Structure de gouvernance','Nos documents','Politiques','Informations financières','Partenaires et conformité','Contact'],facts:['Année de création','Type d’organisation','Siège social','Modèle de gouvernance'],legal:['Dénomination officielle','Forme juridique','Siège social','Numéro d’enregistrement','Date d’enregistrement','Publication officielle','SIREN/SIRET le cas échéant'],roles:['Assemblée générale','Conseil d’administration','Bureau / Organe exécutif','Conseil consultatif'],advisory:'Relation consultative',commitment:'Nos engagements',values:['Intégrité','Responsabilité','Transparence','Utilisation responsable des fonds','Impact pour la société'],ethics:'Lire notre Code d’éthique',soon:'À venir',pending:'À mettre à jour',download:'Télécharger le document',important:'Important',aboutLinks:['À propos','Mission et valeurs','Domaines stratégiques','Notre histoire','Partenaires','Gouvernance et transparence'],docTitles:['Statuts','Enregistrement officiel','Publication au Journal officiel / JOAFE','Code d’éthique','Rapport annuel d’activité','Rapport financier','Politique de partenariat']},
 uk:{title:'Управління та прозорість',subtitle:'Основа довіри, співпраці та довгострокового впливу.',sections:['Огляд','Юридична інформація','Структура управління','Наші документи','Політики','Фінансова інформація','Партнери та відповідність','Контакти'],facts:['Рік заснування','Тип організації','Юридична адреса','Модель управління'],legal:['Офіційна назва','Правова форма','Юридична адреса','Реєстраційний номер','Дата реєстрації','Офіційна публікація','SIREN/SIRET за наявності'],roles:['Загальні збори','Правління','Бюро / Виконавчий орган','Дорадча рада'],advisory:'Дорадчі відносини',commitment:'Наші зобов’язання',values:['Доброчесність','Підзвітність','Прозорість','Відповідальне використання коштів','Вплив на суспільство'],ethics:'Читати Кодекс етики',soon:'Незабаром',pending:'Буде оновлено',download:'Завантажити документ',important:'Важливе',aboutLinks:['Про нас','Місія та цінності','Стратегічні напрями','Наша історія','Партнери','Управління та прозорість'],docTitles:['Статут','Офіційна реєстрація','Публікація в Journal Officiel / JOAFE','Кодекс етики','Річний звіт про діяльність','Фінансовий звіт','Політика партнерства']}
};
export const governanceLegalKeys=['officialName','legalForm','registeredOffice','registrationNumber','registrationDate','officialPublication','sirenSiret'];
export const governanceRoleKeys=['assembly','board','executive','advisory'];
export function defaultGovernance(locale:Locale):GovernanceContent{const l=governanceLabels[locale];return {founded:'2026',organisationType:{en:'Non-profit',fr:'À but non lucratif',uk:'Неприбуткова організація'}[locale],registeredOffice:institute.location,governanceModel:{en:'Multi-stakeholder',fr:'Multipartite',uk:'Багатостороння'}[locale],overview:{en:'This page brings together UFDE’s legal information, governance framework and institutional documents. It provides a reference for understanding responsibilities, decision-making and accountability. Registration details and official documents are published here when verified and available.',fr:'Cette page rassemble les informations juridiques, le cadre de gouvernance et les documents institutionnels de l’UFDE. Elle présente les responsabilités, la prise de décision et la redevabilité. Les données d’enregistrement et les documents officiels sont publiés après vérification.',uk:'Ця сторінка об’єднує юридичну інформацію, структуру управління та інституційні документи UFDE. Вона пояснює відповідальність, прийняття рішень і підзвітність. Реєстраційні дані та офіційні документи публікуються після перевірки.'}[locale],legal:{officialName:institute.name,registeredOffice:institute.location},structure:approvedGovernanceStructure[locale],policies:'',financial:'',compliance:'',contactEmail:institute.email,documents:[...publicGovernanceDocuments[locale],...l.docTitles.map((title,i)=>({id:['statutes','registration','joafe','code-ethics','annual-report','financial-report','partnership-policy'][i],title,description:'',type:'PDF',language:locale,public:true,sortOrder:i+4})).filter(doc=>!['statutes','registration'].includes(doc.id))]};}
export const aboutMenuPaths=['/about','/about#mission-values','/strategic-areas','/about#our-story','/partners','/governance-transparency'];

// Public description approved by UFDE: minutes of 9 March 2026, section 4.2.
export const approvedGovernanceStructure = {
 en: {
  assembly: 'The General Assembly brings together the active members of the association.',
  board: 'The Conseil d’administration is UFDE’s collective governing body. It comprises five active members: Kateryna Hannouf, Liudmyla Golovkova, Glib Vysheslavsky, Volodymyr Kogutyak and Anna Golovkova.',
  executive: 'The Bureau is the executive body of the Conseil d’administration and consists of the same five people. This description follows section 4.2 of the minutes of 9 March 2026.'
 },
 fr: {
  assembly: 'L’Assemblée générale réunit les membres actifs de l’association.',
  board: 'Le Conseil d’administration constitue l’organe collégial de gouvernance de l’UFDE. Il est composé de cinq membres actifs : Kateryna Hannouf, Liudmyla Golovkova, Glib Vysheslavsky, Volodymyr Kogutyak et Anna Golovkova.',
  executive: 'Le Bureau constitue le noyau exécutif du Conseil d’administration et se compose des mêmes cinq personnes, conformément au point 4.2 du procès-verbal du 9 mars 2026.'
 },
 uk: {
  assembly: 'Загальні збори об’єднують активних членів асоціації.',
  board: 'Рада директорів (Conseil d’administration) є колегіальним органом управління UFDE. До її складу входять п’ять активних членів: Kateryna Hannouf, Liudmyla Golovkova, Glib Vysheslavsky, Volodymyr Kogutyak та Anna Golovkova.',
  executive: 'Бюро є виконавчим органом Ради директорів і складається з тих самих п’яти осіб. Опис відповідає пункту 4.2 протоколу від 9 березня 2026 року.'
 }
};

export const publicGovernanceDocuments: Record<Locale, import("@ufde/types").GovernanceDocument[]> = {
  "en": [
    {
      "id": "registration",
      "title": "Registration receipt - public copy",
      "description": "Redacted public copy. Signatures and personal information have been removed where applicable; the original remains with UFDE.",
      "type": "PDF",
      "publicationDate": "2026-01-05",
      "language": "fr",
      "fileUrl": "/documents/ufde-registration-public.pdf",
      "public": true,
      "sortOrder": 0
    },
    {
      "id": "statutes",
      "title": "Statutes of 27 October 2025 - public copy",
      "description": "Redacted public copy. Signatures and personal information have been removed where applicable; the original remains with UFDE.",
      "type": "PDF",
      "publicationDate": "2025-10-27",
      "language": "fr",
      "fileUrl": "/documents/ufde-statutes-public.pdf",
      "public": true,
      "sortOrder": 1
    },
    {
      "id": "founding-minutes",
      "title": "Founding assembly minutes - public copy",
      "description": "Redacted public copy. Signatures and personal information have been removed where applicable; the original remains with UFDE.",
      "type": "PDF",
      "publicationDate": "2025-10-27",
      "language": "fr",
      "fileUrl": "/documents/ufde-founding-minutes-public.pdf",
      "public": true,
      "sortOrder": 2
    },
    {
      "id": "governance-minutes",
      "title": "Governance minutes, 9 March 2026 - public copy",
      "description": "Redacted public copy. Signatures and personal information have been removed where applicable; the original remains with UFDE.",
      "type": "PDF",
      "publicationDate": "2026-03-09",
      "language": "fr",
      "fileUrl": "/documents/ufde-governance-minutes-public.pdf",
      "public": true,
      "sortOrder": 3
    }
  ],
  "fr": [
    {
      "id": "registration",
      "title": "Récépissé de création - copie publique",
      "description": "Copie publique expurgée. Signatures et données personnelles retirées le cas échéant ; original conservé par l’UFDE.",
      "type": "PDF",
      "publicationDate": "2026-01-05",
      "language": "fr",
      "fileUrl": "/documents/ufde-registration-public.pdf",
      "public": true,
      "sortOrder": 0
    },
    {
      "id": "statutes",
      "title": "Statuts du 27 octobre 2025 - copie publique",
      "description": "Copie publique expurgée. Signatures et données personnelles retirées le cas échéant ; original conservé par l’UFDE.",
      "type": "PDF",
      "publicationDate": "2025-10-27",
      "language": "fr",
      "fileUrl": "/documents/ufde-statutes-public.pdf",
      "public": true,
      "sortOrder": 1
    },
    {
      "id": "founding-minutes",
      "title": "Procès-verbal de constitution - copie publique",
      "description": "Copie publique expurgée. Signatures et données personnelles retirées le cas échéant ; original conservé par l’UFDE.",
      "type": "PDF",
      "publicationDate": "2025-10-27",
      "language": "fr",
      "fileUrl": "/documents/ufde-founding-minutes-public.pdf",
      "public": true,
      "sortOrder": 2
    },
    {
      "id": "governance-minutes",
      "title": "Procès-verbal du 9 mars 2026 - copie publique",
      "description": "Copie publique expurgée. Signatures et données personnelles retirées le cas échéant ; original conservé par l’UFDE.",
      "type": "PDF",
      "publicationDate": "2026-03-09",
      "language": "fr",
      "fileUrl": "/documents/ufde-governance-minutes-public.pdf",
      "public": true,
      "sortOrder": 3
    }
  ],
  "uk": [
    {
      "id": "registration",
      "title": "Підтвердження реєстрації - публічна копія",
      "description": "Публічна копія з вилученими підписами та персональними даними, де застосовно. Оригінал зберігається в UFDE.",
      "type": "PDF",
      "publicationDate": "2026-01-05",
      "language": "fr",
      "fileUrl": "/documents/ufde-registration-public.pdf",
      "public": true,
      "sortOrder": 0
    },
    {
      "id": "statutes",
      "title": "Статут від 27 жовтня 2025 року - публічна копія",
      "description": "Публічна копія з вилученими підписами та персональними даними, де застосовно. Оригінал зберігається в UFDE.",
      "type": "PDF",
      "publicationDate": "2025-10-27",
      "language": "fr",
      "fileUrl": "/documents/ufde-statutes-public.pdf",
      "public": true,
      "sortOrder": 1
    },
    {
      "id": "founding-minutes",
      "title": "Протокол установчих зборів - публічна копія",
      "description": "Публічна копія з вилученими підписами та персональними даними, де застосовно. Оригінал зберігається в UFDE.",
      "type": "PDF",
      "publicationDate": "2025-10-27",
      "language": "fr",
      "fileUrl": "/documents/ufde-founding-minutes-public.pdf",
      "public": true,
      "sortOrder": 2
    },
    {
      "id": "governance-minutes",
      "title": "Протокол від 9 березня 2026 року - публічна копія",
      "description": "Публічна копія з вилученими підписами та персональними даними, де застосовно. Оригінал зберігається в UFDE.",
      "type": "PDF",
      "publicationDate": "2026-03-09",
      "language": "fr",
      "fileUrl": "/documents/ufde-governance-minutes-public.pdf",
      "public": true,
      "sortOrder": 3
    }
  ]
};
