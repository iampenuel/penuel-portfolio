# Selected Healthcare AI Projects

## 01. Sema

**Category:** Multimodal Healthcare AI · AI Agents · Human-Centered Product Engineering  
**Tagline:** Patient-generated evidence, organized for human review.

**Repository:** https://github.com/iampenuel/sema  
**Live Demo:** https://sema-delta.vercel.app

### Overview

Sema is a multimodal healthcare-AI workspace that helps people organize the information they want to communicate before a healthcare conversation.

Instead of asking an AI system to diagnose symptoms, Sema focuses on evidence capture and preparation. A user can record what happened, identify where something was noticed, save an audio observation, document a movement limitation, and attach supporting images or files. The system then organizes approved information into a clinician-reviewable evidence packet.

### Problem

People often enter healthcare conversations with important information scattered across memory, notes, photographs, recordings, documents, and changes in movement.

The problem is not always that information is missing. The problem is that the information is difficult to capture, organize, review, and communicate clearly.

### Core Workflows

Sema includes four evidence folders:

- **Story:** Preserves the person’s own description of what happened.
- **Body / Location:** Records where something was noticed.
- **Audio:** Stores an observation or reviewed transcript context.
- **Motion / Visual:** Stores movement notes and optional visual evidence.

The complete workflow is:

1. Start a session.
2. Capture evidence in one or more folders.
3. Review generated or organized content.
4. Edit, approve, regenerate, or remove information.
5. Assemble approved evidence into a final packet.
6. Export or share the reviewed packet.

### Key Features

- Multimodal evidence capture
- Story and symptom-history organization
- Body-location mapping
- Audio recording and transcript review
- Movement and visual-evidence capture
- AI-assisted structured summaries
- Live conversational agent
- Review Board with explicit approval states
- Evidence Packet generation
- PDF and ZIP export
- Shareable packet workflow
- Permission gates for high-impact actions
- Deterministic refusal and fallback behavior
- Visible safety and privacy boundaries

### Technical Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Gemini structured generation
- Gemini Live
- Azure AI Content Safety
- Web Audio APIs
- Browser-based PDF generation
- Action registry and permission-gated agent tools

### Engineering Decisions

- User-provided evidence remains separate from generated content.
- Generated content begins in a **Needs Review** state.
- AI-generated text is not automatically included in the final packet.
- High-impact actions require visible confirmation.
- The system uses structured schemas rather than unrestricted free-form output.
- Human approval remains necessary before evidence is exported or shared.
- Safety restrictions are enforced through both interface design and deterministic rules.

### Engineering Validation

The project completed:

- 555 automated checks
- Lint validation
- Type checking
- Production-build validation
- Browser QA
- Voice workflow testing
- AI schema and fallback testing

These checks demonstrate software stability and intended behavior. They do not constitute clinical validation.

### Safety Boundaries

Sema is not:

- a diagnostic system;
- a treatment recommendation system;
- a medication-advice system;
- an autonomous triage system;
- an electronic health record;
- a medical device;
- a replacement for a clinician;
- clinically validated.

Sema is a research and product prototype for evidence organization and communication support.

---

## 02. Synthetic Patient Utilization Intelligence

**Category:** Healthcare Data Engineering · Databricks · Analytics  
**Tagline:** A Bronze–Silver–Gold healthcare data pipeline for patient-level utilization analysis.

**Repository:** https://github.com/iampenuel/synthetic-patient-utilization-intelligence

### Overview

Synthetic Patient Utilization Intelligence is a Databricks healthcare-data project that transforms synthetic Synthea records into analysis-ready patient-utilization information.

The project demonstrates how fragmented healthcare files can be ingested, cleaned, joined, reconciled, and summarized through a medallion architecture.

### Problem

Healthcare data is often distributed across separate files for patients, encounters, observations, organizations, providers, procedures, conditions, and claims.

Before meaningful analysis can occur, the data must be:

- standardized;
- validated;
- joined correctly;
- checked for orphaned records;
- reconciled across layers;
- summarized at the appropriate patient level.

### Data Architecture

The project uses a three-layer Databricks medallion architecture:

#### Bronze Layer

The Bronze layer preserves raw source data with minimal transformation.

- 18 source CSV files inspected
- 8 core tables loaded into Bronze
- Raw schemas and row counts preserved
- Source-level auditability maintained

#### Silver Layer

The Silver layer cleans and standardizes the data.

- Data types normalized
- Dates parsed
- Keys standardized
- Encounter types categorized
- Patient, provider, and organization relationships validated
- Orphaned encounter checks performed
- Analysis-ready records produced

#### Gold Layer

The Gold layer creates patient-level utilization summaries.

