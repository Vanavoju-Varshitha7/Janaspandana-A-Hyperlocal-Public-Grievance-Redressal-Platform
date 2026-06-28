<div align="center">
Show Image

🏛️ Janaspandana

A Hyperlocal Public Grievance Redressal Platform

Empowering citizens to report, track, and resolve community issues through AI

Show Image
Show Image
Show Image
Show Image

</div>

🔗 Live Demo

🌐 Public URL: https://smartgovernment-581700394328.asia-southeast1.run.app

🔬 View in AI Studio: https://ai.studio/apps/4ca25601-51af-4662-b162-7b2851dd6aa8


📌 Problem Statement Selected

Problem 2: Community Hero – Hyperlocal Problem Solver

(VIBE2SHIP | Coding Ninjas x Google for Developers)

Communities across India frequently face unresolved local civic issues — potholes, water leakages, broken streetlights, waste accumulation, and deteriorating public infrastructure. Reporting these issues is often fragmented, difficult to track, and lacks transparency.

Core Challenges Addressed


🔴 Reporting is fragmented across departments with no unified system
🔴 Citizens have no visibility into the status of complaints they raise
🔴 Little to no accountability exists for resolution timelines
🔴 Issues go unvalidated, duplicated, or ignored due to lack of community participation
🔴 Authorities lack data-driven insights to prioritize critical or recurring issues


The Challenge


Build a platform that enables citizens to identify, report, validate, track, and resolve community issues through collaboration, data, and intelligent automation — encouraging transparency, accountability, and active civic participation.




💡 Solution Overview

Janaspandana (meaning "People's Response" in Telugu) is an AI-powered hyperlocal public grievance redressal platform built entirely using Google AI Studio. It gives every citizen a simple, intelligent interface to report civic problems, get them automatically categorized, track resolution progress, and contribute to community-driven verification.

The platform was vibe-coded end-to-end using Google AI Studio's prompt canvas and the Gemini API, then containerized and deployed publicly on Google Cloud Run — accessible to any citizen via browser, with zero app installation required.

How It Works — Citizen Journey

StepAction1️⃣Citizen opens the platform and describes a civic issue in natural language2️⃣Gemini AI automatically categorizes the issue (roads, sanitation, utilities) and assesses severity3️⃣The complaint is logged with geo-location context and assigned a unique tracking ID4️⃣Community members can verify or upvote the issue, adding legitimacy5️⃣Citizen receives real-time updates on the resolution status6️⃣Impact dashboards display community-wide issue trends and resolution metrics


✨ Key Features

FeatureDescription🗣️ AI-Powered Issue ReportingCitizens describe civic problems in natural language; Gemini intelligently categorizes and prioritizes them automatically🗺️ Geo-Location & MappingIssues are tagged to precise locations, enabling ward-wise and locality-level tracking and resolution management✅ Community VerificationCitizens validate and upvote reported issues, reducing duplicates and surfacing authentic grievances📊 Real-Time Issue TrackingEach complaint gets a unique ID and real-time status updates with full pipeline visibility📈 Impact DashboardsVisual dashboards show issue density, resolution rates, and most-affected areas for admins and citizens🤖 Intelligent CategorizationGemini classifies issues by type (roads, water, electricity, waste) and urgency level automatically🏆 GamificationCitizens earn recognition for reporting verified issues, encouraging sustained civic participation🔮 Predictive InsightsAI identifies recurring patterns and hotspots for proactive infrastructure maintenance


🛠️ Technologies Used

TechnologyPurpose / UsageHTML / CSS / JavaScriptFrontend interface — responsive civic portal UI, issue forms, status tracking, dashboard componentsGoogle Gemini APIAI backbone for issue categorization, severity assessment, natural language understanding, and intelligent responsesGoogle AI StudioPrompt engineering, system instruction design, model configuration, and vibe coding of the entire applicationGoogle Cloud RunServerless container deployment for public accessibility (asia-southeast1 region)Docker / ContainerApplication packaging for Cloud Run deploymentREST / Fetch APIFrontend-to-Gemini API communication layerGeo-location APIBrowser-based location tagging for precise issue mapping


🌐 Google Technologies Utilized

