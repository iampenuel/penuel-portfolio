export type Project = {
  id: string;
  name: string;
  category: string;
  tagline: string;
  overview: string;
  problem: string;
  highlights: string[];
  metrics: string[];
  technologies: string[];
  boundaries: string[];
  repository: string;
  image?: string;
  liveDemo?: string;
  folderGroup: 'AI Agents' | 'Data Engineering' | 'Medical Imaging' | 'Biosignals' | 'Healthcare Workflow';
};

export const projects: Project[] = [
  {
    id: 'sema',
    name: 'Sema',
    category: 'Multimodal Healthcare AI · AI Agents · Human-Centered Product Engineering',
    tagline: 'Patient-generated evidence, organized for human review.',
    overview:
      'Sema is a multimodal healthcare-AI workspace that helps people organize what they want to communicate before a healthcare conversation. Users can preserve their story, body-location context, audio observations, movement limitations, and supporting files, then review approved information in a clinician-readable evidence packet.',
    problem:
      'Important health information is often scattered across memory, notes, photographs, recordings, documents, and movement changes. The challenge is capturing, organizing, reviewing, and communicating that evidence clearly without asking AI to diagnose.',
    highlights: [
      'Four evidence folders: Story, Body / Location, Audio, and Motion / Visual',
      'Live conversational agent with page-aware actions and permission gates',
      'Review Board with explicit Needs Review, Approved, and Removed states',
      'PDF and ZIP packet export plus shareable-packet workflow',
      'Deterministic refusal, fallback, privacy, and provenance boundaries'
    ],
    metrics: [
      '555 automated checks',
      'Production build, lint, type-check, browser, voice, and schema validation',
      'Software validation only — not clinical validation'
    ],
    technologies: [
      'Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Gemini Live',
      'Gemini structured generation', 'Azure AI Content Safety', 'Web Audio APIs'
    ],
    boundaries: [
      'Not a diagnostic, treatment, medication-advice, or autonomous-triage system',
      'Generated content is excluded from final packets until human approval',
      'Not an EHR, medical device, clinician replacement, or clinically validated product'
    ],
    repository: 'https://github.com/iampenuel/sema',
    image: '/assets/sema.png',
    liveDemo: 'https://sema-delta.vercel.app',
    folderGroup: 'AI Agents'
  },
  {
    id: 'synthetic-patient-utilization-intelligence',
    name: 'Synthetic Patient Utilization Intelligence',
    category: 'Healthcare Data Engineering · Databricks · Analytics',
    tagline: 'A Bronze–Silver–Gold healthcare pipeline for patient-level utilization analysis.',
    overview:
      'A Databricks healthcare-data project that transforms synthetic Synthea files into analysis-ready patient-utilization information using a traceable medallion architecture.',
    problem:
      'Healthcare records arrive across separate patient, encounter, observation, provider, organization, condition, procedure, and claims files. Reliable analysis requires standardization, integrity checks, correct joins, reconciliation, and patient-level summarization.',
    highlights: [
      'Bronze layer preserves raw source schemas and row counts',
      'Silver layer normalizes data types, dates, keys, and relationships',
      'Gold layer produces patient-level utilization summaries',
      'Encounter totals reconcile between Silver and Gold',
      'Synthetic cost values are presented without claiming real financial impact'
    ],
    metrics: [
      '113 synthetic patients',
      '7,210 encounters and 114,335 observations',
      '238 emergency encounters',
      'Approximately $16.3M in synthetic recorded claim costs',
      '156,005 raw events represented in the architecture summary'
    ],
    technologies: ['Databricks', 'Apache Spark', 'PySpark', 'Spark SQL', 'Python', 'Synthea', 'Medallion architecture'],
    boundaries: [
      'Descriptive synthetic-data analytics — not prediction or clinical-risk modeling',
      'No real hospital, insurer, billing, or patient data',
      'Not evidence of savings or a deployed healthcare analytics product'
    ],
    repository: 'https://github.com/iampenuel/synthetic-patient-utilization-intelligence',
    folderGroup: 'Data Engineering'
  },
  {
    id: 'alethia-live',
    name: 'Alethia Live',
    category: 'Real-Time Voice AI · Multimodal AI · Health Literacy',
    tagline: 'AI for clearer care navigation.',
    overview:
      'Alethia Live is a real-time healthcare-navigation and health-literacy agent that combines natural voice interaction with screenshot and document-image understanding.',
    problem:
      'Healthcare information is often written for clinical or administrative workflows instead of patient understanding. People may need plain-language explanations, follow-up questions, audible guidance, and general escalation context.',
    highlights: [
      'Browser microphone capture and Gemini Live streaming audio',
      'Screenshot and document-image understanding',
      'Structured cards for summaries, care-path context, key points, questions, red flags, and safety notes',
      'Server-created ephemeral tokens keep long-lived credentials out of the browser',
      'Visible listening, speaking, and safety states'
    ],
    metrics: ['Complete Next.js deployment on Google Cloud Run', 'Separate live-voice and screenshot-analysis flows'],
    technologies: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Gemini Live', 'Gemini multimodal generation', 'Web Audio APIs', 'Google Cloud Run'],
    boundaries: [
      'Does not diagnose, recommend treatment, or provide medication advice',
      'Does not replace a clinician, clinically monitor users, or provide emergency response',
      'Red flags are general escalation language, not autonomous triage'
    ],
    repository: 'https://github.com/iampenuel/alethia-live',
    image: '/assets/alethia-live.png',
    liveDemo: 'https://alethia-live-695463819079.us-central1.run.app',
    folderGroup: 'AI Agents'
  },
  {
    id: 'mamathemba',
    name: 'Mamathemba',
    category: 'Maternal Health · Human-in-the-Loop AI · Referral Workflow',
    tagline: 'Referral readiness before escalation.',
    overview:
      'Mamathemba is a clinician-facing maternal emergency referral-readiness and handoff-support prototype for rural and resource-constrained clinics.',
    problem:
      'Maternal emergencies are also workflow events. Referral pathways, facility capability, transport details, missing facts, and inconsistent handoffs can create preparation friction even after a clinician recognizes an urgent concern.',
    highlights: [
      'Structured case intake and missing-information checks',
      'Grounded guidance and reviewable facility comparison',
      'Editable handoff drafting with clear provenance',
      'Referral-readiness checklist and explicit clinician approval',
      'Workflow product rather than an unrestricted chatbot'
    ],
    metrics: ['Prototype and simulated-workflow evaluation only', 'Human review remains required before escalation'],
    technologies: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'FastAPI', 'Python', 'IBM watsonx.ai', 'IBM watsonx Orchestrate', 'Google Geocoding API'],
    boundaries: [
      'No diagnosis, prescribing, medication dosing, autonomous triage, or dispatch',
      'No live bed capacity, transfer acceptance, EHR integration, or route optimization',
      'Prototype with curated or synthetic facility metadata; no clinical validation'
    ],
    repository: 'https://github.com/iampenuel/mamathemba',
    image: '/assets/mamathemba.png',
    liveDemo: 'https://mamathemba.vercel.app',
    folderGroup: 'Healthcare Workflow'
  },
  {
    id: 'pediatric-eeg',
    name: 'Pediatric EEG Seizure Detection',
    category: 'Biosignal Machine Learning · Deep Learning · Pediatric EEG',
    tagline: 'A collaborative 1D CNN research prototype for seizure-window classification.',
    overview:
      'A collaborative AI4ALL research and educational project using a one-dimensional convolutional neural network to classify seizure and non-seizure activity in pediatric scalp EEG windows from the CHB-MIT dataset.',
    problem:
      'The research question was whether a 1D CNN could learn useful temporal patterns from pediatric scalp EEG windows for binary seizure-window classification.',
    highlights: [
      'More than 9,500 prepared EEG windows',
      '18 EEG channels and 2,048 samples per window',
      'Conv1D stack with 32, 64, and 128 filters, global average pooling, dense layer, and dropout',
      'Streamlit research demonstration',
      'Collaborative AI4ALL project and symposium presentation'
    ],
    metrics: ['Approximately 90% held-out test accuracy on the prepared evaluation split'],
    technologies: ['Python', 'TensorFlow', 'Keras', 'NumPy', 'Pandas', 'Scikit-learn', 'Google Colab', 'Streamlit', 'CHB-MIT'],
    boundaries: [
      'Research and educational prototype — not a diagnostic device',
      'Window-level classification does not equal patient-level diagnosis',
      'Dataset-specific results may not generalize; no clinical deployment'
    ],
    repository: 'https://github.com/iampenuel/pediatric-seizure-cnn',
    folderGroup: 'Biosignals'
  },
  {
    id: 'neonatal-mri',
    name: 'Neonatal Brain MRI Age Classifier',
    category: 'Medical Imaging · Transfer Learning · Explainable AI',
    tagline: 'A 14-class developmental-age research prototype using transfer learning and Grad-CAM.',
    overview:
      'A research and educational medical-imaging project that predicts developmental-age bins from neonatal and infant brain MRI slices while emphasizing leakage-aware splitting and explainability.',
    problem:
      'The project explored whether transfer-learning CNNs could classify MRI slices into 14 developmental-age categories while reducing near-duplicate leakage risk and exposing model attention through Grad-CAM.',
    highlights: [
      'Compared ResNet-18 and EfficientNet-B0 transfer-learning models',
      'Perceptual hashing and group-aware splitting reduced duplicate and near-duplicate leakage risk',
      'Macro-F1 emphasized across 14 age classes',
      'Grad-CAM visualizations support inspection, not causal proof',
      'Reproducible evaluation artifacts and explicit limitations'
    ],
    metrics: ['EfficientNet-B0 macro-F1 ≈ 0.8775', 'Accuracy ≈ 0.8774', 'ResNet-18 baseline macro-F1 ≈ 0.8162'],
    technologies: ['Python', 'PyTorch', 'Torchvision', 'EfficientNet-B0', 'ResNet-18', 'Scikit-learn', 'Pillow', 'Perceptual hashing', 'Grad-CAM', 'Streamlit'],
    boundaries: [
      'True patient-level separation could not be guaranteed because explicit patient identifiers were unavailable',
      'Not a clinical developmental-age assessment, diagnostic tool, or medical device',
      'Primarily 2D slices; no external clinical validation or deployment'
    ],
    repository: 'https://github.com/iampenuel/neonatal-brain-age-classifier',
    folderGroup: 'Medical Imaging'
  }
];