The final Gold table includes measures such as:

- total encounters;
- emergency encounters;
- ambulatory encounters;
- inpatient encounters;
- observation counts;
- claim-cost totals;
- utilization classifications;
- associated organizations and providers.

### Dataset Summary

The processed synthetic dataset includes:

- **113 synthetic patients**
- **7,210 encounters**
- **238 emergency encounters**
- **114,335 observations**
- **Approximately $16.3 million in synthetic recorded claim costs**
- **Approximately 63.81 encounters per patient**
- **156,005 raw events represented in the architecture summary**

The final Gold encounter total reconciles to the Silver encounter total of 7,210.

No visible orphan encounters remained in the completed integrity check.

### Key Analytical Findings

The project explores:

- differences in utilization across synthetic patients;
- high-utilization patient groups;
- emergency-encounter frequency;
- organization-level encounter volume;
- patient-level claim-cost totals;
- utilization patterns across care settings.

### Technical Stack

- Databricks
- Apache Spark
- PySpark
- Spark SQL
- Python
- Delta-style medallion architecture
- Synthea synthetic healthcare data
- Databricks notebooks
- Dashboard visualizations

### Engineering Decisions

- Raw source data remains separate from cleaned analytical data.
- Bronze, Silver, and Gold layers have distinct responsibilities.
- Patient-level metrics are derived only after record-level integrity checks.
- Gold totals are reconciled against upstream tables.
- Synthetic costs are clearly presented as dataset values, not real financial impact.
- The project prioritizes traceability and reproducibility over unsupported prediction.

### Scope and Limitations

This project is:

- descriptive analytics;
- synthetic healthcare-data engineering;
- a portfolio demonstration of Databricks workflows.

It is not:

- predictive modeling;
- clinical-risk prediction;
- demand forecasting;
- real hospital data;
- real insurance billing analysis;
- evidence of financial savings;
- a deployed healthcare analytics product.

---

## 03. Alethia Live

**Category:** Real-Time Voice AI · Multimodal AI · Health Literacy  
**Tagline:** AI for clearer care navigation.

**Repository:** https://github.com/iampenuel/alethia-live  
**Live Demo:** https://alethia-live-695463819079.us-central1.run.app

### Overview

Alethia Live is a real-time healthcare-navigation and health-literacy agent that combines voice interaction with screenshot and document-image understanding.

A user can speak naturally with the agent or upload a healthcare screenshot, such as an after-visit summary, discharge instruction, appointment page, medication label, provider page, or lab-result screenshot.

Alethia then organizes the visible information into clearer, structured, plain-language guidance.

### Problem

Healthcare information is frequently written for clinical or administrative workflows rather than for patient understanding.

A static explanation may also fail to answer the next question. People may need to:

- ask a follow-up;
- hear the explanation aloud;
- understand what details matter;
- prepare questions for a clinician;
- recognize when urgent professional help may be appropriate.

### Core Experience

Alethia supports two connected interaction modes:

#### Real-Time Voice

- Browser microphone capture
- Gemini Live session
- Streaming model audio
- Visible listening and speaking states
- Natural follow-up questions
- Session controls and safety framing

#### Screenshot Understanding

- Screenshot or document-image upload
- Gemini image understanding
- Structured response generation
- Reviewable result cards
- Continued discussion through the voice session

### Structured Output

Depending on the uploaded content, the interface can present:

- **Plain-English Summary**
- **Care-Path Context**
- **What Matters Most**
- **Questions to Ask a Clinician**
- **Emergency Red Flags**
- **Safety Note**

Care-path context is presented as general informational framing, not as medical direction.

### Technical Architecture

The live voice flow is:

