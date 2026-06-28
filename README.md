##🏛️ Janaspandana

A Hyperlocal Public Grievance Redressal Platform


Empowering citizens to report, track, and resolve community issues through AI



Show Image
Show Image
Show Image
Show Image


🔗 Live Demo

Public URL: https://smartgovernment-581700394328.asia-southeast1.run.app

View in AI Studio: https://ai.studio/apps/4ca25601-51af-4662-b162-7b2851dd6aa8


📌 Problem Statement Selected

Problem 2: Community Hero – Hyperlocal Problem Solver (VIBE2SHIP | Coding Ninjas x Google for Developers)

Communities across India frequently face unresolved local civic issues — potholes, water leakages, broken streetlights, waste accumulation, and deteriorating public infrastructure. Reporting these issues is often fragmented, difficult to track, and lacks transparency.

Core challenges addressed:


Reporting is fragmented across departments with no unified system
Citizens have no visibility into the status of complaints they raise
Little to no accountability exists for resolution timelines
Issues go unvalidated, duplicated, or ignored due to lack of community participation
Authorities lack data-driven insights to prioritize critical or recurring issues


The Challenge: Build a platform that enables citizens to identify, report, validate, track, and resolve community issues through collaboration, data, and intelligent automation — encouraging transparency, accountability, and active civic participation.


💡 Solution Overview

Janaspandana (meaning "People's Response" in Telugu) is an AI-powered hyperlocal public grievance redressal platform built entirely using Google AI Studio. It gives every citizen a simple, intelligent interface to report civic problems, get them automatically categorized, track resolution progress, and contribute to community-driven verification.

The platform was vibe-coded end-to-end using Google AI Studio's prompt canvas and the Gemini API, then containerized and deployed publicly on Google Cloud Run — accessible to any citizen via browser, with zero app installation required.

Citizen Journey:


Citizen opens the platform and describes a civic issue in natural language
Gemini AI automatically categorizes the issue (roads, sanitation, utilities) and assesses severity
The complaint is logged with geo-location context and assigned a unique tracking ID
Community members can verify or upvote the issue, adding legitimacy
Citizen receives real-time updates on the resolution status
Impact dashboards display community-wide issue trends and resolution metrics



✨ Key Features

FeatureDescription🗣️ AI-Powered Issue ReportingCitizens describe civic problems in natural language; Gemini intelligently categorizes and prioritizes them automatically🗺️ Geo-Location & MappingIssues are tagged to precise locations, enabling ward-wise and locality-level tracking and resolution management✅ Community VerificationCitizens validate and upvote reported issues, reducing duplicates and surfacing authentic grievances📊 Real-Time Issue TrackingEach complaint gets a unique ID and real-time status updates with full pipeline visibility📈 Impact DashboardsVisual dashboards show issue density, resolution rates, and most-affected areas for admins and citizens🤖 Intelligent CategorizationGemini classifies issues by type (roads, water, electricity, waste) and urgency level automatically🏆 GamificationCitizens earn recognition for reporting verified issues, encouraging sustained civic participation🔮 Predictive InsightsAI identifies recurring patterns and hotspots for proactive infrastructure maintenance


🛠️ Technologies Used

TechnologyPurpose / UsageHTML / CSS / JavaScriptFrontend interface — responsive civic portal UI, issue forms, status tracking, dashboard componentsGoogle Gemini APIAI backbone for issue categorization, severity assessment, natural language understanding, and intelligent responsesGoogle AI StudioPrompt engineering, system instruction design, model configuration, and vibe coding of the entire applicationGoogle Cloud RunServerless container deployment for public accessibility (asia-southeast1 region)Docker / ContainerApplication packaging for Cloud Run deploymentREST / Fetch APIFrontend-to-Gemini API communication layerGeo-location APIBrowser-based location tagging for precise issue mapping


🌐 Google Technologies Utilized

Google TechnologyHow It Was UsedGoogle AI StudioPrimary development environment — entire application logic, AI behavior, and conversational flows built and iterated using AI Studio's prompt canvas and model configuration tools (pure vibe coding approach)Gemini APIPowers all AI capabilities: natural language issue intake, automatic categorization by type and severity, intelligent response generation for citizens, and pattern analysis for predictive insightsGemini System InstructionsConfigured Gemini to act as a civic assistant — focused on grievance intake, respectful citizen communication, structured issue classification, and solution-oriented responsesGoogle Cloud RunServerless deployment of the Dockerized application on Google Cloud (asia-southeast1), enabling a stable public URL accessible to all citizens 24/7Google Cloud Platform (GCP)Underlying cloud infrastructure for hosting, container registry (Artifact Registry), and scalable deployment management


🧠 How the AI Works

Janaspandana uses Google Gemini with a custom system prompt to act as a civic grievance assistant:


Issue Intake: Citizens describe problems in natural language (English or regional languages)
Auto-Categorization: Gemini classifies the issue — Roads, Water, Electricity, Sanitation, Public Safety, etc.
Severity Assessment: The model assesses urgency (Critical / High / Medium / Low)
Response Generation: Citizens receive a confirmation with tracking ID and estimated resolution timeline
Pattern Detection: Repeated issues in the same area trigger predictive alerts



🚀 Run and Deploy Your AI Studio App

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/4ca25601-51af-4662-b162-7b2851dd6aa8

Run Locally

Prerequisites: Node.js


Install dependencies:


bash   npm install


Set the GEMINI_API_KEY in .env.local to your Gemini API key:


bash   cp .env.example .env.local
   # Edit .env.local and add:
   # GEMINI_API_KEY=your_api_key_here

Get your free API key at: https://aistudio.google.com/apikey


Run the app:


bash   npm run dev


Open your browser at http://localhost:3000



☁️ Deploy to Google Cloud Run

Prerequisites


Google Cloud CLI installed
A Google Cloud project with billing enabled
Docker installed


Steps


Authenticate with Google Cloud:


bash   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID


Build the Docker image:


bash   docker build -t janaspandana .


Tag and push to Artifact Registry:


bash   gcloud artifacts repositories create janaspandana-repo \
     --repository-format=docker \
     --location=asia-southeast1

   docker tag janaspandana \
     asia-southeast1-docker.pkg.dev/YOUR_PROJECT_ID/janaspandana-repo/janaspandana

   docker push \
     asia-southeast1-docker.pkg.dev/YOUR_PROJECT_ID/janaspandana-repo/janaspandana


Deploy to Cloud Run:


bash   gcloud run deploy janaspandana \
     --image asia-southeast1-docker.pkg.dev/YOUR_PROJECT_ID/janaspandana-repo/janaspandana \
     --region asia-southeast1 \
     --platform managed \
     --allow-unauthenticated \
     --set-env-vars GEMINI_API_KEY=your_api_key_here


Your public URL will appear in the output — it will look like:


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


B.Tech Data Science, Vignan Institute of Technology and Science, Hyderabad
Microsoft Learn Student Ambassador (MLSA)
Built for VIBE2SHIP | Coding Ninjas x Google for Developers



📄 License

This project is open source and available under the MIT License.
