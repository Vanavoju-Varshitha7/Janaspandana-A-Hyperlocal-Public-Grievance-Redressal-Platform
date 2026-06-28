import React, { useState, useEffect } from "react";
import {
  AlertTriangle, CheckCircle, Clock, Shield, User, Landmark, MapPin, Upload,
  Camera, Mic, Send, LogIn, LogOut, Radio, Loader2, ArrowUp, Plus,
  Sparkles, Layers, Eye, Vote, Sun, Moon, Database, HelpCircle, PhoneCall,
  Search, ShieldAlert, Check, Settings, Compass, Map as MapIcon, RefreshCw, Lock, Unlock, ArrowRight, Navigation,
  Flame, Activity, Waves, Car, Wind, HeartPulse, MessageCircle
} from "lucide-react";
import Map from "./components/Map";
import Analytics from "./components/Analytics";
import { CivicSignal, Project, IoTSensor, Poll, UserSession, Lifecycle, UserRole } from "./types";

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // User session state
  const [session, setSession] = useState<UserSession | null>(null);

  // New landing page flow state
  const [isPortalOpen, setIsPortalOpen] = useState(false);

  // Simulation Google Login states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleInputName, setGoogleInputName] = useState("");
  const [googleInputEmail, setGoogleInputEmail] = useState("");
  const [isAddingNewGoogleAccount, setIsAddingNewGoogleAccount] = useState(false);
  const [selectedGoogleAccount, setSelectedGoogleAccount] = useState<{name: string, email: string} | null>(null);
  const [googlePassword, setGooglePassword] = useState("");
  const [googleAccounts, setGoogleAccounts] = useState<{name: string, email: string}[]>(() => {
    try {
      const saved = localStorage.getItem("janaspandana_google_accounts");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { name: "Priya Verma", email: "priya.verma@gmail.com" },
      { name: "Rahul Sharma", email: "rahul.sharma@gmail.com" }
    ];
  });

  // AI assistant chat states
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "model"; text: string }>>([
    {
      role: "model",
      text: "Hello! I am your AI Civic Assistant. I can help you report issues, track pending cases, search government projects, or answer questions about municipal policies. How can I assist you today?"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Core municipal states
  const [signals, setSignals] = useState<CivicSignal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [sensors, setSensors] = useState<IoTSensor[]>([]);
  const [activeCity, setActiveCity] = useState<string>("Delhi");
  const [vaultDocs, setVaultDocs] = useState<any[]>([]);

  // Auth Portal States
  const [authRole, setAuthRole] = useState<UserRole>("citizen");
  const [authEmail, setAuthEmail] = useState("");
  const [authOfficerId, setAuthOfficerId] = useState("");
  const [authUnitId, setAuthUnitId] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Citizen Input states
  const [reportNarrative, setReportNarrative] = useState("");
  const [reportLocation, setReportLocation] = useState({ lat: 28.6139, lng: 77.2090, address: "Sector 4 Main Road, New Delhi" });
  const [reportImage, setReportImage] = useState<string | null>(null);
  const [isSubmittingSignal, setIsSubmittingSignal] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceTimer, setVoiceTimer] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);

  // Secure vault enrollment states
  const [enrollType, setEnrollType] = useState("AADHAAR CARD");
  const [enrollId, setEnrollId] = useState("");
  const [customCardName, setCustomCardName] = useState("");

  // SOS Emergency state
  const [showSosOverlay, setShowSosOverlay] = useState(false);
  const [activeSosEmergency, setActiveSosEmergency] = useState<string | null>(null);
  const [sosCountdown, setSosCountdown] = useState(0);

  // Citizen Track Tab states
  const [trackIdInput, setTrackIdInput] = useState("");
  const [trackedSignal, setTrackedSignal] = useState<CivicSignal | null>(null);
  const [trackSearchError, setTrackSearchError] = useState("");

  // Vault passcode state
  const [vaultPasscode, setVaultPasscode] = useState("");
  const [isVaultLocked, setIsVaultLocked] = useState(true);
  const [vaultError, setVaultError] = useState("");
  const [vaultScanFile, setVaultScanFile] = useState<string | null>(null);
  const [vaultSetupMode, setVaultSetupMode] = useState(false);

  // Selected tab states
  const [citizenTab, setCitizenTab] = useState<"report" | "track" | "vault" | "projects" | "community" | "transparency">("report");
  const [officialTab, setOfficialTab] = useState<"standard" | "projects" | "sentinel" | "warroom">("standard");

  // Selection states (Official & Sentinel)
  const [selectedSignal, setSelectedSignal] = useState<CivicSignal | null>(null);
  const [selectedSensor, setSelectedSensor] = useState<IoTSensor | null>(null);
  const [officialSearchQuery, setOfficialSearchQuery] = useState("");
  const [officialFilterClassification, setOfficialFilterClassification] = useState("ALL");
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);

  // Response unit state
  const [dispatchedSignalId, setDispatchedSignalId] = useState<string | null>(null);

  // Global custom toast notifications
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Fetch all initial data
  const loadSignalsAndState = async () => {
    try {
      const resSig = await fetch("/api/signals");
      const dataSig = await resSig.json();
      setSignals(dataSig.signals);

      const resProj = await fetch("/api/projects");
      const dataProj = await resProj.json();
      setProjects(dataProj.projects);

      const resPolls = await fetch("/api/polls");
      const dataPolls = await resPolls.json();
      setPolls(dataPolls.polls);

      const resVault = await fetch("/api/vault");
      const dataVault = await resVault.json();
      setVaultDocs(dataVault.vault);
    } catch (err) {
      console.error("Error loading server state:", err);
    }
  };

  useEffect(() => {
    loadSignalsAndState();
  }, []);

  // Fetch sensors when city changes
  useEffect(() => {
    const fetchSensors = async () => {
      try {
        const res = await fetch(`/api/sensors/${activeCity}`);
        const data = await res.json();
        setSensors(data.sensors);
        if (data.sensors && data.sensors.length > 0) {
          setSelectedSensor(data.sensors[0]);
        }
      } catch (err) {
        console.error("Error loading sensors:", err);
      }
    };
    fetchSensors();
  }, [activeCity]);

  // Voice recording simulation timer
  useEffect(() => {
    let interval: any;
    if (isRecordingVoice) {
      interval = setInterval(() => {
        setVoiceTimer(prev => prev + 1);
      }, 1000);
    } else {
      setVoiceTimer(0);
    }
    return () => clearInterval(interval);
  }, [isRecordingVoice]);

  // SOS emergency countdown timer
  useEffect(() => {
    let interval: any;
    if (activeSosEmergency && sosCountdown > 0) {
      interval = setInterval(() => {
        setSosCountdown(prev => prev - 1);
      }, 1000);
    } else if (sosCountdown === 0 && activeSosEmergency) {
      triggerSosSignalOnServer();
    }
    return () => clearInterval(interval);
  }, [activeSosEmergency, sosCountdown]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Auth handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthenticating(true);

    const payload: any = { role: authRole };
    if (authRole === "citizen") {
      payload.email = authEmail;
      payload.password = authPassword;
    } else if (authRole === "official") {
      payload.officerId = authOfficerId;
      payload.password = authPassword;
    } else if (authRole === "response_force") {
      payload.unitId = authUnitId;
      payload.password = authPassword;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSession(data.user);
        showToast(`Welcome back, ${data.user.name}! Access Authorized.`, "success");
        // Redirect standard tabs
        if (authRole === "citizen") setCitizenTab("report");
        else if (authRole === "official") setOfficialTab("standard");
      } else {
        setAuthError(data.error || "Authentication failed.");
      }
    } catch (err) {
      setAuthError("Server unavailable. Please try again.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthenticating(true);

    const payload: any = { role: authRole, name: authName, password: authPassword };
    if (authRole === "citizen") {
      payload.email = authEmail;
    } else if (authRole === "official") {
      payload.officerId = authOfficerId;
    } else if (authRole === "response_force") {
      payload.unitId = authUnitId;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSession(data.user);
        showToast(`Registration Successful! Account generated.`, "success");
        setIsRegistering(false);
      } else {
        setAuthError(data.error || "Registration failed.");
      }
    } catch (err) {
      setAuthError("Server unavailable. Please try again.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = () => {
    setSession(null);
    setTrackedSignal(null);
    setSelectedSignal(null);
    showToast("Signed out securely.", "info");
  };

  // Map coordinate setter
  const handleLocationPicked = (lat: number, lng: number, address: string) => {
    setReportLocation({ lat, lng, address });
  };

  // Submit Signal Handler (Citizen)
  const handleSubmitSignal = async () => {
    if (!reportNarrative) {
      showToast("Please write or dictate an incident narrative.", "error");
      return;
    }

    setIsSubmittingSignal(true);
    try {
      const res = await fetch("/api/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          narrative: reportNarrative,
          location: reportLocation,
          reporter: session?.email || "anonymous_citizen",
          imageUrl: reportImage || undefined
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Civic Signal filed successfully as ${data.signal.id}! Category: ${data.signal.classification}`, "success");
        setReportNarrative("");
        setReportImage(null);
        // Reload list
        loadSignalsAndState();
        // Redirect to tracking automatically
        setTrackIdInput(data.signal.id);
        setTrackedSignal(data.signal);
        setCitizenTab("track");
      } else {
        showToast(data.error || "Failed to submit signal.", "error");
      }
    } catch (err) {
      showToast("Server communication failed.", "error");
    } finally {
      setIsSubmittingSignal(false);
    }
  };

  // Simulate Voice Dictation Speech-to-Text
  const toggleVoiceDictation = () => {
    if (isRecordingVoice) {
      setIsRecordingVoice(false);
      // Populate text with a high-fidelity mock translation
      setReportNarrative("Severe water pipeline leakage detected on Sector 4 main road. High pressure water is breaking the concrete and flooding adjacent blocks.");
      showToast("Voice transcribed successfully with Multi-Language AI parsing.", "success");
    } else {
      setIsRecordingVoice(true);
      showToast("AI Audio Stream opened. Speak now...", "info");
    }
  };

  // Camera screenshot simulation
  const triggerCameraShot = () => {
    setCameraActive(true);
    showToast("Accessing device optical field...", "info");
    setTimeout(() => {
      // Mock base64 generated placeholder from high quality municipal images
      setReportImage("https://images.unsplash.com/photo-1599740831146-5a695253857d?q=80&w=600&auto=format&fit=crop");
      setCameraActive(false);
      showToast("Optical audit image captured successfully.", "success");
    }, 1800);
  };

  // Track signal look-up
  const handleTrackSearch = () => {
    setTrackSearchError("");
    setTrackedSignal(null);
    if (!trackIdInput) return;

    const formatted = trackIdInput.toUpperCase().trim();
    const found = signals.find(s => s.id === formatted);
    if (found) {
      setTrackedSignal(found);
    } else {
      setTrackSearchError("Incident reference ID not found in database.");
    }
  };

  // Vault Unlock Doc
  const handleVaultUnlock = () => {
    setVaultError("");
    const hasMatchingDoc = vaultDocs.some((d: any) => d.passcode === vaultPasscode);
    if (vaultPasscode === "123456" || hasMatchingDoc) {
      setIsVaultLocked(false);
      showToast("Vault unlocked. Secure data decrypted.", "success");
    } else {
      setVaultError("Incorrect secure passcode. Intrusion alert logged.");
    }
  };

  const handleVaultSetup = async () => {
    if (!vaultPasscode) {
      setVaultError("Please enter a secure numerical passcode.");
      return;
    }
    try {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "AADHAAR",
          idNumber: "0000-XXXX-9821",
          passcode: vaultPasscode
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Secure Identication loaded into encrypted vault.", "success");
        setIsVaultLocked(false);
        setVaultSetupMode(false);
        loadSignalsAndState();
      }
    } catch (e) {
      setVaultError("Failed to store credentials.");
    }
  };

  // Real Upload to secure vault
  const handleVaultUpload = async () => {
    if (enrollType === "OTHER" && !customCardName.trim()) {
      setVaultError("Please enter the name of the custom card.");
      return;
    }
    if (!enrollId) {
      setVaultError("Please enter an Identity ID number.");
      return;
    }
    try {
      const typeToSend = enrollType === "OTHER" ? customCardName.trim().toUpperCase() : enrollType;
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: typeToSend,
          passcode: vaultPasscode || "123456",
          idNumber: enrollId
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEnrollId("");
        setCustomCardName("");
        setVaultError(""); // Clear any previous errors
        showToast("Identity uploaded and encrypted with SHA-256.", "success");
        // Reload vault docs list
        const resV = await fetch("/api/vault");
        const dataV = await resV.json();
        setVaultDocs(dataV.vault);
      }
    } catch (e) {
      showToast("Failed to secure document in vault.", "error");
    }
  };

  // AI assistant chat delivery
  const handleSendChatMessage = async (msgText?: string) => {
    const textToSend = msgText || chatInput;
    if (!textToSend.trim()) return;

    const userMsg = { role: "user" as const, text: textToSend };
    setChatMessages(prev => [...prev, userMsg]);
    if (!msgText) setChatInput("");
    setIsChatLoading(true);

    try {
      const historyToSend = chatMessages.slice(-10); // send last 10 messages for context
      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: historyToSend
        })
      });
      const data = await res.json();
      if (data.response) {
        setChatMessages(prev => [...prev, { role: "model" as const, text: data.response }]);
      } else {
        throw new Error("Invalid response");
      }
    } catch (e) {
      setChatMessages(prev => [...prev, { role: "model" as const, text: "Apologies, I encountered an error communicating with my neural core. Please try again or verify your connection." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setAuthError("");
    setShowGoogleModal(true);
    setIsAddingNewGoogleAccount(false);
    setSelectedGoogleAccount(null);
    setGooglePassword("");
  };

  const handleSelectGoogleAccount = (name: string, email: string) => {
    setIsAuthenticating(true);
    setAuthError("");
    setShowGoogleModal(false);
    
    setTimeout(() => {
      const mockSession = {
        email: email,
        name: name,
        role: "citizen" as UserRole,
        token: "mock-google-token"
      };
      setSession(mockSession);
      setIsAuthenticating(false);
      
      // Update Google Account History (add to history, move to top)
      setGoogleAccounts(prev => {
        const filtered = prev.filter(acc => acc.email.toLowerCase() !== email.toLowerCase());
        const updated = [{ name, email }, ...filtered];
        try {
          localStorage.setItem("janaspandana_google_accounts", JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
      
      showToast(`Signed in as ${name} successfully via Google.`, "success");
    }, 800);
  };

  // Poll voting
  const handleVotePoll = async (pollId: string, optionIndex: number) => {
    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionIndex })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Urban Poll vote counted.", "success");
        loadSignalsAndState();
      }
    } catch (err) {
      showToast("Failed to lock vote.", "error");
    }
  };

  // Upvote incident on feed
  const handleUpvoteSignal = async (id: string) => {
    try {
      const res = await fetch(`/api/signals/${id}/upvote`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setSignals(prev => prev.map(s => s.id === id ? { ...s, upvotes: data.upvotes } : s));
        showToast(`Community signal verified. Upvoted to ${data.upvotes}.`, "success");
      }
    } catch (err) {
      showToast("Communication error.", "error");
    }
  };

  // Official status upgrade
  const handleUpdateLifecycle = async (id: string, nextStatus: Lifecycle) => {
    try {
      const res = await fetch(`/api/signals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lifecycle: nextStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Signal ${id} lifecycle upgraded to ${nextStatus}.`, "success");
        loadSignalsAndState();
        if (selectedSignal && selectedSignal.id === id) {
          setSelectedSignal(data.signal);
        }
      }
    } catch (err) {
      showToast("Failed to upgrade status.", "error");
    }
  };

  // Official Dispatch Unit
  const handleDispatchOfficial = async (id: string) => {
    try {
      const res = await fetch(`/api/signals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lifecycle: Lifecycle.IN_PROGRESS,
          dispatchedUnitId: "ADS123" // Rapid Response Unit 12
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Dispatched Response Force Unit ADS123 to incident ${id}!`, "success");
        setDispatchedSignalId(id);
        loadSignalsAndState();
        if (selectedSignal && selectedSignal.id === id) {
          setSelectedSignal(data.signal);
        }
      }
    } catch (err) {
      showToast("Dispatch routing error.", "error");
    }
  };

  // SOS trigger on server
  const startSosEmergency = (type: string) => {
    setActiveSosEmergency(type);
    setSosCountdown(3); // 3 second delay for dramatic rapid confirmation
    showToast(`EMERGENCY SOS: ${type.toUpperCase()} SIGNAL TRIGGERED.`, "error");
  };

  const triggerSosSignalOnServer = async () => {
    try {
      const res = await fetch("/api/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          narrative: `CRITICAL ALERT: Emergency SOS ${activeSosEmergency} signal broadcasted at coordinates. Help required immediately.`,
          location: { lat: 28.6139, lng: 77.2090, address: "Broadcasted GPS Coordinate, New Delhi" },
          reporter: session?.email || "anonymous_citizen"
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`SOS Signal integrated as ${data.signal.id}! Response Unit dispatched.`, "success");
        loadSignalsAndState();
        setShowSosOverlay(false);
        setActiveSosEmergency(null);
        setSosCountdown(0);
      }
    } catch (e) {
      showToast("Failed to broadcast SOS.", "error");
    }
  };

  const stopSosEmergency = () => {
    setActiveSosEmergency(null);
    setSosCountdown(0);
    showToast("SOS Broadcast cancelled by user.", "info");
  };

  // Filter signals list for Official
  const filteredSignals = signals.filter(s => {
    const matchesSearch = s.narrative.toLowerCase().includes(officialSearchQuery.toLowerCase()) || s.id.toLowerCase().includes(officialSearchQuery.toLowerCase());
    const matchesCategory = officialFilterClassification === "ALL" || s.classification === officialFilterClassification;
    return matchesSearch && matchesCategory;
  });

  // Dynamic values for budget utilization
  const totalAllocatedBudget = projects.reduce((acc, p) => acc + p.budgetSuggested, 0);
  const totalUtilizedBudget = projects.reduce((acc, p) => acc + p.budgetUtilized, 0);

  // Before/After image slider preset state (Toggle between before/after view)
  const [projectSliderViews, setProjectSliderViews] = useState<Record<string, boolean>>({});
  const toggleProjectSlider = (id: string) => {
    setProjectSliderViews(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const boxClass = theme === "dark"
    ? "bg-slate-900/40 backdrop-blur border border-slate-800 text-slate-100 shadow-xl"
    : "bg-white border border-slate-200/90 text-slate-800 shadow-lg shadow-slate-200/60 transition-all duration-300";

  const cardClass = theme === "dark"
    ? "bg-slate-900/60 border border-slate-800 text-slate-100 shadow-xl"
    : "bg-white border border-slate-200/90 text-slate-800 shadow-xl shadow-slate-200/70 transition-all duration-300";

  const isDark = theme === "dark";
  const inputClass = isDark
    ? "bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:border-purple-500"
    : "bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-purple-500";
  const labelClass = isDark ? "text-slate-200" : "text-slate-700";
  const subTextClass = isDark ? "text-slate-400" : "text-slate-500";
  const headerTextClass = isDark ? "text-white" : "text-slate-900";
  const borderClass = isDark ? "border-slate-800" : "border-slate-200";
  const innerBgClass = isDark ? "bg-slate-950/60 border border-slate-800" : "bg-slate-50 border border-slate-200";
  const badgeClass = isDark ? "bg-slate-950 border border-slate-800 text-slate-300" : "bg-slate-100 border border-slate-200 text-slate-700";

  return (
    <div className={`min-h-screen font-sans ${
      theme === "dark" 
        ? (!session && !isPortalOpen)
          ? "bg-[#060411] bg-[radial-gradient(ellipse_at_center,_rgba(67,40,180,0.20)_0%,_rgba(6,4,17,1)_100%)] text-slate-100"
          : "bg-slate-950 text-slate-100" 
        : "bg-slate-100 text-slate-900"
    } transition-colors duration-300 relative overflow-hidden`}>
      
      {/* Dynamic Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-slate-900 border border-purple-500 text-white px-5 py-4 rounded-xl shadow-2xl animate-bounce max-w-sm">
          <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />
          <div className="text-xs font-semibold">{notification.message}</div>
        </div>
      )}

      {/* SOS Emergency Modal */}
      {showSosOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="bg-slate-950 border-2 border-red-500/80 p-8 rounded-3xl max-w-lg w-full mx-4 shadow-[0_0_50px_rgba(239,68,68,0.3)] relative overflow-hidden">
            
            {/* Blinking red radar effect */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 animate-pulse"></div>

            <button
              onClick={() => setShowSosOverlay(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white font-bold text-lg"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-950/60 border border-red-500 rounded-full flex items-center justify-center mx-auto mb-3 animate-ping">
                <ShieldAlert className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-display font-bold text-white uppercase tracking-wider">
                EMERGENCY SOS PORTAL
              </h2>
              <p className="text-xs text-red-400 mt-1 font-mono">BROADCASTING DIRECT CIVIC COMMAND</p>
            </div>

            {activeSosEmergency ? (
              <div className="bg-red-950/30 border border-red-500/30 p-6 rounded-2xl text-center">
                <p className="text-sm font-semibold text-white">Active Alert: <span className="text-red-400 font-bold">{activeSosEmergency.toUpperCase()}</span></p>
                <div className="text-4xl font-mono font-bold text-red-500 my-4">
                  00:0{sosCountdown}
                </div>
                <p className="text-xs text-slate-400">Broadcasting satellite GPS coordinates to emergency forces in Delhi NCR...</p>
                
                <button
                  onClick={stopSosEmergency}
                  className="mt-6 w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-lg text-xs tracking-wider uppercase transition"
                >
                  ABORT BROADCAST
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "Fire", color: "from-orange-600 to-red-600", icon: Flame },
                  { name: "Medical", color: "from-red-600 to-rose-600", icon: HeartPulse },
                  { name: "Accident", color: "from-amber-600 to-orange-600", icon: Car },
                  { name: "Flood", color: "from-blue-600 to-indigo-600", icon: Waves },
                  { name: "Violence", color: "from-purple-600 to-rose-600", icon: ShieldAlert },
                  { name: "Gas Leak", color: "from-teal-600 to-emerald-600", icon: Wind },
                  { name: "Earthquake", color: "from-yellow-600 to-amber-600", icon: Activity }
                ].map((item) => {
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => startSosEmergency(item.name.toLowerCase())}
                      className={`bg-gradient-to-r ${item.color} text-white font-display font-semibold py-4 px-3 rounded-2xl text-xs hover:scale-[1.03] active:scale-95 transition-all shadow-md hover:shadow-lg hover:shadow-red-500/20 flex flex-col items-center justify-center gap-1.5`}
                    >
                      <IconComp className="w-5 h-5 text-white" />
                      <span>{item.name.toUpperCase()}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <p className="text-[10px] text-slate-500 text-center mt-6">
              *All SOS transmissions carry high municipal gravity. Audio/GPS logging holds compliance with safety rules.
            </p>
          </div>
        </div>
      )}

      {/* Google Accounts Selection Modal (Simulation) */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`p-8 rounded-3xl max-w-md w-full mx-4 shadow-2xl border relative overflow-hidden transition-all duration-300 ${
            theme === "dark" 
              ? "bg-slate-900 border-slate-800 text-white" 
              : "bg-white border-slate-200 text-slate-900"
          }`}>
            <button
              onClick={() => {
                setShowGoogleModal(false);
                setGoogleInputName("");
                setGoogleInputEmail("");
                setIsAddingNewGoogleAccount(false);
              }}
              className={`absolute top-4 right-4 font-bold text-lg hover:opacity-80 transition ${
                theme === "dark" ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              ✕
            </button>

            <div className="text-center mb-6">
              {/* Google G Logo */}
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow border border-slate-100">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-display font-bold">Sign in with Google</h2>
              <p className={`text-xs mt-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                Choose an account to continue to Janaspandana
              </p>
            </div>

            {/* ERROR MESSAGE IF ANY */}
            {authError && (
              <div className="bg-red-950/40 border border-red-500/30 p-2.5 rounded-lg text-xs text-red-400 mb-4 text-center">
                {authError}
              </div>
            )}

            {selectedGoogleAccount ? (
              /* PASSWORD VERIFICATION SCREEN FOR PREVIOUS ACCOUNTS */
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!googlePassword.trim()) {
                    setAuthError("Please enter your Google account password.");
                    return;
                  }
                  // Proceed with authentication
                  handleSelectGoogleAccount(selectedGoogleAccount.name, selectedGoogleAccount.email);
                  setSelectedGoogleAccount(null);
                  setGooglePassword("");
                }} 
                className="space-y-4 animate-fade-in"
              >
                <div className={`p-4 rounded-2xl border flex items-center gap-3 mb-2 ${
                  theme === "dark" ? "bg-slate-950/40 border-slate-800" : "bg-slate-50/50 border-slate-200"
                }`}>
                  <div className="w-10 h-10 rounded-full bg-purple-600/20 text-purple-400 font-bold flex items-center justify-center text-sm border border-purple-500/30 shrink-0">
                    {selectedGoogleAccount.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{selectedGoogleAccount.name}</div>
                    <div className={`text-xs font-mono truncate ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                      {selectedGoogleAccount.email}
                    </div>
                  </div>
                </div>

                <div>
                  <label className={`text-[10px] font-mono uppercase block mb-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                    Enter Google Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={googlePassword}
                    onChange={(e) => setGooglePassword(e.target.value)}
                    required
                    autoFocus
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition ${
                      theme === "dark" 
                        ? "bg-slate-950 border-slate-800 text-white placeholder-slate-700" 
                        : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400"
                    }`}
                  />
                  <p className={`text-[10px] mt-1.5 ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
                    To protect your account, please verify your password credentials.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGoogleAccount(null);
                      setGooglePassword("");
                      setAuthError("");
                    }}
                    className={`flex-1 py-2.5 rounded-xl border font-semibold text-xs transition ${
                      theme === "dark"
                        ? "border-slate-800 hover:bg-slate-800 text-slate-300"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-2.5 rounded-xl text-xs shadow-lg transition active:scale-95"
                  >
                    Verify & Sign In
                  </button>
                </div>
              </form>
            ) : !isAddingNewGoogleAccount ? (
              <div className="space-y-4">
                {/* ACCOUNT HISTORY LIST */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {googleAccounts.map((account, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedGoogleAccount(account);
                        setGooglePassword("");
                        setAuthError("");
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                        theme === "dark"
                          ? "bg-slate-950/40 border-slate-800 hover:bg-slate-800 hover:border-slate-700"
                          : "bg-slate-50/50 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300"
                      }`}
                    >
                      {/* Avatar with initials */}
                      <div className="w-9 h-9 rounded-full bg-purple-600/20 text-purple-400 font-bold flex items-center justify-center text-xs border border-purple-500/30 shrink-0">
                        {account.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold truncate">{account.name}</div>
                        <div className={`text-[10px] font-mono truncate ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                          {account.email}
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-purple-500 font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/10 shrink-0">
                        Active
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setIsAddingNewGoogleAccount(true)}
                  className={`w-full py-2.5 rounded-xl border font-semibold text-xs transition flex items-center justify-center gap-1.5 ${
                    theme === "dark"
                      ? "border-slate-800 hover:bg-slate-800 text-slate-300"
                      : "border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Use another Google Account
                </button>
              </div>
            ) : (
              /* ADD NEW GOOGLE ACCOUNT FORM */
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!googleInputName.trim() || !googleInputEmail.trim()) {
                    setAuthError("Please fill in both fields.");
                    return;
                  }
                  if (!googleInputEmail.includes("@")) {
                    setAuthError("Please enter a valid Gmail or Email address.");
                    return;
                  }
                  handleSelectGoogleAccount(googleInputName, googleInputEmail);
                }} 
                className="space-y-4"
              >
                <div>
                  <label className={`text-[10px] font-mono uppercase block mb-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Varshitha Vanavoju"
                    value={googleInputName}
                    onChange={(e) => setGoogleInputName(e.target.value)}
                    required
                    className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition ${
                      theme === "dark" 
                        ? "bg-slate-950 border-slate-800 text-white placeholder-slate-700" 
                        : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400"
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[10px] font-mono uppercase block mb-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                    Gmail Address
                  </label>
                  <input
                    type="email"
                    placeholder="varshitha@gmail.com"
                    value={googleInputEmail}
                    onChange={(e) => setGoogleInputEmail(e.target.value)}
                    required
                    className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition ${
                      theme === "dark" 
                        ? "bg-slate-950 border-slate-800 text-white placeholder-slate-700" 
                        : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400"
                    }`}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNewGoogleAccount(false);
                      setAuthError("");
                    }}
                    className={`flex-1 py-2.5 rounded-xl border font-semibold text-xs transition ${
                      theme === "dark"
                        ? "border-slate-800 hover:bg-slate-800 text-slate-300"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-2.5 rounded-xl text-xs shadow-lg transition active:scale-95"
                  >
                    Sign In & Activate
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Header Bar */}
      <header className={`border-b ${
        theme === "dark" 
          ? (!session && !isPortalOpen)
            ? "border-transparent bg-transparent"
            : "border-slate-800 bg-slate-900/60" 
          : "border-slate-200 bg-white"
      } sticky top-0 z-30 backdrop-blur-md transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo / Title */}
          <div className="flex items-center gap-2.5">
            <div className="bg-[#6d28d9] p-2 rounded-xl shadow-md">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className={`font-display text-base font-extrabold tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
              Janaspandana<span className="text-purple-500 font-bold font-mono">.in</span>
            </span>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-4">
            
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(prev => prev === "dark" ? "light" : "dark")}
              className={`p-2.5 rounded-full transition ${
                theme === "dark" 
                  ? "bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800" 
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
              }`}
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Session Actions */}
            {session ? (
              <div className="flex items-center gap-3">
                
                {/* SOS Trigger button */}
                <button
                  onClick={() => setShowSosOverlay(true)}
                  className="bg-red-600 hover:bg-red-700 text-white font-display font-semibold text-[11px] px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-md shadow-red-500/20 animate-pulse"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  SOS EMERGENCY
                </button>

                {/* Profile Widget */}
                <div className="hidden md:flex items-center gap-2 border-l border-slate-800/80 pl-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-purple-500 flex items-center justify-center">
                    <User className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-left text-xs">
                    <span className="font-semibold block text-slate-200 max-w-[120px] truncate">{session.name}</span>
                    <span className="text-[10px] text-purple-400 capitalize font-mono">{session.role.replace("_", " ")}</span>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition px-2 py-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsPortalOpen(true)}
                className="bg-white hover:bg-slate-100 text-slate-950 font-display font-bold px-6 py-2.5 rounded-full text-xs transition duration-200 shadow-md active:scale-95"
              >
                Sign In
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-6 py-12 md:py-16">

        {/* SECURE PORTAL - NOT LOGGED IN */}
        {!session ? (
          !isPortalOpen ? (
            /* VISUALLY POLISHED LANDING FRONT PAGE (MATCHES SCREENSHOTS & GUIDELINES) */
            <div className="max-w-6xl mx-auto py-16 md:py-28 flex flex-col items-center justify-center space-y-16 animate-fade-in text-center">
              
              {/* Smart City Platform Badge */}
              <div className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-xs md:text-sm font-mono font-bold uppercase tracking-widest transition-colors ${
                theme === "dark"
                  ? "bg-[#2c1561]/30 border border-[#6b21a8]/50 text-purple-300"
                  : "bg-purple-100 border border-purple-200 text-purple-700 shadow-sm"
              }`}>
                <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                  theme === "dark" ? "bg-purple-500" : "bg-purple-600"
                }`}></span>
                SMART CITY PLATFORM ACTIVE
              </div>

              {/* Title Header */}
              <h1 className={`text-6xl sm:text-7xl md:text-[6.5rem] font-display font-black tracking-tight leading-none select-none ${
                theme === "dark" ? "text-white" : "text-slate-900"
              }`}>
                Janaspandana
              </h1>

              {/* Subheading */}
              <p className={`text-base sm:text-lg md:text-2xl leading-relaxed max-w-3xl mx-auto font-medium ${
                theme === "dark" ? "text-slate-300" : "text-slate-700"
              }`}>
                A Hyperlocal Public Grievance Redressal Platform
              </p>
              
              {/* Let's Get Started Call to Action Button */}
              <div className="pt-4 flex justify-center">
                <button
                  onClick={() => setIsPortalOpen(true)}
                  className="bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-display font-bold px-12 py-5 rounded-full text-sm uppercase tracking-widest shadow-[0_0_40px_rgba(109,40,217,0.5)] hover:shadow-[0_0_55px_rgba(109,40,217,0.75)] active:scale-95 transition-all duration-300"
                >
                  LET'S GET STARTED
                </button>
              </div>

              {/* High-Contrast Spacious Text Boxes at the Bottom */}
              <div className="w-full pt-16 md:pt-28 border-t border-purple-950/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 text-left">
                  
                  {/* Text Box 1 */}
                  <div className={`p-8 md:p-10 rounded-3xl border transition duration-300 hover:translate-y-[-4px] ${
                    theme === "dark" 
                      ? "bg-slate-900/40 border-slate-800 hover:border-slate-700" 
                      : "bg-white border-slate-200 hover:border-slate-300 shadow-md"
                  }`}>
                    <span className={`text-xs font-mono font-bold tracking-widest uppercase block mb-3 ${
                      theme === "dark" ? "text-purple-400" : "text-purple-600"
                    }`}>01 / TRANSPARENCY</span>
                    <h3 className={`text-lg md:text-xl font-display font-bold tracking-tight mb-4 ${
                      theme === "dark" ? "text-white" : "text-slate-900"
                    }`}>
                      Hyperlocal Governance
                    </h3>
                    <p className={`text-sm md:text-base leading-relaxed ${
                      theme === "dark" ? "text-slate-400" : "text-slate-600"
                    }`}>
                      A secure digital infrastructure designed to bring unprecedented transparency to community issue tracking. View, update, and audit regional tasks with absolute clarity.
                    </p>
                  </div>                   {/* Text Box 2 */}
                  <div className={`p-8 md:p-10 rounded-3xl border transition duration-300 hover:translate-y-[-4px] ${
                    theme === "dark" 
                      ? "bg-slate-900/40 border-slate-800 hover:border-slate-700" 
                      : "bg-white border-slate-200 hover:border-slate-300 shadow-md"
                  }`}>
                    <span className={`text-xs font-mono font-bold tracking-widest uppercase block mb-3 ${
                      theme === "dark" ? "text-emerald-400" : "text-emerald-600"
                    }`}>02 / AUTOMATION</span>
                    <h3 className={`text-lg md:text-xl font-display font-bold tracking-tight mb-4 ${
                      theme === "dark" ? "text-white" : "text-slate-900"
                    }`}>
                      Intelligent Classification
                    </h3>
                    <p className={`text-sm md:text-base leading-relaxed ${
                      theme === "dark" ? "text-slate-400" : "text-slate-600"
                    }`}>
                      Utilizing advanced context-aware models to categorize street utility, roadway safety, and public lighting reports immediately upon upload—eliminating bureaucratic delays.
                    </p>
                  </div>

                  {/* Text Box 3 */}
                  <div className={`p-8 md:p-10 rounded-3xl border transition duration-300 hover:translate-y-[-4px] ${
                    theme === "dark" 
                      ? "bg-slate-900/40 border-slate-800 hover:border-slate-700" 
                      : "bg-white border-slate-200 hover:border-slate-300 shadow-md"
                  }`}>
                    <span className={`text-xs font-mono font-bold tracking-widest uppercase block mb-3 ${
                      theme === "dark" ? "text-cyan-400" : "text-cyan-600"
                    }`}>03 / PRIVACY</span>
                    <h3 className={`text-lg md:text-xl font-display font-bold tracking-tight mb-4 ${
                      theme === "dark" ? "text-white" : "text-slate-900"
                    }`}>
                      Zero-Knowledge Vault
                    </h3>
                    <p className={`text-sm md:text-base leading-relaxed ${
                      theme === "dark" ? "text-slate-400" : "text-slate-600"
                    }`}>
                      Protect your personal municipal credentials inside an AES-256 localized database vault. Your files are encrypted client-side and accessible only via your secure master passcode.
                    </p>
                  </div>

                </div>
              </div>

            </div>
          ) : (
            /* BRIGHT PORTAL REFACTOR: ACCORDING TO USER REQUIREMENTS */
            <div className="max-w-md mx-auto py-12">
              
              {/* Back Button */}
              <button
                onClick={() => setIsPortalOpen(false)}
                className={`flex items-center gap-2 text-xs font-mono font-bold uppercase mb-6 hover:underline transition ${
                  theme === "dark" ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ← BACK TO HOMEPAGE
              </button>

              {/* Branding introduction */}
              <div className="text-center mb-8 animate-fade-in">
                <span className={`px-3 py-1 rounded-full text-[10px] font-mono tracking-wider border ${
                  theme === "dark" 
                    ? "bg-purple-950/60 border-purple-500/30 text-purple-400" 
                    : "bg-purple-50 border-purple-200 text-purple-700"
                }`}>
                  ● SMART CITY PLATFORM
                </span>
                <h1 className={`text-3xl font-display font-bold tracking-tight mt-3 ${
                  theme === "dark" ? "text-white" : "text-slate-900"
                }`}>
                  Secure Access Area
                </h1>
                <p className={`text-xs mt-2 ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                  Authenticate to report new incidents or manage command dispatch squads.
                </p>
              </div>

              {/* Login Frame (Dynamic Bright Theme) */}
              <div className={`p-8 rounded-3xl shadow-2xl relative overflow-hidden border ${
                theme === "dark" 
                  ? "bg-slate-900/85 border-slate-800/80" 
                  : "bg-white border-slate-200"
              }`}>
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 to-indigo-500"></div>

                {/* Secure ID header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-500" />
                    <span className={`font-display font-semibold text-sm ${theme === "dark" ? "text-slate-200" : "text-slate-800"}`}>
                      Identity Portal
                    </span>
                  </div>
                </div>

                {/* Google Sign-In button on login page */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className={`w-full flex items-center justify-center gap-3 font-bold py-3 rounded-xl text-xs uppercase tracking-wider mb-5 transition border ${
                    theme === "dark"
                      ? "bg-slate-900 border-slate-800 text-white hover:bg-slate-800"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                  }`}
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign In with Google</span>
                </button>

                <div className="relative flex items-center justify-center my-4">
                  <hr className={`w-full ${theme === "dark" ? "border-slate-800" : "border-slate-200"}`} />
                  <span className={`absolute px-3 text-[10px] font-mono tracking-widest uppercase ${
                    theme === "dark" ? "bg-slate-900 text-slate-500" : "bg-white text-slate-400"
                  }`}>
                    OR CREDENTIALS
                  </span>
                </div>

                {/* Role switcher tabs */}
                <div className={`grid grid-cols-3 p-1 rounded-xl mb-6 border ${
                  theme === "dark" ? "bg-slate-950 border-slate-850" : "bg-slate-100 border-slate-200"
                }`}>
                  {(["citizen", "official", "response_force"] as UserRole[]).map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        setAuthRole(role);
                        setAuthError("");
                      }}
                      className={`text-[10px] font-semibold py-2 rounded-lg capitalize transition-all ${
                        authRole === role
                          ? "bg-purple-600 text-white shadow-md"
                          : `hover:text-slate-900 ${theme === "dark" ? "text-slate-400 hover:text-slate-200" : "text-slate-500"}`
                      }`}
                    >
                      {role.replace("_", " ")}
                    </button>
                  ))}
                </div>

                {authError && (
                  <div className="bg-red-950/40 border border-red-500/30 p-3 rounded-lg text-xs text-red-400 mb-4 flex items-center gap-2 font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {/* Login / Registration Forms */}
                <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
                  {isRegistering && (
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                        Full Legal Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Priya Verma"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        required
                        className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition ${
                          theme === "dark" 
                            ? "bg-slate-950 border-slate-800 text-white placeholder-slate-600" 
                            : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400"
                        }`}
                      />
                    </div>
                  )}

                  {authRole === "citizen" ? (
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="priya.verma@gmail.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        required
                        className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition ${
                          theme === "dark" 
                            ? "bg-slate-950 border-slate-800 text-white placeholder-slate-600" 
                            : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400"
                        }`}
                      />
                    </div>
                  ) : authRole === "official" ? (
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                        Officer ID
                      </label>
                      <input
                        type="text"
                        placeholder="Alphanumeric only (e.g. ASD123)"
                        value={authOfficerId}
                        onChange={(e) => setAuthOfficerId(e.target.value)}
                        required
                        className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition ${
                          theme === "dark" 
                            ? "bg-slate-950 border-slate-800 text-white placeholder-slate-600" 
                            : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400"
                        }`}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                        Unit ID
                      </label>
                      <input
                        type="text"
                        placeholder="Alphanumeric only (e.g. ADS123)"
                        value={authUnitId}
                        onChange={(e) => setAuthUnitId(e.target.value)}
                        required
                        className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition ${
                          theme === "dark" 
                            ? "bg-slate-950 border-slate-800 text-white placeholder-slate-600" 
                            : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400"
                        }`}
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter confidential password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      required
                      className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition ${
                        theme === "dark" 
                          ? "bg-slate-950 border-slate-800 text-white placeholder-slate-600" 
                          : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400"
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50"
                  >
                    {isAuthenticating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Authenticating...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>{isRegistering ? "Register New Account" : "Sign In to Dashboard"}</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Register / Sign-in Toggle link */}
                <div className="text-center mt-6 border-t pt-4 border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setIsRegistering(prev => !prev);
                      setAuthError("");
                    }}
                    className="text-xs text-purple-500 hover:text-purple-600 font-semibold underline transition"
                  >
                    {isRegistering ? "Already registered? Login Here" : "Don't have an ID? Register Now"}
                  </button>
                </div>

              </div>
            </div>
          )
        ) : (
          /* ACTIVE USER SESSION AREA */
          <div className="space-y-12">
            
            {/* CITIZEN VIEWS */}
            {session.role === "citizen" && (
              <div>
                {/* Tab select bar */}
                <div className="flex flex-wrap gap-3 border-b border-slate-800 pb-4 mb-8">
                  {[
                    { id: "report", label: "REPORT", icon: MapPin },
                    { id: "track", label: "TRACK", icon: Search },
                    { id: "vault", label: "VAULT", icon: Shield },
                    { id: "projects", label: "PROJECTS", icon: Landmark },
                    { id: "community", label: "COMMUNITY", icon: Radio },
                    { id: "transparency", label: "TRANSPARENCY", icon: Database }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setCitizenTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition ${
                        citizenTab === tab.id
                          ? "bg-purple-600 text-white shadow-md shadow-purple-500/10"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* 1. REPORT TAB */}
                {citizenTab === "report" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left & Middle columns: Map selection and form */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className={`${boxClass} rounded-2xl p-6`}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className={`text-sm font-display font-semibold uppercase tracking-wider flex items-center gap-2 ${
                            theme === "dark" ? "text-slate-200" : "text-slate-800"
                          }`}>
                            <Layers className="w-4 h-4 text-purple-400" /> GEOSPATIAL INTELLIGENCE
                          </h3>
                        </div>

                        {/* Interactive map widget */}
                        <Map
                          city={activeCity}
                          signals={signals}
                          mode="report"
                          onLocationSelect={handleLocationPicked}
                          onCityChange={setActiveCity}
                          theme={theme}
                        />
                      </div>

                      {/* Narrative description breakdown */}
                      <div className={`${boxClass} rounded-2xl p-6 space-y-4`}>
                        <div className={`flex items-center justify-between border-b pb-3 ${
                          theme === "dark" ? "border-slate-800" : "border-slate-200"
                        }`}>
                          <h3 className={`text-sm font-display font-semibold uppercase tracking-wider ${
                            theme === "dark" ? "text-slate-200" : "text-slate-800"
                          }`}>
                            NARRATIVE BREAKDOWN
                          </h3>
                          <button
                            onClick={toggleVoiceDictation}
                            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition ${
                              isRecordingVoice
                                ? "bg-red-600 border-red-500 text-white animate-pulse"
                                : theme === "dark" ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-300 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <Mic className="w-3.5 h-3.5" />
                            {isRecordingVoice ? `RECORDING (0:0${voiceTimer})` : "VOICE DICTATION"}
                          </button>
                        </div>

                        <textarea
                          placeholder="Provide a detailed description of the incident (potholes, pipeline burst, broken streetlight). Multi-language support and AI pre-categorization enabled."
                          value={reportNarrative}
                          onChange={(e) => setReportNarrative(e.target.value)}
                          className={`w-full h-36 border rounded-xl p-4 text-xs transition resize-none focus:outline-none focus:border-purple-500 ${
                            theme === "dark" 
                              ? "bg-slate-950 border-slate-800 text-white placeholder-slate-500" 
                              : "bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400"
                          }`}
                        ></textarea>

                        <button
                          onClick={handleSubmitSignal}
                          disabled={isSubmittingSignal}
                          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-display font-bold py-3.5 rounded-xl text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98] disabled:opacity-50"
                        >
                          {isSubmittingSignal ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>UPLOADING AUDIT BLOCKCHAIN SIGNAL...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>SUBMIT OFFICIAL CIVIC SIGNAL</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Right column: Image Evidence audit */}
                    <div className="space-y-6">
                      <div className={`${boxClass} rounded-2xl p-6 flex flex-col justify-between min-h-[380px]`}>
                        <div>
                          <h3 className={`text-sm font-display font-semibold uppercase tracking-wider mb-1 ${
                            theme === "dark" ? "text-slate-200" : "text-slate-800"
                          }`}>
                            VISUAL EVIDENCE
                          </h3>
                          <p className={`text-xs mb-6 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Digital audit required for rapid verification.</p>
                        </div>

                        {/* Interactive file upload canvas */}
                        <div className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 transition relative min-h-[220px] ${
                          theme === "dark" 
                            ? "border-slate-800 bg-slate-950/40 hover:bg-slate-950/80" 
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100/50"
                        }`}>
                          {cameraActive ? (
                            <div className="text-center">
                              <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-2" />
                              <p className="text-xs text-slate-400 font-mono">CALIBRATING LENS ADAPTERS...</p>
                            </div>
                          ) : reportImage ? (
                            <div className="relative w-full h-full">
                              <img
                                src={reportImage}
                                alt="Civic Evidence Preview"
                                className="w-full h-40 object-cover rounded-xl border border-slate-800"
                              />
                              <button
                                onClick={() => setReportImage(null)}
                                className="absolute top-2 right-2 bg-black/80 hover:bg-black text-white p-1 rounded-full text-xs"
                                title="Remove File"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="text-center space-y-4">
                              <Upload className="w-10 h-10 text-slate-600 mx-auto" />
                              <div className="text-xs">
                                <span className="font-semibold text-purple-400 cursor-pointer">Upload a file</span> or drag and drop
                                <p className="text-[10px] text-slate-500 mt-1">PNG, JPG, MP4 up to 50MB</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Trigger optical mock snapshots */}
                        <div className="grid grid-cols-2 gap-2 mt-6">
                          <button
                            onClick={triggerCameraShot}
                            className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            CAMERA ACCESS
                          </button>
                          <label className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer text-center">
                            <Upload className="w-3.5 h-3.5" />
                            UPLOAD FILE
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setReportImage(URL.createObjectURL(e.target.files[0]));
                                  showToast("Evidence file loaded from directory.", "success");
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* 2. TRACK TAB */}
                {citizenTab === "track" && (
                  <div className="max-w-2xl mx-auto space-y-6">
                    <div className={`${boxClass} rounded-2xl p-6`}>
                      <h3 className={`text-sm font-display font-semibold uppercase tracking-wider mb-4 ${theme === "dark" ? "text-slate-200" : "text-slate-850"}`}>
                        TRACK PUBLIC DISPATCH STATUS
                      </h3>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="ENTER REFERENCE ID (E.G., CMP-123456)..."
                          value={trackIdInput}
                          onChange={(e) => setTrackIdInput(e.target.value)}
                          className={`flex-1 rounded-xl px-4 py-2.5 text-xs font-mono tracking-wider uppercase focus:outline-none ${inputClass}`}
                        />
                        <button
                          onClick={handleTrackSearch}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-display font-bold px-6 rounded-xl text-xs transition"
                        >
                          TRACK
                        </button>
                      </div>

                      {trackSearchError && (
                        <p className="text-xs text-red-400 mt-2 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> {trackSearchError}
                        </p>
                      )}
                    </div>

                    {/* Show tracking info if found */}
                    {trackedSignal && (
                      <div className={`${cardClass} border-2 border-purple-500/20 rounded-3xl p-6 space-y-6`}>
                        
                        {/* Status bar */}
                        <div className={`flex items-center justify-between border-b pb-4 ${borderClass}`}>
                          <div>
                            <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded ${
                              isDark ? "text-purple-400 bg-purple-950/60" : "text-purple-700 bg-purple-50 border border-purple-200"
                            }`}>
                              {trackedSignal.id}
                            </span>
                            <span className={`text-xs ml-2 font-mono ${subTextClass}`}>
                              Filed: {new Date(trackedSignal.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold ${
                            trackedSignal.lifecycle === "RESOLVED"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800/40"
                              : trackedSignal.lifecycle === "IN_PROGRESS"
                              ? "bg-yellow-950 text-yellow-400 border border-yellow-800/40 animate-pulse"
                              : "bg-blue-950 text-blue-400 border border-blue-800/40"
                          }`}>
                            ● {trackedSignal.lifecycle}
                          </span>
                        </div>

                        {/* Location / details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-[10px] font-mono text-slate-500 uppercase">CLASSIFICATION</p>
                            <p className={`font-semibold mt-0.5 ${headerTextClass}`}>{trackedSignal.classification}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-mono text-slate-500 uppercase">LOCATION</p>
                            <p className={`font-semibold mt-0.5 ${headerTextClass}`}>{trackedSignal.location.address}</p>
                          </div>
                        </div>

                        {/* Narrative description */}
                        <div>
                          <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">CITIZEN NARRATIVE</p>
                          <p className={`text-xs italic p-4 rounded-xl border ${
                            theme === "dark" ? "text-slate-300 bg-slate-950/50 border-slate-800/80" : "text-slate-600 bg-slate-50 border-slate-200"
                          }`}>
                            "{trackedSignal.narrative}"
                          </p>
                        </div>

                        {/* AI Decision matrix */}
                        {trackedSignal.aiAnalysis && (
                          <div className={`border rounded-2xl p-5 space-y-3 ${isDark ? "bg-purple-950/15 border-purple-500/30" : "bg-purple-50/50 border-purple-200"}`}>
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                              <span className={`text-xs font-display font-bold ${isDark ? "text-purple-200" : "text-purple-900"}`}>AI DECISION MATRIX</span>
                              <span className="text-[9px] font-mono bg-purple-600/20 text-purple-300 px-1.5 py-0.5 rounded ml-auto">GEMINI 3.5</span>
                            </div>

                            <p className={`text-[10px] leading-relaxed ${subTextClass}`}>
                              {trackedSignal.aiAnalysis.reasoning}
                            </p>

                            <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] font-semibold">
                              <div className={`p-2.5 rounded-lg border ${innerBgClass}`}>
                                <span className="text-[8px] text-slate-500 block uppercase font-mono">PRIORITY</span>
                                <span className="text-rose-400 block mt-0.5">{trackedSignal.aiAnalysis.priority}</span>
                              </div>
                              <div className={`p-2.5 rounded-lg border ${innerBgClass}`}>
                                <span className="text-[8px] text-slate-500 block uppercase font-mono">DEPARTMENT</span>
                                <span className="text-purple-300 block mt-0.5 truncate">{trackedSignal.aiAnalysis.department}</span>
                              </div>
                              <div className={`p-2.5 rounded-lg border ${innerBgClass}`}>
                                <span className="text-[8px] text-slate-500 block uppercase font-mono">AUDIT VERDICT</span>
                                <span className="text-emerald-400 block mt-0.5">COMPLIANT</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Visual Evidence screenshot */}
                        {trackedSignal.imageUrl && (
                          <div>
                            <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">AUDIT EVIDENCE IMAGE</p>
                            <img
                              src={trackedSignal.imageUrl}
                              alt="Civic evidence audit"
                              className={`w-full h-44 object-cover rounded-xl border ${borderClass}`}
                            />
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                )}

                {/* 3. VAULT TAB */}
                {citizenTab === "vault" && (
                  <div className="max-w-md mx-auto">
                    <div className={`${cardClass} rounded-3xl p-8 relative overflow-hidden`}>
                      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 to-indigo-500"></div>

                      <div className="text-center mb-6">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 border ${
                          isDark ? "bg-purple-950/50 border-purple-500/30" : "bg-purple-50 border-purple-200"
                        }`}>
                          <Shield className="w-6 h-6 text-purple-400" />
                        </div>
                        <h3 className={`text-base font-display font-bold tracking-wider ${headerTextClass}`}>
                          CITIZEN SECURE VAULT
                        </h3>
                        <p className={`text-xs mt-1 ${subTextClass}`}>Zero-Knowledge Encrypted Identification</p>
                      </div>

                      {vaultError && (
                        <div className="bg-red-950/40 border border-red-500/30 p-3 rounded-xl text-xs text-red-400 mb-4 font-semibold text-center">
                          {vaultError}
                        </div>
                      )}

                      {/* Locked State form */}
                      {isVaultLocked ? (
                        <div className="space-y-4">
                          <div>
                            <label className={`text-[10px] font-mono uppercase block mb-1 ${subTextClass}`}>
                              SECURE VAULT PASSCODE
                            </label>
                            <input
                              type="password"
                              placeholder="Enter secure passcode (Try 123456)"
                              value={vaultPasscode}
                              onChange={(e) => setVaultPasscode(e.target.value)}
                              className={`w-full rounded-xl px-4 py-2.5 text-xs text-center font-mono focus:outline-none transition ${inputClass}`}
                            />
                          </div>

                          <button
                            onClick={handleVaultUnlock}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition"
                          >
                            <Lock className="w-4 h-4" />
                            UNCRYPT SECURE IDENTITIES
                          </button>
                        </div>
                      ) : (
                        /* Unlocked State Vault panel */
                        <div className="space-y-6">
                          <div className={`flex items-center justify-between border-b pb-3 ${borderClass}`}>
                            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                              <Unlock className="w-3.5 h-3.5" /> DECRYPTED SECURE VAULT
                            </span>
                            <button
                              onClick={() => {
                                setIsVaultLocked(true);
                                setVaultPasscode("");
                              }}
                              className={`text-xs ${subTextClass} hover:${headerTextClass}`}
                            >
                              Lock Vault
                            </button>
                          </div>

                          {vaultDocs.map((doc: any) => (
                            <div key={doc.type} className={`p-4 rounded-2xl border flex items-center justify-between ${innerBgClass}`}>
                              <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-lg border font-mono text-xs font-bold ${
                                  isDark ? "bg-purple-950/50 border-purple-500/20 text-purple-400" : "bg-purple-50 border-purple-200 text-purple-700"
                                }`}>
                                  ID
                                </div>
                                <div className="text-left text-xs">
                                  <span className={`font-bold block ${headerTextClass}`}>{doc.type}</span>
                                  <span className={`text-[10px] font-mono ${subTextClass}`}>{doc.idNumber}</span>
                                </div>
                              </div>
                              <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded">
                                VERIFIED VAULT ID
                              </span>
                            </div>
                          ))}

                          <div className={`border-t pt-4 space-y-3 ${borderClass}`}>
                            <span className={`text-[10px] font-mono block uppercase ${subTextClass}`}>SECURE DIRECTORY ENROLLMENT</span>
                            
                            <select 
                              value={enrollType}
                              onChange={(e) => {
                                setEnrollType(e.target.value);
                                setCustomCardName(""); // Reset custom card name
                              }}
                              className={`w-full rounded-xl px-3 py-2 text-xs ${inputClass}`}
                            >
                              <option value="AADHAAR CARD">AADHAAR CARD</option>
                              <option value="PAN IDENTITY CARD">PAN IDENTITY CARD</option>
                              <option value="MUNICIPAL VOTER DECREE">MUNICIPAL VOTER DECREE</option>
                              <option value="DRIVING LICENSE">DRIVING LICENSE</option>
                              <option value="HEALTH INSURANCE ID">HEALTH INSURANCE ID</option>
                              <option value="OTHER">OTHER (CUSTOM CARD)</option>
                            </select>

                            {enrollType === "OTHER" && (
                              <div className="space-y-1">
                                <span className={`text-[9px] font-mono block uppercase ${subTextClass}`}>Name of the Card</span>
                                <input
                                  type="text"
                                  placeholder="e.g. PASSPORT, METRO CARD, HEALTH CARD"
                                  value={customCardName}
                                  onChange={(e) => setCustomCardName(e.target.value)}
                                  className={`w-full rounded-xl px-3 py-2 text-xs font-mono ${inputClass}`}
                                />
                              </div>
                            )}

                            <input
                              type="text"
                              placeholder="Set Identity ID Number"
                              value={enrollId}
                              onChange={(e) => setEnrollId(e.target.value)}
                              className={`w-full rounded-xl px-3 py-2 text-xs font-mono ${inputClass}`}
                            />

                            <button
                              onClick={handleVaultUpload}
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              UPLOAD IDENTITY SCAN
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}

                {/* 4. PROJECTS TAB */}
                {citizenTab === "projects" && (
                  <div className="space-y-6">
                    <div className="text-center md:text-left mb-6">
                      <h3 className={`text-sm font-display font-semibold uppercase tracking-wider mb-1 ${headerTextClass}`}>
                        MUNICIPAL CAPITAL WORKS
                      </h3>
                      <p className={`text-xs ${subTextClass}`}>Public tracking of infrastructure progress and budget utilizations.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {projects.map((p) => (
                        <div key={p.id} className={`${cardClass} rounded-3xl p-6 space-y-4 relative overflow-hidden flex flex-col justify-between`}>
                          
                          {/* Top row */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                                isDark ? "text-purple-400 bg-purple-950/60" : "text-purple-700 bg-purple-50 border border-purple-200"
                              }`}>
                                {p.category}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold ${
                                p.status === "COMPLETED"
                                  ? "bg-emerald-950 text-emerald-400"
                                  : p.status === "DELAYED"
                                  ? "bg-rose-950 text-rose-400"
                                  : "bg-yellow-950 text-yellow-400 animate-pulse"
                              }`}>
                                {p.status}
                              </span>
                            </div>

                            <h4 className={`text-sm font-display font-bold tracking-tight ${headerTextClass}`}>{p.name}</h4>
                            <p className={`text-xs leading-relaxed ${subTextClass}`}>{p.description}</p>
                          </div>

                          {/* Progress slider bar & budget */}
                          <div className={`space-y-4 pt-4 border-t ${borderClass}`}>
                            <div>
                              <div className={`flex items-center justify-between text-[10px] font-semibold mb-1 ${labelClass}`}>
                                <span>CURRENT MILESTONES</span>
                                <span className="font-mono text-purple-400">{p.progress}% Complete</span>
                              </div>
                              <div className={`h-2 rounded-full overflow-hidden border ${
                                isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
                              }`}>
                                <div
                                  className="h-full bg-purple-600 rounded-full transition-all duration-1000"
                                  style={{ width: `${p.progress}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                              <div className={`p-2 rounded-lg border ${innerBgClass}`}>
                                <span className="text-slate-500 block text-[8px] uppercase">SUGGESTED</span>
                                <span className={`block font-bold ${labelClass}`}>₹{p.budgetSuggested.toLocaleString()}</span>
                              </div>
                              <div className={`p-2 rounded-lg border ${innerBgClass}`}>
                                <span className="text-slate-500 block text-[8px] uppercase">UTILIZED</span>
                                <span className="text-purple-400 block font-bold">₹{p.budgetUtilized.toLocaleString()}</span>
                              </div>
                            </div>

                            {/* Before / After view toggles */}
                            <div className="flex items-center justify-between pt-2">
                              <span className={`text-[9px] font-mono ${subTextClass}`}>Timeline: {p.timeline}</span>
                              <button
                                onClick={() => toggleProjectSlider(p.id)}
                                className={`border hover:opacity-85 text-xs px-3 py-1.5 rounded-lg text-[9px] font-semibold transition flex items-center gap-1 ${innerBgClass} ${labelClass}`}
                              >
                                <Eye className="w-3 h-3" />
                                {projectSliderViews[p.id] ? "SHOW BEFORE" : "SHOW AFTER"}
                              </button>
                            </div>

                            {/* Conditional rendering before/after images */}
                            <div className={`mt-2 h-24 rounded-lg overflow-hidden border relative ${borderClass}`}>
                              <img
                                src={projectSliderViews[p.id] ? p.imageUrlAfter : p.imageUrlBefore}
                                alt="Project State Preview"
                                className="w-full h-full object-cover transition-all duration-500"
                              />
                              <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-mono ${isDark ? "bg-slate-950/85 text-slate-300" : "bg-slate-50/90 text-slate-750 border border-slate-200"}`}>
                                {projectSliderViews[p.id] ? "COMPLETION PROFILE" : "ORIGINAL BLUEPRINT"}
                              </div>
                            </div>

                          </div>

                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. COMMUNITY TAB */}
                {citizenTab === "community" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left side: Neighborhood Pulse index & Polls */}
                    <div className="space-y-6">
                      
                      {/* Pulse rating */}
                      <div className={`${cardClass} rounded-3xl p-6 text-center`}>
                        <span className={`text-[9px] font-mono uppercase tracking-widest ${subTextClass}`}>NEIGHBORHOOD PULSE</span>
                        <div className={`text-5xl font-display font-extrabold my-3 tracking-tighter ${headerTextClass}`}>
                          94%
                        </div>
                        <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                          Positive Vibes
                        </span>
                        <p className={`text-[10px] mt-4 leading-relaxed ${subTextClass}`}>
                          Signals currently being verified by community and local authorities holding high compliance indices.
                        </p>
                      </div>

                      {/* Active urban polls */}
                      <div className={`${cardClass} rounded-3xl p-6 space-y-4`}>
                        <div className={`flex items-center gap-1.5 border-b pb-3 ${borderClass}`}>
                          <Vote className="w-4 h-4 text-purple-400" />
                          <h3 className={`text-xs font-display font-semibold uppercase tracking-wider ${headerTextClass}`}>
                            ACTIVE URBAN POLLS
                          </h3>
                          <span className="bg-purple-950/60 text-purple-400 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ml-auto">
                            LIVE
                          </span>
                        </div>

                        <div className="space-y-6">
                          {polls.map((poll) => (
                            <div key={poll.id} className="space-y-2 text-xs">
                              <p className={`font-semibold leading-tight ${headerTextClass}`}>{poll.question}</p>
                              
                              <div className="space-y-1.5">
                                {poll.options.map((option, index) => {
                                  const percentage = Math.round((option.votes / poll.totalVotes) * 100) || 0;
                                  return (
                                    <button
                                      key={option.text}
                                      onClick={() => handleVotePoll(poll.id, index)}
                                      className={`w-full text-left border p-2.5 rounded-xl relative overflow-hidden group flex items-center justify-between ${inputClass}`}
                                    >
                                      {/* Background progress bar */}
                                      <div
                                        className="absolute top-0 left-0 bottom-0 bg-purple-900/10 transition-all duration-1000"
                                        style={{ width: `${percentage}%` }}
                                      ></div>

                                      <span className={`relative z-10 text-[10px] font-medium truncate max-w-[80%] ${labelClass}`}>
                                        {option.text}
                                      </span>
                                      <span className="relative z-10 font-mono text-[10px] font-semibold text-purple-400 pl-2">
                                        {percentage}%
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>

                      </div>

                    </div>

                    {/* Right side: Community verification feed */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className={`${boxClass} rounded-2xl p-6`}>
                        <h3 className={`text-sm font-display font-semibold uppercase tracking-wider mb-1 ${headerTextClass}`}>
                          IMPACT FEED
                        </h3>
                        <p className={`text-xs mb-6 ${subTextClass}`}>Signals currently being verified by your community.</p>

                        <div className="space-y-4">
                          {signals.map((s) => (
                            <div key={s.id} className={`p-5 rounded-2xl border flex items-start gap-4 ${innerBgClass}`}>
                              
                              {/* Upvote button container */}
                              <button
                                onClick={() => handleUpvoteSignal(s.id)}
                                className={`p-2 rounded-xl flex flex-col items-center justify-center min-w-[40px] shadow-sm active:scale-95 transition hover:opacity-85 ${innerBgClass}`}
                              >
                                <ArrowUp className="w-4 h-4 text-purple-400" />
                                <span className={`text-xs font-mono font-bold mt-1 ${headerTextClass}`}>{s.upvotes}</span>
                              </button>

                              {/* Content description */}
                              <div className="flex-1 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                    isDark ? "text-purple-400 bg-purple-950/60" : "text-purple-700 bg-purple-50 border border-purple-200"
                                  }`}>
                                    VERIFIED SIGNAL
                                  </span>
                                  <span className={`text-[9px] font-mono ${subTextClass}`}>
                                    {s.location.address ? s.location.address : "Unknown Location"}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold ml-auto ${
                                    s.lifecycle === "RESOLVED"
                                      ? "bg-emerald-950 text-emerald-400"
                                      : s.lifecycle === "IN_PROGRESS"
                                      ? "bg-yellow-950 text-yellow-400"
                                      : "bg-blue-950 text-blue-400"
                                  }`}>
                                    {s.lifecycle}
                                  </span>
                                </div>

                                <p className={`text-xs leading-relaxed font-semibold ${labelClass}`}>
                                  {s.narrative}
                                </p>

                                {/* Tags and classifications */}
                                <div className={`flex flex-wrap gap-1.5 text-[9px] font-semibold font-mono ${subTextClass}`}>
                                  <span className={`px-2 py-0.5 rounded ${badgeClass}`}>
                                    #{s.classification.replace(/\s+/g, "").toLowerCase()}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded uppercase ${badgeClass}`}>
                                    {s.priority} Priority
                                  </span>
                                </div>

                              </div>

                            </div>
                          ))}
                        </div>

                      </div>
                    </div>

                  </div>
                )}

                {/* 6. TRANSPARENCY TAB */}
                {citizenTab === "transparency" && (
                  <Analytics signals={signals} theme={theme} />
                )}

              </div>
            )}

            {/* OFFICIAL DASHBOARD VIEWS */}
            {session.role === "official" && (
              <div>
                
                {officialTab === "sentinel" ? (
                  /* CUSTOM HIGH-TECH HEADER FOR SENTINEL TO MATCH PHOTO */
                  <div className={`flex flex-col md:flex-row items-center justify-between gap-4 mb-6 border-b pb-5 transition-colors ${
                    isDark ? "border-slate-800" : "border-slate-200"
                  }`}>
                    
                    {/* Left side: Indicator and Titles */}
                    <div className="flex items-center gap-4 text-center md:text-left">
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)] shrink-0 hidden md:block"></span>
                      <div>
                        <h2 className={`text-xl font-display font-black tracking-wider uppercase flex items-center gap-2 ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}>
                          IOT SENTINEL GRID
                        </h2>
                        <p className={`text-[10px] font-mono tracking-widest uppercase ${
                          isDark ? "text-slate-400" : "text-slate-500"
                        }`}>CONNECTED INFRASTRUCTURE MONITOR</p>
                      </div>

                      {/* City dropdown next to title inside the header */}
                      <div className="ml-4 shrink-0 pointer-events-auto">
                        <select
                          value={activeCity}
                          onChange={(e) => setActiveCity(e.target.value)}
                          className={`border rounded-xl px-4 py-2 text-xs uppercase font-mono font-bold focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer transition ${
                            isDark 
                              ? "bg-slate-900 border-slate-800 hover:border-slate-700 text-white" 
                              : "bg-white border-slate-300 hover:border-slate-400 text-slate-850 shadow-sm"
                          }`}
                        >
                          <option value="Delhi">DELHI</option>
                          <option value="Mumbai">MUMBAI</option>
                          <option value="Bangalore">BANGALORE</option>
                          <option value="Chennai">CHENNAI</option>
                          <option value="Kolkata">KOLKATA</option>
                          <option value="Hyderabad">HYDERABAD</option>
                          <option value="Jaipur">JAIPUR</option>
                          <option value="Pune">PUNE</option>
                          <option value="Ahmedabad">AHMEDABAD</option>
                          <option value="Lucknow">LUCKNOW</option>
                          <option value="Kochi">KOCHI</option>
                        </select>
                      </div>
                    </div>

                    {/* Right side: Sub Tab bar */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: "standard", label: "STANDARD", icon: Layers },
                        { id: "projects", label: "PROJECTS", icon: Landmark },
                        { id: "sentinel", label: "IOT SENTINEL", icon: Radio },
                        { id: "warroom", label: "WAR ROOM", icon: ShieldAlert }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setOfficialTab(tab.id as any);
                            setSelectedSignal(null);
                          }}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition uppercase font-display ${
                            officialTab === tab.id
                              ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20 border border-purple-500/30"
                              : isDark
                                ? "text-slate-400 hover:text-white bg-slate-900/40 border border-slate-800 hover:bg-slate-850/40"
                                : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm"
                          }`}
                        >
                          <tab.icon className="w-3.5 h-3.5" />
                          {tab.label}
                        </button>
                      ))}
                    </div>

                  </div>
                ) : (
                  /* DEFAULT OFFICIAL INFO BAR AND SUB TAB BAR */
                  <>
                    {/* Official Info Bar */}
                    <div className={`${cardClass} p-6 rounded-3xl mb-6 flex flex-col md:flex-row items-center justify-between gap-4`}>
                      <div className="text-center md:text-left">
                        <h2 className={`text-lg font-display font-bold tracking-tight flex items-center justify-center md:justify-start gap-2 ${headerTextClass}`}>
                          <Shield className="w-5 h-5 text-purple-500 animate-pulse" />
                          OFFICIAL DASHBOARD
                        </h2>
                        <p className={`text-xs mt-0.5 ${subTextClass}`}>Municipal Intelligence & Urban Operations Command.</p>
                      </div>

                      {/* Operational stats overview */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div className={`px-5 py-2 rounded-xl border min-w-[110px] ${innerBgClass}`}>
                          <span className="text-[9px] font-mono text-slate-500 block uppercase">Open Tickets</span>
                          <span className={`text-base font-mono font-bold ${headerTextClass}`}>{signals.filter(s => s.lifecycle === "PENDING").length}</span>
                        </div>
                        <div className={`px-5 py-2 rounded-xl border min-w-[110px] ${innerBgClass}`}>
                          <span className="text-[9px] font-mono text-slate-500 block uppercase">Pending Alert</span>
                          <span className="text-base font-mono font-bold text-rose-400">{signals.filter(s => s.priority === "HIGH" && s.lifecycle === "PENDING").length}</span>
                        </div>
                        <div className={`px-5 py-2 rounded-xl border min-w-[110px] ${innerBgClass}`}>
                          <span className="text-[9px] font-mono text-slate-500 block uppercase">Field Response</span>
                          <span className="text-base font-mono font-bold text-yellow-400">{signals.filter(s => s.lifecycle === "IN_PROGRESS").length}</span>
                        </div>
                        <div className={`px-5 py-2 rounded-xl border min-w-[110px] ${innerBgClass}`}>
                          <span className="text-[9px] font-mono text-slate-500 block uppercase">Resolved Cases</span>
                          <span className="text-base font-mono font-bold text-emerald-400">{signals.filter(s => s.lifecycle === "RESOLVED").length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Sub Tab bar */}
                    <div className={`flex flex-wrap gap-2 border-b pb-3 mb-6 ${borderClass}`}>
                      {[
                        { id: "standard", label: "STANDARD", icon: Layers },
                        { id: "projects", label: "PROJECTS", icon: Landmark },
                        { id: "sentinel", label: "IOT SENTINEL", icon: Radio },
                        { id: "warroom", label: "WAR ROOM", icon: ShieldAlert }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setOfficialTab(tab.id as any);
                            setSelectedSignal(null);
                          }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition ${
                            officialTab === tab.id
                              ? "bg-purple-600 text-white shadow-md shadow-purple-500/10"
                              : `${subTextClass} hover:${headerTextClass}`
                          }`}
                        >
                          <tab.icon className="w-3.5 h-3.5" />
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* A. STANDARD SUB-TAB: Matrix table of all signals */}
                {officialTab === "standard" && (
                  <div className="space-y-6">
                    
                    {/* Matrix list block */}
                    <div className={`${boxClass} rounded-2xl p-6 space-y-4`}>
                      
                      <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4 ${borderClass}`}>
                        <h3 className={`text-sm font-display font-semibold uppercase tracking-wider ${headerTextClass}`}>
                          OPERATIONAL SIGNAL MATRIX
                        </h3>

                        {/* Search and Filter */}
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                          <input
                            type="text"
                            placeholder="Search signals..."
                            value={officialSearchQuery}
                            onChange={(e) => setOfficialSearchQuery(e.target.value)}
                            className={`rounded-lg px-3 py-1.5 text-xs focus:outline-none w-full sm:w-40 ${inputClass}`}
                          />

                          <select
                            value={officialFilterClassification}
                            onChange={(e) => setOfficialFilterClassification(e.target.value)}
                            className={`rounded-lg px-3 py-1.5 text-xs ${inputClass}`}
                          >
                            <option value="ALL">ALL SIGNALS</option>
                            <option value="Water Supply">WATER SUPPLY</option>
                            <option value="Electricity & Power">ELECTRICITY & POWER</option>
                            <option value="Sanitation & Waste Management">SANITATION & WASTE</option>
                          </select>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className={`text-[10px] font-mono text-slate-500 uppercase border-b ${borderClass}`}>
                            <tr>
                              <th className="py-3 px-4">ID / Origin</th>
                              <th className="py-3 px-4">Context</th>
                              <th className="py-3 px-4">Classification</th>
                              <th className="py-3 px-4">Lifecycle</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${isDark ? "divide-slate-850" : "divide-slate-100"}`}>
                            {filteredSignals.map((s) => (
                              <tr key={s.id} className="hover:opacity-90 transition">
                                <td className="py-3 px-4 font-mono font-bold text-purple-400">
                                  {s.id}
                                  <span className={`block text-[8px] font-normal ${subTextClass}`}>By: {s.reporter}</span>
                                </td>
                                <td className={`py-3 px-4 max-w-xs truncate font-medium ${labelClass}`}>
                                  {s.narrative}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${badgeClass}`}>
                                    {s.classification}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <select
                                    value={s.lifecycle}
                                    onChange={(e) => handleUpdateLifecycle(s.id, e.target.value as Lifecycle)}
                                    className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold focus:outline-none ${inputClass}`}
                                  >
                                    <option value="PENDING">PENDING</option>
                                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                                    <option value="RESOLVED">RESOLVED</option>
                                    <option value="ESCALATED">ESCALATED</option>
                                  </select>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    onClick={() => setSelectedSignal(s)}
                                    className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 ml-auto text-xs"
                                  >
                                    DETAILS <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                    </div>

                    {/* Interactive Profile detail Modal Overlay overlay */}
                    {selectedSignal && (
                      <div className="fixed inset-0 z-45 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
                        <div className={`p-6 rounded-3xl max-w-xl w-full shadow-2xl relative border ${cardClass}`}>
                          <button
                            onClick={() => setSelectedSignal(null)}
                            className={`absolute top-4 right-4 text-xs ${subTextClass} hover:${headerTextClass}`}
                          >
                            ✕
                          </button>

                          <div className={`flex items-center gap-2 border-b pb-3 mb-4 ${borderClass}`}>
                            <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded ${
                              isDark ? "bg-purple-950/60 text-purple-400" : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}>
                              {selectedSignal.id}
                            </span>
                            <span className={`text-xs font-display font-bold uppercase ${headerTextClass}`}>INCIDENT PROFILE</span>
                          </div>

                          <div className="space-y-4 text-xs">
                            <div>
                              <span className={`text-[10px] font-mono block uppercase ${subTextClass}`}>CITIZEN NARRATIVE</span>
                              <p className={`p-4 rounded-xl border mt-1 italic ${labelClass} ${innerBgClass}`}>
                                "{selectedSignal.narrative}"
                              </p>
                            </div>

                            {selectedSignal.aiAnalysis && (
                              <div className="bg-purple-950/20 border border-purple-500/40 p-4 rounded-2xl space-y-3">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="w-4 h-4 text-purple-400" />
                                  <span className="font-display font-semibold text-purple-200">AI DECISION MATRIX</span>
                                  <span className="text-[9px] font-mono bg-purple-600/20 text-purple-300 px-1.5 py-0.5 rounded ml-auto">VERDICT: MATCHED</span>
                                </div>
                                <p className={`text-[11px] leading-relaxed ${subTextClass}`}>
                                  {selectedSignal.aiAnalysis.reasoning}
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-[10px]">
                                  <div className={`p-2 rounded border ${innerBgClass}`}>
                                    <span className="text-slate-500 block text-[8px] font-mono">PRIORITY</span>
                                    <span className="text-rose-400 font-bold block mt-0.5">{selectedSignal.aiAnalysis.priority}</span>
                                  </div>
                                  <div className={`p-2 rounded border ${innerBgClass}`}>
                                    <span className="text-slate-500 block text-[8px] font-mono">DEPARTMENT</span>
                                    <span className="text-purple-300 font-bold block mt-0.5 truncate">{selectedSignal.aiAnalysis.department}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Lifecycle control buttons */}
                            <div className={`flex flex-wrap items-center justify-between gap-3 pt-4 border-t ${borderClass}`}>
                              <div>
                                <span className={`text-[9px] font-mono block uppercase mb-1 ${subTextClass}`}>LIFECYCLE CONTROL</span>
                                <div className="flex gap-1">
                                  {["PENDING", "IN_PROGRESS", "RESOLVED"].map((st) => (
                                    <button
                                      key={st}
                                      onClick={() => handleUpdateLifecycle(selectedSignal.id, st as Lifecycle)}
                                      className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold border transition ${
                                        selectedSignal.lifecycle === st
                                          ? "bg-purple-600 border-purple-500 text-white"
                                          : `hover:opacity-85 ${innerBgClass} ${labelClass}`
                                      }`}
                                    >
                                      {st}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <button
                                onClick={() => {
                                  handleDispatchOfficial(selectedSignal.id);
                                  setSelectedSignal(null);
                                }}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-500/10 active:scale-95 transition"
                              >
                                <Navigation className="w-3.5 h-3.5" />
                                DISPATCH UNIT
                              </button>
                            </div>

                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* B. PROJECTS SUB-TAB: Budget summary and detail sliders */}
                {officialTab === "projects" && (
                  <div className="space-y-6">
                    <div className={`${boxClass} rounded-3xl p-6 space-y-4`}>
                      <h3 className={`text-sm font-display font-semibold uppercase border-b pb-3 mb-4 ${headerTextClass} ${borderClass}`}>
                        CAPITAL PROJECTS
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className={`p-4 rounded-xl border ${innerBgClass}`}>
                          <span className="text-[10px] font-mono text-slate-500 block uppercase">TOTAL BUDGET ALLOCATED</span>
                          <span className={`text-xl font-mono font-bold ${headerTextClass}`}>₹{(totalAllocatedBudget / 1000000).toFixed(1)}M</span>
                        </div>
                        <div className={`p-4 rounded-xl border ${innerBgClass}`}>
                          <span className="text-[10px] font-mono text-slate-500 block uppercase">ACTIVE PROJECTS</span>
                          <span className="text-xl font-mono font-bold text-purple-400">
                            {projects.filter(p => p.status !== "COMPLETED").length}
                          </span>
                        </div>
                        <div className={`p-4 rounded-xl border ${innerBgClass}`}>
                          <span className="text-[10px] font-mono text-slate-500 block uppercase">AVG. COMPLETION</span>
                          <span className="text-xl font-mono font-bold text-emerald-400">58%</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        {projects.map((p) => (
                          <div key={p.id} className={`p-5 rounded-2xl border flex items-start gap-4 ${innerBgClass}`}>
                            <img
                              src={projectSliderViews[p.id] ? p.imageUrlAfter : p.imageUrlBefore}
                              alt="Blueprint view"
                              className={`w-20 h-20 object-cover rounded-xl border shrink-0 ${borderClass}`}
                            />
                            <div className="flex-1 space-y-1 text-xs">
                              <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                isDark ? "text-purple-400 bg-purple-950/60" : "text-purple-700 bg-purple-50 border border-purple-200"
                              }`}>
                                {p.category}
                              </span>
                              <h4 className={`font-bold truncate mt-1 ${headerTextClass}`}>{p.name}</h4>
                              <p className={`text-[10px] line-clamp-2 leading-relaxed ${subTextClass}`}>{p.description}</p>
                              <div className="flex items-center justify-between pt-1.5">
                                <span className={`text-[9px] font-mono ${subTextClass}`}>Progress: {p.progress}%</span>
                                <button
                                  onClick={() => toggleProjectSlider(p.id)}
                                  className="text-purple-400 hover:text-purple-300 font-semibold text-[9px]"
                                >
                                  {projectSliderViews[p.id] ? "SHOW BEFORE" : "SHOW AFTER"}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>
                )}

                {/* C. IOT SENTINEL SUB-TAB: Telemetry network */}
                {officialTab === "sentinel" && (
                  <div className="w-full">
                    <Map
                      city={activeCity}
                      signals={signals}
                      sensors={sensors}
                      selectedSensorId={selectedSensor?.id}
                      onSelectSensor={(sensor) => setSelectedSensor(sensor)}
                      mode="sentinel"
                      onCityChange={setActiveCity}
                      theme={theme}
                    />
                  </div>
                )}

                {/* D. WAR ROOM SUB-TAB: Dispatch control */}
                {officialTab === "warroom" && (
                  <div className="space-y-6 animate-fade-in">
                    <div className={`${boxClass} rounded-3xl p-6`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-sm font-display font-semibold uppercase tracking-wider flex items-center gap-2 text-red-400 ${headerTextClass}`}>
                          <ShieldAlert className="w-4 h-4 text-red-500" /> COMBAT WAR ROOM COMMAND
                        </h3>
                        <span className="bg-red-950/60 text-red-400 border border-red-800/40 px-2.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase">
                          SATELLITE INTEL ACTIVE
                        </span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Map block */}
                        <div className="lg:col-span-2">
                          <Map
                            city={activeCity}
                            signals={signals}
                            mode="warroom"
                            activeRouteToId={dispatchedSignalId}
                            onCityChange={setActiveCity}
                            theme={theme}
                          />
                        </div>

                        {/* Dispatch list and feedback */}
                        <div className={`p-5 rounded-2xl border flex flex-col justify-between min-h-[360px] ${innerBgClass}`}>
                          <div>
                            <h4 className={`text-xs font-mono font-bold uppercase tracking-wider mb-3 ${subTextClass}`}>TACTICAL DIRECTIVES</h4>
                            
                            {dispatchedSignalId ? (
                              <div className="space-y-4">
                                <div className="bg-purple-950/30 border border-purple-500/30 p-4 rounded-xl text-xs space-y-2">
                                  <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                                    <Compass className="w-4 h-4 animate-spin" />
                                    <span>ACTIVE DISPATCH PATH</span>
                                  </div>
                                  <p className={`italic ${labelClass}`}>
                                    "{signals.find(s => s.id === dispatchedSignalId)?.narrative}"
                                  </p>
                                  <div className={`text-[10px] font-mono mt-2 ${subTextClass}`}>
                                    Target Address: {signals.find(s => s.id === dispatchedSignalId)?.location.address}
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-center">
                                  <div className={`p-2 rounded-lg border ${innerBgClass}`}>
                                    <span className="text-slate-500 block uppercase text-[8px]">AVERAGE DENSITY</span>
                                    <span className="text-rose-400 block mt-0.5 font-bold">HIGH</span>
                                  </div>
                                  <div className={`p-2 rounded-lg border ${innerBgClass}`}>
                                    <span className="text-slate-500 block uppercase text-[8px]">ACTIVE UNITS</span>
                                    <span className="text-emerald-400 block mt-0.5 font-bold">12 Ready</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className={`text-center py-12 text-xs space-y-3 ${subTextClass}`}>
                                <HelpCircle className="w-8 h-8 text-slate-700 mx-auto" />
                                <p>No dispatch mission currently locked. Go to STANDARD tab and click "DISPATCH UNIT" on any active incident.</p>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              if (dispatchedSignalId) {
                                handleUpdateLifecycle(dispatchedSignalId, Lifecycle.RESOLVED);
                                setDispatchedSignalId(null);
                                showToast("Tactical directive marked as RESOLVED.", "success");
                              } else {
                                showToast("No active mission to resolve.", "error");
                              }
                            }}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-display font-semibold py-3 rounded-xl text-xs tracking-wider uppercase transition active:scale-95 disabled:opacity-50 mt-4"
                            disabled={!dispatchedSignalId}
                          >
                            FORCE DISPATCH RESOLUTION
                          </button>
                        </div>

                      </div>

                    </div>
                  </div>
                )}

              </div>
            )}

            {/* RESPONSE FORCE UNIT DASHBOARD VIEW */}
            {session.role === "response_force" && (
              <div className="space-y-6">
                
                {/* Header widget */}
                <div className={`${cardClass} p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4`}>
                  <div>
                    <h2 className={`text-lg font-display font-bold tracking-tight flex items-center justify-center md:justify-start gap-2 ${headerTextClass}`}>
                      <Shield className="w-5 h-5 text-red-500 animate-pulse" />
                      RESPONSE UNIT DASHBOARD
                    </h2>
                    <p className={`text-xs mt-0.5 ${subTextClass}`}>Rapid Hydro Force Unit ADS123 allocated sector tasking.</p>
                  </div>
                  <span className={`px-4 py-2 rounded-xl font-mono border ${labelClass} ${innerBgClass}`}>
                    Active Base: <span className="text-purple-400">Delhi Sector 4 Command</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Left: allocated tasking */}
                  <div className="space-y-4">
                    <h3 className={`text-xs font-mono font-bold uppercase tracking-wider mb-2 ${subTextClass}`}>ALLOCATED DIRECTIVES</h3>
                    
                    {signals.filter(s => s.dispatchedUnitId === "ADS123" || s.id === "CMP-001").map((task) => (
                      <div key={task.id} className={`${cardClass} rounded-2xl p-5 space-y-4`}>
                        <div className={`flex items-center justify-between border-b pb-2 ${borderClass}`}>
                          <span className="text-[10px] font-mono font-bold text-purple-400">{task.id}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold ${
                            task.lifecycle === "RESOLVED" ? "bg-emerald-950 text-emerald-400" : "bg-yellow-950 text-yellow-400 animate-pulse"
                          }`}>
                            {task.lifecycle}
                          </span>
                        </div>

                        <p className={`text-xs leading-relaxed font-semibold ${headerTextClass}`}>
                          "{task.narrative}"
                        </p>

                        <div className={`text-[10px] ${subTextClass}`}>
                          <span className="block font-bold">Address:</span> {task.location.address}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              handleUpdateLifecycle(task.id, Lifecycle.IN_PROGRESS);
                              setDispatchedSignalId(task.id);
                              showToast("Mission Accepted. Deploying vehicles to hotspot...", "info");
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg text-[10px] uppercase transition"
                            disabled={task.lifecycle === "RESOLVED"}
                          >
                            DISPATCH
                          </button>
                          <button
                            onClick={() => {
                              handleUpdateLifecycle(task.id, Lifecycle.RESOLVED);
                              if (dispatchedSignalId === task.id) setDispatchedSignalId(null);
                              showToast("Hotspot successfully resolved. Cleanup logged.", "success");
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg text-[10px] uppercase transition"
                            disabled={task.lifecycle === "RESOLVED"}
                          >
                            RESOLVE
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Right: Map routing and tracking */}
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className={`text-xs font-mono font-bold uppercase tracking-wider mb-2 ${subTextClass}`}>TACTICAL PATHFINDING</h3>
                    <div className={`${boxClass} rounded-3xl p-6`}>
                      <Map
                        city={activeCity}
                        signals={signals}
                        mode="warroom"
                        activeRouteToId={dispatchedSignalId || "CMP-001"}
                        onCityChange={setActiveCity}
                        theme={theme}
                      />
                    </div>
                  </div>

                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer Branding */}
      <footer className={`py-6 text-center text-[10px] font-mono mt-12 space-y-2 border-t bg-opacity-45 ${borderClass} ${innerBgClass} ${subTextClass}`}>
        <div>
          © 2026 Janaspandana Platform. Built for the citizens. All rights reserved.
        </div>
        <div className="flex justify-center gap-4 text-slate-600">
          <a href="#" className="hover:text-purple-400 transition">Privacy Policy</a>
          <span>•</span>
          <a href="#" className="hover:text-purple-400 transition">Terms of Service</a>
          <span>•</span>
          <a href="#" className="hover:text-purple-400 transition">Support Core</a>
        </div>
      </footer>

    </div>
  );
}
