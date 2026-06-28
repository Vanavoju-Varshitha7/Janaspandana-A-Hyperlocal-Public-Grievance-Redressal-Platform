import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { CivicSignal, Lifecycle } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("GEMINI_API_KEY environment variable is not defined!");
}

// Mock analysis fallback
function mockAnalyze(narrative: string) {
  const lower = narrative.toLowerCase();
  if (lower.includes("leak") || lower.includes("water") || lower.includes("pipe") || lower.includes("burst")) {
    return {
      classification: "Water Supply",
      priority: "HIGH",
      department: "Water Supply Board",
      reasoning: "Detected key references to water leakage or pipe burst, representing a severe municipal emergency with high risk of road damage."
    };
  }
  if (lower.includes("light") || lower.includes("electricity") || lower.includes("power") || lower.includes("blackout")) {
    return {
      classification: "Electricity & Power",
      priority: "MEDIUM",
      department: "Power Grid Authority",
      reasoning: "The narrative highlights street lighting or electrical issues, which pose significant night-time safety hazards."
    };
  }
  if (lower.includes("garbage") || lower.includes("waste") || lower.includes("smell") || lower.includes("trash") || lower.includes("pest")) {
    return {
      classification: "Sanitation & Waste Management",
      priority: "MEDIUM",
      department: "Waste Management Division",
      reasoning: "Refers to accumulation of waste, pests, or sanitation concerns that present health hazards to the local community."
    };
  }
  if (lower.includes("hole") || lower.includes("pothole") || lower.includes("road") || lower.includes("street") || lower.includes("damage")) {
    return {
      classification: "Roads & Infrastructure",
      priority: "HIGH",
      department: "Department of Public Works",
      reasoning: "Infrastructure damage or potholes detected. High urgency due to vehicle damage and safety risks on public roads."
    };
  }
  return {
    classification: "General Civic Request",
    priority: "LOW",
    department: "Municipal Administration",
    reasoning: "Categorized under general civic services. Standard priority level applied."
  };
}

// In-Memory Database State
const users = [
  { email: "priya.verma@gmail.com", password: "password", id: "citizen_1", name: "Priya Verma", role: "citizen" },
  { email: "amit.sharma@gmail.com", password: "password", id: "official_1", name: "Officer Amit Sharma", role: "official", officerId: "ASD123" },
  { email: "unit12@gov.in", password: "password", id: "unit_12", name: "Unit 12 - rapid Hydro Force", role: "response_force", unitId: "ADS123" }
];

let signals: CivicSignal[] = [
  {
    id: "CMP-001",
    narrative: "Severe water leakage on Sector 4 main road since 72 hours. Water is bursting through the asphalt creating a flood-like state.",
    classification: "Water Supply",
    priority: "HIGH",
    department: "Water Supply Board",
    lifecycle: Lifecycle.PENDING,
    location: {
      lat: 28.6139,
      lng: 77.2090,
      address: "Sector 4 Main Road, New Delhi"
    },
    upvotes: 12,
    reporter: "priya.verma@gmail.com",
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    aiAnalysis: {
      classification: "Water Supply",
      priority: "HIGH",
      department: "Water Supply",
      reasoning: "High urgency due to potential road damage and severe municipal water wastage over 3 days."
    }
  },
  {
    id: "CMP-002",
    narrative: "Non-functional street lighting near central park causing safety concerns.",
    classification: "Electricity & Power",
    priority: "MEDIUM",
    department: "Electricity & Power",
    lifecycle: Lifecycle.IN_PROGRESS,
    location: {
      lat: 28.6304,
      lng: 77.2177,
      address: "Connaught Place Near Central Park, New Delhi"
    },
    upvotes: 45,
    reporter: "priya.verma@gmail.com",
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    aiAnalysis: {
      classification: "Electricity & Power",
      priority: "MEDIUM",
      department: "Electricity & Power",
      reasoning: "Public safety risk flagged due to persistent lack of nighttime illumination around high foot-traffic park area."
    }
  },
  {
    id: "CMP-003",
    narrative: "Uncollected waste accumulation near community center causing health hazard.",
    classification: "Sanitation & Waste Management",
    priority: "MEDIUM",
    department: "Sanitation & Waste Management",
    lifecycle: Lifecycle.PENDING,
    location: {
      lat: 28.6250,
      lng: 77.2300,
      address: "Mandi House Neighborhood Center, New Delhi"
    },
    upvotes: 3,
    reporter: "priya.verma@gmail.com",
    createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    aiAnalysis: {
      classification: "Sanitation & Waste Management",
      priority: "MEDIUM",
      department: "Sanitation & Waste Management",
      reasoning: "Sanitation failure leading to toxic odor accumulation and potential breeding ground for disease vectors near a school."
    }
  }
];

