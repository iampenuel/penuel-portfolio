export type ExperienceItem = {
  id: string;
  organization: string;
  role: string;
  dates: string;
  description: string;
  bullets: string[];
  logo?: string;
  emphasis?: 'featured' | 'standard';
};

export const experience: ExperienceItem[] = [
  {
    id: 'ibm',
    organization: 'IBM AI Experiential Learning Lab — Healthcare Track',
    role: 'Healthcare AI Project Builder',
    dates: 'February 2026 – May 2026',
    description: 'Built Mamathemba, a clinician-facing maternal emergency referral-readiness and handoff-support prototype.',
    bullets: [
      'Designed structured intake, missing-information checks, facility comparison, editable handoff generation, and clinician-review workflows.',
      'Worked across frontend product design, backend workflow logic, AI integration, and responsible-AI framing.',
      'Maintained strict boundaries against diagnosis, autonomous triage, medication guidance, and replacement of clinician judgment.'
    ],
    logo: '/assets/logos/ibm.png',
    emphasis: 'featured'
  },
  {
    id: 'ai4all',
    organization: 'AI4ALL Ignite',
    role: 'AI4ALL Ignite Scholar — Applied AI in Healthcare',
    dates: '2025–2026',
    description: 'Collaborated on a pediatric EEG seizure-window classification project using the CHB-MIT dataset.',
    bullets: [
      'Helped prepare more than 9,500 multichannel EEG windows and develop a 1D CNN.',
      'The project achieved approximately 90% held-out test accuracy on its prepared evaluation split.',
      'Selected for presentation at the AI4ALL Symposium; results were framed as research, not clinical validation.'
    ],
    logo: '/assets/logos/ai4all.png',
    emphasis: 'featured'
  },
  {
    id: 'penn-state-cte',
    organization: 'Penn State Harrisburg Center for Teaching Excellence',
    role: 'Student Media Production Assistant',
    dates: 'October 2024 – Present',
    description: 'Produce and edit accessible educational media for faculty, courses, and learning initiatives.',
    bullets: [
      'Support filming, post-production, captioning, audio descriptions, media organization, and quality review.',
      'Use Adobe Premiere Pro while balancing technical execution, accessibility, clarity, and audience needs.'
    ],
    logo: '/assets/logos/penn-state.png'
  },
  {
    id: 'aws-scholar',
    organization: 'Amazon Web Services',
    role: 'AWS AI/ML Scholar',
    dates: 'June 2025 – August 2025',
    description: 'Completed structured learning in machine-learning workflows, model development, evaluation, and responsible AI.',
    bullets: ['Applied these foundations across later healthcare-AI, biosignal, medical-imaging, and full-stack AI projects.'],
    logo: '/assets/logos/aws.png'
  },
  {
    id: 'adobe-ambassador',
    organization: 'Adobe at Penn State University',
    role: 'Student Ambassador',
    dates: 'January 2024 – May 2025',
    description: 'Led Adobe Express workshops and translated creative goals into structured, accessible project workflows.',
    bullets: [
      'Planned and delivered campus-wide workshops combining technical tutorials with interactive problem-solving.',
      'Used feedback-driven iteration to improve materials, clarity, accessibility, and community impact.'
    ],
    logo: '/assets/logos/adobe.png'
  }
];

export const leadership = [
  {
    organization: 'InterVarsity Christian Fellowship — Penn State Harrisburg',
    role: 'Bible Study Leader and Outreach Team Lead',
    dates: 'March 2024 – Present',
    logo: '/assets/logos/intervarsity.png',
    description:
      'Lead Bible-study discussions, coordinate outreach, welcome new students, and support a faith-centered community built around belonging, reflection, and service.'
  }
];

export const awards = [
  {
    title: 'Ackroyd Family Healthier Days Scholarship',
    issuer: 'Penn State Harrisburg',
    date: 'May 2026',
    amount: '$1,500',
    logo: '/assets/logos/penn-state.png',
    description:
      'Awarded in recognition of health-focused AI work and used to support neonatal brain MRI developmental-age classification research using transfer learning and Grad-CAM.'
  }
];

export const certifications = [
  {
    title: 'SAP Certified – SAP Generative AI Developer',
    issuer: 'SAP',
    date: 'July 2026',
    logo: '/assets/logos/sap.png',
    description: 'System-based SAP Generative AI Developer certification; earned with a 100% assessment score.'
  },
  {
    title: 'Introducing Joule Studio',
    issuer: 'SAP',
    date: 'July 2026',
    logo: '/assets/logos/sap.png'
  },
  {
    title: 'Social and Behavioral Human Subjects Research (IRB) Course',
    issuer: 'CITI Program',
    date: 'June 2026',
    logo: '/assets/logos/citi.png'
  },
  {
    title: 'Workers as Research Subjects – A Vulnerable Population',
    issuer: 'CITI Program',
    date: 'June 2026',
    logo: '/assets/logos/citi.png'
  },
  {
    title: 'AWS AI Practitioner',
    issuer: 'Udacity',
    date: 'May 2026',
    logo: '/assets/logos/udacity.png'
  },
  {
    title: 'The Rise of Multiagent Systems',
    issuer: 'IBM',
    date: 'March 2026',
    logo: '/assets/logos/ibm.png'
  },
  {
    title: 'Introduction to Retrieval-Augmented Generation',
    issuer: 'IBM',
    date: 'March 2026',
    logo: '/assets/logos/ibm.png'
  },
  {
    title: 'Responsible AI: Applying AI Principles with Google Cloud',
    issuer: 'Google',
    date: 'July 2025',
    logo: '/assets/logos/google.png'
  },
  {
    title: 'Databricks Accredited Generative AI Fundamentals',
    issuer: 'Databricks',
    date: 'May 2025',
    logo: '/assets/logos/databricks.png'
  }
];