```text
Browser microphone
→ /api/live-token
→ Ephemeral Live token
→ Gemini Live API
→ Streaming model audio
→ Browser playback

The screenshot-understanding flow is:

Browser upload
→ /api/summary
→ Gemini image understanding
→ Structured response
→ Result cards
Technical Stack
Next.js
React
TypeScript
Tailwind CSS
Gemini Live
Gemini multimodal generation
@google/genai
Browser Web Audio APIs
Server-created ephemeral tokens
Google Cloud Run
Engineering Decisions
Long-lived server credentials are not exposed directly to the browser.
Live voice and screenshot understanding use separate model flows.
Structured outputs are rendered into predictable interface sections.
Listening and speaking states remain visible.
Safety language appears directly in the product experience.
The product is deployed as a complete Next.js application on Google Cloud Run.
Safety Boundaries

Alethia Live helps users understand healthcare information and prepare better questions.

It does not:

diagnose conditions;
recommend treatment;
provide medication advice;
replace a clinician;
perform autonomous triage;
monitor a patient clinically;
provide emergency-response services;
verify that an uploaded document is complete or medically accurate.

Emergency red flags are general escalation language, not automated clinical triage.

04. Mamathemba

Category: Maternal Health · Human-in-the-Loop AI · Referral Workflow
Tagline: Referral readiness before escalation.

Repository: https://github.com/iampenuel/mamathemba
Live Demo: https://mamathemba.vercel.app

Overview

Mamathemba is a clinician-facing maternal emergency referral-readiness and handoff-support prototype designed for rural and resource-constrained clinics.

The product helps a frontline maternity clinician capture structured case facts, identify missing information, compare potential referral destinations, prepare an editable handoff note, complete referral-readiness checks, and review the complete packet before escalation.

Problem

Maternal emergencies are not only clinical events. They are also workflow events.

A clinician may recognize an urgent concern but still lose time because:

referral pathways are fragmented;
receiving-facility capability is unclear;
transport information is incomplete;
handoff documentation is inconsistent;
essential facts are missing;
the receiving team does not receive a structured summary.

Mamathemba focuses on reducing referral-preparation friction without taking over the clinician’s decision.

Core Workflow
Structured Case Intake
→ Missing-Information Check
→ Grounded Guidance
→ Facility Comparison
→ Editable Handoff Draft
→ Referral-Readiness Checklist
→ Clinician Review and Approval
Structured Intake

The intake workflow can capture:

referring-clinic location;
case identifier;
patient age;
pregnancy or postpartum status;
gestational timing;
postpartum timing;
danger signs;
selected interventions;
blood pressure;
heart rate;
transport mode;
clinician notes.
Referral Review

The review workspace presents:

referral concern;
readiness status;
missing critical details;
entered-facts snapshot;
review note;
facility options;
selected-facility details;
handoff draft;
readiness checklist;
approval state.
Facility Comparison

Facility options can be compared using prototype metadata such as:

capability fit;
distance context;
travel estimate;
facility type;
referral rationale;
source of facility information;
verification reminders.

Facility comparison does not represent live bed availability or formal transfer acceptance. The clinician must verify receiving capability before transfer.

Handoff Support

The system can generate a clinician-reviewable handoff draft using:

structured entered facts;
deterministic workflow logic;
grounded guidance;
selected-facility information.

The handoff note remains editable.

The interface distinguishes:

entered facts;
deterministic checks;
retrieved information;
generated language;
clinician approval.
Technical Stack
Next.js
React
TypeScript
Tailwind CSS
FastAPI
Python
IBM watsonx.ai
IBM watsonx Orchestrate
Retrieval-augmented generation principles
Google Geocoding API
Vercel
Render
Engineering Decisions
Deterministic rules handle repeatable eligibility and missing-information checks.
Generative AI is used for bounded draft generation.
Facility data remains reviewable and source-aware.
The interface requires human review before escalation.
The system is designed as a workflow product, not as a chatbot.
Location normalization supports comparison but does not function as live dispatch.
Safety Boundaries

Mamathemba is for referral-readiness and handoff support only.

It does not:

diagnose maternal conditions;
prescribe treatment;
recommend medication dosing;
autonomously triage;
dispatch transportation;
confirm live facility availability;
confirm transfer acceptance;
replace clinician judgment;
function as an electronic medical record;
claim clinical validation.
Current Limitations
Prototype only
Curated or synthetic facility metadata
No live bed-capacity data
No dispatch integration
No EHR integration
Geocoding is not route optimization
Generated handoff language is not clinical advice
No validated effect on maternal outcomes
05. Pediatric EEG Seizure Detection

Category: Biosignal Machine Learning · Deep Learning · Pediatric EEG
Tagline: A collaborative 1D CNN research prototype for seizure-window classification.

Repository: https://github.com/iampenuel/pediatric-seizure-cnn

Overview

Pediatric EEG Seizure Detection is a collaborative AI4ALL research and educational project that uses a one-dimensional convolutional neural network to classify seizure and non-seizure activity in pediatric scalp EEG recordings.

The project uses the CHB-MIT Scalp EEG Database and demonstrates a complete machine-learning workflow covering signal preparation, model development, evaluation, and demonstration through Streamlit.

Research Question

Can a one-dimensional convolutional neural network learn useful temporal patterns from pediatric scalp EEG windows for seizure-versus-non-seizure classification?

Dataset

The project uses the CHB-MIT pediatric scalp EEG dataset.

The processed model input includes:

more than 9,500 EEG windows;
18 EEG channels;
2,048 samples per window;
binary labels for seizure and non-seizure activity.
Processing Workflow
CHB-MIT EEG Recordings
→ Channel Selection
→ Window Preparation
→ 18 × 2,048 Input Tensors
→ Normalization
→ Train/Test Preparation
→ 1D CNN
→ Binary Seizure Classification
Model Architecture

The model includes:

Conv1D layer with 32 filters
Conv1D layer with 64 filters
Conv1D layer with 128 filters
Pooling operations
Global average pooling
Dense layer with 64 units
Dropout of approximately 0.3
Binary classification output
Evaluation

The model achieved approximately:

90% held-out test accuracy

This result reflects performance on the project’s prepared evaluation split.

It does not represent clinical validation or real-world diagnostic performance.

Demonstration

The trained model was exposed through a Streamlit demonstration that allows users to explore the research workflow and model output.

Technical Stack
Python
TensorFlow / Keras
NumPy
Pandas
Scikit-learn
Google Colab
Streamlit
CHB-MIT Scalp EEG Database
Collaboration

This was a collaborative AI4ALL Ignite project.

Descriptions of the work should use collaborative language such as:

“We developed…”
“Our team processed…”
“The project evaluated…”

It should not be presented as a solely authored clinical system.

Limitations
Research and educational prototype
Not a diagnostic device
Not clinically validated
Window-level classification does not equal patient-level diagnosis
Dataset-specific performance may not generalize
EEG recordings may vary across equipment, institutions, and patients
Class imbalance can affect evaluation
No real-time hospital deployment
No integration with clinical EEG systems
06. Neonatal Brain MRI Age Classifier

Category: Medical Imaging · Transfer Learning · Explainable AI
Tagline: A 14-class developmental-age research prototype using transfer learning and Grad-CAM.

Repository: https://github.com/iampenuel/neonatal-brain-age-classifier

Overview

The Neonatal Brain MRI Age Classifier is a research and educational medical-imaging project that predicts developmental-age bins from neonatal and infant brain MRI slices.

The project compares two transfer-learning architectures and uses Grad-CAM to inspect which image regions influence model predictions.

Research Question

Can transfer-learning convolutional neural networks classify neonatal and infant brain MRI slices into developmental-age categories while maintaining careful data-splitting and explainability practices?

Dataset

The project uses a neonatal brain-development MRI dataset containing MRI slices grouped into:

14 developmental-age classes
ages spanning approximately 0–12 months
Data-Integrity Workflow

A major project focus was reducing the risk of duplicate or near-duplicate images appearing across dataset splits.

The workflow included:

filename analysis;
perceptual hashing;
near-duplicate grouping;
group-aware splitting;
image preprocessing;
transfer-learning model training.

Use this exact limitation when describing the split:

Perceptual-hash-based grouping and group-aware splitting were used to reduce duplicate and near-duplicate leakage. True patient-level separation could not be guaranteed because explicit patient identifiers were unavailable.

The project must never claim guaranteed patient-level separation.

Models
ResNet-18
Transfer-learning baseline
Macro-F1: approximately 0.8162
EfficientNet-B0
Stronger-performing model
Macro-F1: approximately 0.8775
Accuracy: approximately 0.8774

EfficientNet-B0 achieved the stronger overall result across the 14 age classes.

Explainability

Grad-CAM was used to visualize image regions that contributed to model predictions.

Grad-CAM provides an interpretability aid, but it does not prove that the model is using medically correct or causally meaningful image features.

Technical Stack
Python
PyTorch
Torchvision
ResNet-18
EfficientNet-B0
Scikit-learn
Pillow
Perceptual hashing
Grad-CAM
Streamlit
Google Colab
Engineering Decisions
Transfer learning was used instead of training from scratch.
Macro-F1 was emphasized because the task contains multiple age classes.
Near-duplicate leakage was treated as a major data-integrity risk.
Group-aware splitting was used after perceptual-hash analysis.
Explainability was added through Grad-CAM.
Results were presented with explicit limitations rather than clinical claims.
Limitations
Research and educational prototype
Not a clinical developmental-age assessment
Not a diagnostic tool
Not a medical device
Explicit patient identifiers were unavailable
True patient-level separation could not be guaranteed
The project primarily uses 2D MRI slices
Dataset size and composition limit generalization
Grad-CAM does not prove medically correct reasoning
No clinical deployment
No external clinical validation
Portfolio Positioning Summary

Together, these six projects demonstrate work across:

AI agents and intelligent workflows
Multimodal healthcare AI
Healthcare data engineering
Real-time browser voice systems
Maternal-health workflow support
Biosignal machine learning
Medical-image classification
Explainable AI
Responsible AI
Human review and approval systems
Full-stack AI product engineering

The shared design principle across the portfolio is:

The model should be one part of a complete, reviewable human workflow—not the final authority.