let projects = [
  {
    id: "PRJ-101",
    name: "METRO BLUE LINE EXTENSION",
    category: "PUBLIC WORKS (ROADS & INFRASTRUCTURE)",
    description: "Extending the rapid transit network to Sector 62 to reduce traffic congestion and improve connectivity for 50,000+ daily commuters.",
    status: "IN_PROGRESS",
    progress: 32,
    budgetSuggested: 150500000,
    budgetUtilized: 45000000,
    timeline: "15/01/2024 - 30/06/2026",
    imageUrlBefore: "https://images.unsplash.com/photo-1554344728-77cf90d9ed26?q=80&w=600&auto=format&fit=crop",
    imageUrlAfter: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: "PRJ-102",
    name: "SMART LED STREETLIGHT GRID",
    category: "ELECTRICITY & POWER",
    description: "Replacing 5,000 sodium vapor lamps with IoT-enabled LED lights to save 40% energy and improve night safety.",
    status: "IN_PROGRESS",
    progress: 88,
    budgetSuggested: 2000000,
    budgetUtilized: 1850000,
    timeline: "01/03/2024 - 28/02/2025",
    imageUrlBefore: "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?q=80&w=600&auto=format&fit=crop",
    imageUrlAfter: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: "PRJ-103",
    name: "RIVERFRONT FLOOD BARRIER",
    category: "DISASTER MANAGEMENT",
    description: "Construction of reinforced embankments along the Yamuna bank to prevent seasonal flooding in low-lying residential areas.",
    status: "DELAYED",
    progress: 15,
    budgetSuggested: 7500000,
    budgetUtilized: 1200000,
    timeline: "01/06/2024 - 01/09/2025",
    imageUrlBefore: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=600&auto=format&fit=crop",
    imageUrlAfter: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: "PRJ-104",
    name: "COMMUNITY HEALTH CENTER UPGRADE",
    category: "HEALTHCARE & PUBLIC HEALTH",
    description: "Renovation of 5 primary health centers with new diagnostic equipment and increased bed capacity.",
    status: "COMPLETED",
    progress: 100,
    budgetSuggested: 3500000,
    budgetUtilized: 3500000,
    timeline: "01/02/2024 - 15/12/2024",
    imageUrlBefore: "https://images.unsplash.com/photo-1584515901187-60142ba7f22c?q=80&w=600&auto=format&fit=crop",
    imageUrlAfter: "https://images.unsplash.com/photo-1512678080530-7760d81faba6?q=80&w=600&auto=format&fit=crop"
  }
];