Google TechnologyHow It Was UsedGoogle AI StudioPrimary development environment — entire application logic, AI behavior, and conversational flows built and iterated using AI Studio's prompt canvas and model configuration tools (pure vibe coding approach)Gemini APIPowers all AI capabilities: natural language issue intake, automatic categorization by type and severity, intelligent response generation for citizens, and pattern analysis for predictive insightsGemini System InstructionsConfigured Gemini to act as a civic assistant — focused on grievance intake, respectful citizen communication, structured issue classification, and solution-oriented responsesGoogle Cloud RunServerless deployment of the Dockerized application on Google Cloud (asia-southeast1), enabling a stable public URL accessible to all citizens 24/7Google Cloud Platform (GCP)Underlying cloud infrastructure for hosting, container registry (Artifact Registry), and scalable deployment management


🧠 How the AI Works

Janaspandana uses Google Gemini with a custom system prompt to act as a civic grievance assistant:

AI Pipeline

StageWhat Happens🗣️ Issue IntakeCitizens describe problems in natural language (English or regional languages)🏷️ Auto-CategorizationGemini classifies the issue — Roads, Water, Electricity, Sanitation, Public Safety, etc.⚠️ Severity AssessmentThe model assesses urgency level — Critical / High / Medium / Low📩 Response GenerationCitizens receive a confirmation with tracking ID and estimated resolution timeline🔁 Pattern DetectionRepeated issues in the same area trigger predictive alerts for authorities


🚀 Run and Deploy Your AI Studio App

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/4ca25601-51af-4662-b162-7b2851dd6aa8

Run Locally

Prerequisites


Node.js installed on your machine


Steps

1. Install dependencies:

bashnpm install

2. Set the GEMINI_API_KEY in .env.local to your Gemini API key:

bashcp .env.example .env.local
# Edit .env.local and add:
# GEMINI_API_KEY=your_api_key_here


Get your free API key at: https://aistudio.google.com/apikey



3. Run the app:

bashnpm run dev

4. Open your browser at:

http://localhost:3000


☁️ Deploy to Google Cloud Run

Prerequisites


Google Cloud CLI installed
A Google Cloud project with billing enabled
Docker installed


Steps

1. Authenticate with Google Cloud:

bashgcloud auth login
gcloud config set project YOUR_PROJECT_ID

2. Build the Docker image:

bashdocker build -t janaspandana .

3. Tag and push to Artifact Registry:

bashgcloud artifacts repositories create janaspandana-repo \
  --repository-format=docker \
  --location=asia-southeast1

docker tag janaspandana \
  asia-southeast1-docker.pkg.dev/YOUR_PROJECT_ID/janaspandana-repo/janaspandana

docker push \
  asia-southeast1-docker.pkg.dev/YOUR_PROJECT_ID/janaspandana-repo/janaspandana

4. Deploy to Cloud Run:

bashgcloud run deploy janaspandana \
  --image asia-southeast1-docker.pkg.dev/YOUR_PROJECT_ID/janaspandana-repo/janaspandana \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_api_key_here

5. Your public URL will appear in the output:

https://janaspandana-XXXXXXXXXXXX-as.a.run.app


📁 Project Structure

janaspandana/
├── .env.local          # API keys (never commit this!)
├── .env.example        # Template for environment variables
├── .gitignore          # Excludes .env.local and node_modules
├── Dockerfile          # Container configuration for Cloud Run
├── package.json        # Node.js dependencies and scripts
├── README.md           # This file
└── src/
    ├── index.html      # Main UI
    ├── app.js          # Core application logic + Gemini API calls
    └── style.css       # Styling


🔐 Environment Variables

VariableDescriptionRequiredGEMINI_API_KEYYour Google AI Studio API key✅ Yes


⚠️ Never commit your .env.local file to GitHub. It is already listed in .gitignore.




👩‍💻 Author

Varshitha


🎓 B.Tech Data Science, Vignan Institute of Technology and Science, Hyderabad
🏅 Microsoft Learn Student Ambassador (MLSA)
🚀 Built for VIBE2SHIP | Coding Ninjas x Google for Developers



📄 License

This project is open source and available under the MIT License.


<div align="center">
Built with ❤️ using Google AI Studio · Powered by Gemini · Deployed on Google Cloud Run

</div>