// Seed IoT Sensors across major cities
const citySensors: Record<string, any[]> = {
  DELHI: [
    { id: "IOT-CAM-201", type: "air", name: "Anand Vihar AQI Probe", lat: 28.6476, lng: 77.3150, status: "CRITICAL", reading: 342, unit: "AQI", history: [{time:"08:00",value:290},{time:"10:00",value:310},{time:"12:00",value:325},{time:"14:00",value:342}] },
    { id: "IOT-CAM-202", type: "water", name: "Yamuna Sector 4 Flowmeter", lat: 28.6139, lng: 77.2090, status: "ONLINE", reading: 45.1, unit: "m³/s", history: [{time:"08:00",value:40.2},{time:"10:00",value:42.5},{time:"12:00",value:44.1},{time:"14:00",value:45.1}] },
    { id: "IOT-CAM-203", type: "waste", name: "Connaught Place Smart Bin 4", lat: 28.6304, lng: 77.2177, status: "ONLINE", reading: 85, unit: "% Fill", history: [{time:"08:00",value:50},{time:"10:00",value:65},{time:"12:00",value:78},{time:"14:00",value:85}] },
    { id: "IOT-CAM-204", type: "smart", name: "Rajpath LED Grid", lat: 28.6129, lng: 77.2295, status: "ONLINE", reading: 92, unit: "% Load", history: [{time:"08:00",value:95},{time:"10:00",value:95},{time:"12:00",value:92},{time:"14:00",value:92}] },
    { id: "IOT-CAM-205", type: "traffic", name: "ITO Crossing Camera Probe", lat: 28.6282, lng: 77.2410, status: "ONLINE", reading: 74, unit: "Car/min", history: [{time:"08:00",value:85},{time:"10:00",value:90},{time:"12:00",value:65},{time:"14:00",value:74}] }
  ],
  MUMBAI: [
    { id: "IOT-MUM-301", type: "air", name: "Bandra AQI Probe", lat: 19.0596, lng: 72.8295, status: "ONLINE", reading: 95, unit: "AQI", history: [{time:"08:00",value:80},{time:"10:00",value:85},{time:"12:00",value:92},{time:"14:00",value:95}] },
    { id: "IOT-MUM-302", type: "water", name: "Mithi River Flow Sensor", lat: 19.0760, lng: 72.8777, status: "CRITICAL", reading: 120.4, unit: "m³/s", history: [{time:"08:00",value:85.0},{time:"10:00",value:102.3},{time:"12:00",value:115.1},{time:"14:00",value:120.4}] },
    { id: "IOT-MUM-303", type: "waste", name: "Marine Drive Bin 2", lat: 18.9431, lng: 72.8230, status: "ONLINE", reading: 30, unit: "% Fill", history: [{time:"08:00",value:10},{time:"10:00",value:20},{time:"12:00",value:25},{time:"14:00",value:30}] }
  ],
  BANGALORE: [
    { id: "IOT-BLR-401", type: "air", name: "Silk Board AQI Sensor", lat: 12.9176, lng: 77.6244, status: "ONLINE", reading: 135, unit: "AQI", history: [{time:"08:00",value:110},{time:"10:00",value:145},{time:"12:00",value:130},{time:"14:00",value:135}] },
    { id: "IOT-BLR-402", type: "traffic", name: "Outer Ring Road Telemetry", lat: 12.9250, lng: 77.6500, status: "CRITICAL", reading: 110, unit: "Car/min", history: [{time:"08:00",value:120},{time:"10:00",value:115},{time:"12:00",value:105},{time:"14:00",value:110}] }
  ],
  CHENNAI: [
    { id: "IOT-MAA-501", type: "water", name: "Adyar River Estuary Telemetry", lat: 13.0110, lng: 80.2450, status: "ONLINE", reading: 18.3, unit: "m³/s", history: [{time:"08:00",value:17.5},{time:"10:00",value:18.0},{time:"12:00",value:18.3},{time:"14:00",value:18.3}] },
    { id: "IOT-MAA-502", type: "smart", name: "Marina Beach Smart Grid", lat: 13.0480, lng: 80.2820, status: "ONLINE", reading: 80, unit: "% Load", history: [{time:"08:00",value:85},{time:"10:00",value:85},{time:"12:00",value:80},{time:"14:00",value:80}] }
  ],
  KOLKATA: [
    { id: "IOT-CCU-601", type: "air", name: "Howrah AQI Monitor", lat: 22.5850, lng: 88.3420, status: "CRITICAL", reading: 204, unit: "AQI", history: [{time:"08:00",value:180},{time:"10:00",value:195},{time:"12:00",value:210},{time:"14:00",value:204}] },
    { id: "IOT-CCU-602", type: "water", name: "Hooghly River Stage Gauge", lat: 22.5697, lng: 88.3512, status: "ONLINE", reading: 5.2, unit: "meters", history: [{time:"08:00",value:5.0},{time:"10:00",value:5.1},{time:"12:00",value:5.2},{time:"14:00",value:5.2}] }
  ],
  HYDERABAD: [
    { id: "IOT-HYD-701", type: "air", name: "Charminar AQI Probe", lat: 17.3616, lng: 78.4747, status: "ONLINE", reading: 110, unit: "AQI", history: [{time:"08:00",value:95},{time:"10:00",value:105},{time:"12:00",value:115},{time:"14:00",value:110}] },
    { id: "IOT-HYD-702", type: "water", name: "Hussain Sagar Water Gauge", lat: 17.4239, lng: 78.4738, status: "ONLINE", reading: 32.4, unit: "m³/s", history: [{time:"08:00",value:30.1},{time:"10:00",value:31.5},{time:"12:00",value:32.4},{time:"14:00",value:32.4}] },
    { id: "IOT-HYD-703", type: "smart", name: "HITEC City Smart Grid", lat: 17.4483, lng: 78.3741, status: "ONLINE", reading: 88, unit: "% Load", history: [{time:"08:00",value:92},{time:"10:00",value:90},{time:"12:00",value:85},{time:"14:00",value:88}] },
    { id: "IOT-HYD-704", type: "traffic", name: "Jubilee Hills Traffic Crossing", lat: 17.4065, lng: 78.4111, status: "CRITICAL", reading: 124, unit: "Car/min", history: [{time:"08:00",value:110},{time:"10:00",value:130},{time:"12:00",value:115},{time:"14:00",value:124}] }
  ],
  JAIPUR: [
    { id: "IOT-JAI-801", type: "air", name: "Hawa Mahal AQI Probe", lat: 26.9239, lng: 75.8267, status: "ONLINE", reading: 145, unit: "AQI", history: [{time:"08:00",value:130},{time:"10:00",value:140},{time:"12:00",value:150},{time:"14:00",value:145}] },
    { id: "IOT-JAI-802", type: "water", name: "Jal Mahal Reservoir Probe", lat: 26.9587, lng: 75.8586, status: "ONLINE", reading: 4.8, unit: "meters", history: [{time:"08:00",value:4.5},{time:"10:00",value:4.7},{time:"12:00",value:4.8},{time:"14:00",value:4.8}] },
    { id: "IOT-JAI-803", type: "waste", name: "Johri Bazar Smart Bin 2", lat: 26.9150, lng: 75.8112, status: "CRITICAL", reading: 96, unit: "% Fill", history: [{time:"08:00",value:70},{time:"10:00",value:85},{time:"12:00",value:92},{time:"14:00",value:96}] }
  ],
  PUNE: [
    { id: "IOT-PUN-901", type: "air", name: "Shivajinagar AQI Probe", lat: 18.5308, lng: 73.8474, status: "ONLINE", reading: 85, unit: "AQI", history: [{time:"08:00",value:75},{time:"10:00",value:80},{time:"12:00",value:90},{time:"14:00",value:85}] },
    { id: "IOT-PUN-902", type: "water", name: "Mutha River Flow Sensor", lat: 18.5089, lng: 73.8263, status: "ONLINE", reading: 15.6, unit: "m³/s", history: [{time:"08:00",value:14.2},{time:"10:00",value:15.0},{time:"12:00",value:15.6},{time:"14:00",value:15.6}] },
    { id: "IOT-PUN-903", type: "smart", name: "Hinjewadi IT Grid load", lat: 18.5793, lng: 73.7388, status: "CRITICAL", reading: 98, unit: "% Load", history: [{time:"08:00",value:95},{time:"10:00",value:99},{time:"12:00",value:97},{time:"14:00",value:98}] }
  ],
  AHMEDABAD: [
    { id: "IOT-AMD-1001", type: "water", name: "Sabarmati Flow Sensor", lat: 23.0305, lng: 72.5850, status: "ONLINE", reading: 22.8, unit: "m³/s", history: [{time:"08:00",value:20.1},{time:"10:00",value:21.5},{time:"12:00",value:22.8},{time:"14:00",value:22.8}] },
    { id: "IOT-AMD-1002", type: "air", name: "Ashram Road AQI Probe", lat: 23.0250, lng: 72.5610, status: "ONLINE", reading: 112, unit: "AQI", history: [{time:"08:00",value:100},{time:"10:00",value:108},{time:"12:00",value:115},{time:"14:00",value:112}] },
    { id: "IOT-AMD-1003", type: "waste", name: "Kankaria Lake Smart Bin", lat: 23.0112, lng: 72.5930, status: "ONLINE", reading: 45, unit: "% Fill", history: [{time:"08:00",value:20},{time:"10:00",value:35},{time:"12:00",value:42},{time:"14:00",value:45}] }
  ],
  LUCKNOW: [
    { id: "IOT-LKO-1101", type: "air", name: "Hazratganj AQI Probe", lat: 26.8488, lng: 80.9425, status: "ONLINE", reading: 168, unit: "AQI", history: [{time:"08:00",value:140},{time:"10:00",value:155},{time:"12:00",value:170},{time:"14:00",value:168}] },
    { id: "IOT-LKO-1102", type: "water", name: "Gomti River Level Meter", lat: 26.8622, lng: 80.9610, status: "ONLINE", reading: 4.1, unit: "meters", history: [{time:"08:00",value:3.8},{time:"10:00",value:4.0},{time:"12:00",value:4.1},{time:"14:00",value:4.1}] }
  ],
  KOCHI: [
    { id: "IOT-COK-1201", type: "water", name: "Vembanad Estuary Level", lat: 9.9482, lng: 76.2625, status: "ONLINE", reading: 1.8, unit: "meters", history: [{time:"08:00",value:1.6},{time:"10:00",value:1.7},{time:"12:00",value:1.8},{time:"14:00",value:1.8}] },
    { id: "IOT-COK-1202", type: "traffic", name: "MG Road Traffic Camera", lat: 9.9720, lng: 76.2815, status: "ONLINE", reading: 62, unit: "Car/min", history: [{time:"08:00",value:55},{time:"10:00",value:68},{time:"12:00",value:60},{time:"14:00",value:62}] }
  ]
};

let polls = [
  {
    id: "PLL-001",
    question: "SHOULD WE IMPLEMENT A CAR-FREE ZONE IN THE CENTRAL MARKET ON WEEKENDS?",
    options: [
      { text: "YES, IT WILL REDUCE POLLUTION", votes: 159 },
      { text: "NO, IT WILL AFFECT BUSINESS", votes: 82 },
      { text: "ONLY ON SUNDAYS", votes: 43 }
    ],
    totalVotes: 284
  },
  {
    id: "PLL-002",
    question: "WHICH PARK SHOULD BE PRIORITIZED FOR THE NEXT RENOVATION CYCLE?",
    options: [
      { text: "TAGORE GARDEN", votes: 128 },
      { text: "NEHRU PARK", votes: 62 },
      { text: "SECTOR 12 GREEN BELT", votes: 222 }
    ],
    totalVotes: 412
  }
];

// Document secure vault store for Priya Verma
let secureVaultDocs = [
  { type: "AADHAAR", idNumber: "0000-XXXX-9821", passcode: "123456", isUploaded: true, uploadDate: "2026-05-12T10:00:00Z" }
];

// API Endpoints

// 1. Auth & Accounts
app.post("/api/auth/login", (req, res) => {
  const { email, password, officerId, unitId, role } = req.body;

  if (role === "citizen") {
    const user = users.find(u => u.email === email && u.password === password && u.role === "citizen");
    if (user) {
      return res.json({ success: true, user: { email: user.email, name: user.name, role: "citizen" } });
    }
  } else if (role === "official") {
    const user = users.find(u => u.officerId === officerId && u.password === password && u.role === "official");
    if (user) {
      return res.json({ success: true, user: { id: user.officerId, name: user.name, role: "official" } });
    }
  } else if (role === "response_force") {
    const user = users.find(u => u.unitId === unitId && u.password === password && u.role === "response_force");
    if (user) {
      return res.json({ success: true, user: { id: user.unitId, name: user.name, role: "response_force" } });
    }
  }
  return res.status(401).json({ success: false, error: "ID or password not found in database." });
});

app.post("/api/auth/register", (req, res) => {
  const { email, password, officerId, unitId, name, role } = req.body;

  if (role === "citizen") {
    if (users.some(u => u.email === email)) {
      return res.status(400).json({ success: false, error: "Citizen already registered with this email." });
    }
    const newUser = { email, password, id: `citizen_${users.length + 1}`, name: name || "New Citizen", role: "citizen" };
    users.push(newUser);
    return res.json({ success: true, user: { email: newUser.email, name: newUser.name, role: "citizen" } });
  } else if (role === "official") {
    if (users.some(u => u.officerId === officerId)) {
      return res.status(400).json({ success: false, error: "Officer already registered with this ID." });
    }
    const newUser = { email: `${officerId}@gov.in`, password, id: `official_${users.length + 1}`, name: name || `Officer ${officerId}`, role: "official", officerId };
    users.push(newUser);
    return res.json({ success: true, user: { id: newUser.officerId, name: newUser.name, role: "official" } });
  } else if (role === "response_force") {
    if (users.some(u => u.unitId === unitId)) {
      return res.status(400).json({ success: false, error: "Unit already registered with this ID." });
    }
    const newUser = { email: `${unitId}@gov.in`, password, id: `unit_${users.length + 1}`, name: name || `Response Unit ${unitId}`, role: "response_force", unitId };
    users.push(newUser);
    return res.json({ success: true, user: { id: newUser.unitId, name: newUser.name, role: "response_force" } });
  }
  return res.status(400).json({ success: false, error: "Invalid registration parameters." });
});

// 2. Signals
app.get("/api/signals", (req, res) => {
  res.json({ signals });
});

app.post("/api/signals", async (req, res) => {
  const { narrative, location, reporter, imageUrl } = req.body;

  if (!narrative || !location) {
    return res.status(400).json({ error: "Narrative and location are required" });
  }

  // Pre-analyze using Gemini or fallback
  let analysis = mockAnalyze(narrative);
  let analyzedWithAI = false;

  if (ai) {
    try {
      const prompt = `Analyze this civic issue description submitted by a citizen and output a JSON object categorizing it.
Issue Description: "${narrative}"

Please decide:
1. classification: A 2-4 word specific category (e.g., "Water Supply", "Electricity & Power", "Sanitation & Waste Management", "Roads & Infrastructure", "Public Safety", "Disaster Management").
2. priority: One of "LOW", "MEDIUM", "HIGH", "CRITICAL".
3. department: The public department responsible (e.g., "Water Supply Board", "Power Grid Authority", "Waste Management Division", "Department of Public Works", "Emergency Response Team").
4. reasoning: A 1-2 sentence professional, clear justification for these decisions based on the citizen's narrative.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              classification: { type: Type.STRING },
              priority: { type: Type.STRING },
              department: { type: Type.STRING },
              reasoning: { type: Type.STRING }
            },
            required: ["classification", "priority", "department", "reasoning"]
          }
        }
      });

      const analysisText = response.text;
      if (analysisText) {
        analysis = JSON.parse(analysisText);
        analyzedWithAI = true;
      }
    } catch (err) {
      console.error("Gemini pre-analysis error. Using fallback.", err);
    }
  }

  const newSignal = {
    id: `CMP-${String(signals.length + 1).padStart(3, "0")}`,
    narrative,
    classification: analysis.classification,
    priority: (analysis.priority as any) || "MEDIUM",
    department: analysis.department,
    lifecycle: "PENDING" as any,
    location: {
      lat: Number(location.lat) || 28.6139,
      lng: Number(location.lng) || 77.2090,
      address: location.address || "New Delhi, India"
    },
    upvotes: 1,
    reporter: reporter || "anonymous",
    imageUrl,
    createdAt: new Date().toISOString(),
    aiAnalysis: {
      classification: analysis.classification,
      priority: analysis.priority,
      department: analysis.department,
      reasoning: analysis.reasoning
    }
  };

  signals.push(newSignal);
  res.json({ success: true, signal: newSignal, analyzedWithAI });
});

// Update signal lifecycle or dispatch unit (Official & Response Force)
app.patch("/api/signals/:id", (req, res) => {
  const { id } = req.params;
  const { lifecycle, dispatchedUnitId } = req.body;

  const signal = signals.find(s => s.id === id);
  if (!signal) {
    return res.status(404).json({ error: "Signal not found" });
  }

  if (lifecycle !== undefined) {
    signal.lifecycle = lifecycle;
  }
  if (dispatchedUnitId !== undefined) {
    signal.dispatchedUnitId = dispatchedUnitId;
  }

  res.json({ success: true, signal });
});

// Upvote Civic Signal
app.post("/api/signals/:id/upvote", (req, res) => {
  const { id } = req.params;
  const signal = signals.find(s => s.id === id);
  if (!signal) {
    return res.status(404).json({ error: "Signal not found" });
  }
  signal.upvotes += 1;
  res.json({ success: true, upvotes: signal.upvotes });
});

// 3. Projects
app.get("/api/projects", (req, res) => {
  res.json({ projects });
});

// 4. IoT Sensors
app.get("/api/sensors/:city", (req, res) => {
  const city = req.params.city.toUpperCase();
  const sensors = citySensors[city] || citySensors.DELHI;
  res.json({ sensors });
});

// 5. Polls
app.get("/api/polls", (req, res) => {
  res.json({ polls });
});

app.post("/api/polls/:id/vote", (req, res) => {
  const { id } = req.params;
  const { optionIndex } = req.body;

  const poll = polls.find(p => p.id === id);
  if (!poll) {
    return res.status(404).json({ error: "Poll not found" });
  }

  if (optionIndex >= 0 && optionIndex < poll.options.length) {
    poll.options[optionIndex].votes += 1;
    poll.totalVotes += 1;
    res.json({ success: true, poll });
  } else {
    res.status(400).json({ error: "Invalid option index" });
  }
});

// 6. Secure Vault
app.get("/api/vault", (req, res) => {
  res.json({ vault: secureVaultDocs });
});

app.post("/api/vault", (req, res) => {
  const { type, passcode, idNumber } = req.body;
  
  // Find or create
  let doc = secureVaultDocs.find(d => d.type === type);
  if (doc) {
    doc.passcode = passcode;
    doc.idNumber = idNumber || doc.idNumber;
    doc.isUploaded = true;
    doc.uploadDate = new Date().toISOString();
  } else {
    doc = {
      type: type || "CUSTOM_ID",
      idNumber: idNumber || "XXXX-XXXX-XXXX",
      passcode,
      isUploaded: true,
      uploadDate: new Date().toISOString()
    };
    secureVaultDocs.push(doc);
  }
  res.json({ success: true, doc });
});

// Gemini assistant chat route
app.post("/api/gemini/chat", async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    if (!ai) {
      return res.json({
        response: `Hello! I am your SmartGovernment AI Assistant. I am currently running in offline simulation mode because the GEMINI_API_KEY is not set. 

But I can still help you! I can see we have reported issues like:
- **CMP-001**: Severe water leakage on Sector 4 Main Road (HIGH priority, PENDING)
- **CMP-002**: Non-functional street lighting near CP Central Park (MEDIUM priority, IN PROGRESS)
- **CMP-003**: Uncollected waste accumulation near Mandi House (MEDIUM priority, PENDING)

Please configure your GEMINI_API_KEY in the Secrets panel to activate full cognitive intelligence!`,
        source: "mock-fallback"
      });
    }

    const signalsContext = signals.map(s => 
      `- [${s.id}] Status: ${s.lifecycle}, Category: ${s.classification}, Priority: ${s.priority}, Location: ${s.location.address}, Upvotes: ${s.upvotes}`
    ).join("\n");

    const projectsContext = projects.map(p => 
      `- [${p.id}] ${p.name}: Budget Allocated: $${p.budgetSuggested}, Budget Utilized: $${p.budgetUtilized}, Status: ${p.status}`
    ).join("\n");

    const systemPrompt = `You are the SmartGovernment AI Civic Assistant, an advanced, polite, and helpful AI designed to help citizens and government officials manage civic issues, track signals, explain municipal projects, and clarify public safety initiatives in their city.

Here is the current state of reported Civic Signals:
${signalsContext}

Here is the current state of Active Municipal Projects:
${projectsContext}

Guidelines:
1. Always be polite, supportive, and precise.
2. If the user asks about a reported signal (e.g., CMP-001, CMP-002, CMP-003), provide the exact status and details from the data above.
3. If the user asks how to report an issue, explain that they can use the "REPORT" tab, select a location on the interactive map, type a narrative or use voice dictation, upload an image, and click "Submit Official Civic Signal".
4. If they ask about the Secure Vault, explain that it is an offline, encrypted storage for legal documents (like Aadhaar card, PAN card, driver license, municipal certificates) protected by a passcode of their choosing. They can select ID type, input ID number, and click upload to encrypt and store documents securely.
5. If they ask about SOS Emergency, explain that the SOS EMERGENCY button triggers an immediate 3-second countdown after which active satellite tracking coordinates are dispatched to relevant units (Fire, Medical, Police, Flood, Violence).
6. Keep answers concise, highly readable, and formatted with markdown bullet points if appropriate. Do not reference internal technical paths.`;

    const contents: any[] = [];
    
    if (Array.isArray(history)) {
      history.forEach((chat: any) => {
        contents.push({
          role: chat.role === "user" ? "user" : "model",
          parts: [{ text: chat.text }]
        });
      });
    }

    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7
      }
    });

    return res.json({ response: response.text, source: "gemini" });

  } catch (err: any) {
    console.error("Gemini assistant error:", err);
    return res.status(500).json({ error: "Failed to generate AI response", details: err.message });
  }
});

// Gemini analysis proxy route
app.post("/api/gemini/analyze", async (req, res) => {
  const { narrative } = req.body;
  if (!narrative) {
    return res.status(400).json({ error: "Narrative is required" });
  }

  try {
    if (!ai) {
      return res.json({ analysis: mockAnalyze(narrative), source: "mock-fallback" });
    }

    const prompt = `Analyze this civic issue description submitted by a citizen and output a JSON object categorizing it.
Issue Description: "${narrative}"

Please decide:
1. classification: A 2-4 word specific category (e.g., "Water Supply", "Electricity & Power", "Sanitation & Waste Management", "Roads & Infrastructure", "Public Safety", "Disaster Management").
2. priority: One of "LOW", "MEDIUM", "HIGH", "CRITICAL".
3. department: The public department responsible (e.g., "Water Supply Board", "Power Grid Authority", "Waste Management Division", "Department of Public Works", "Emergency Response Team").
4. reasoning: A 1-2 sentence professional, clear justification for these decisions based on the citizen's narrative.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            classification: { type: Type.STRING },
            priority: { type: Type.STRING },
            department: { type: Type.STRING },
            reasoning: { type: Type.STRING }
          },
          required: ["classification", "priority", "department", "reasoning"]
        }
      }
    });

    const analysisText = response.text;
    if (analysisText) {
      const parsed = JSON.parse(analysisText);
      return res.json({ analysis: parsed, source: "gemini" });
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (err: any) {
    console.error("Gemini analysis proxy error:", err);
    return res.json({ analysis: mockAnalyze(narrative), source: "error-fallback" });
  }
});

// Start server and handle Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
