import { useState, useRef, useEffect } from "react";
import axios from "axios";
import html2canvas from "html2canvas";
import pptxgen from "pptxgenjs";

export default function App() {
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modName, setModName] = useState("Master Moderator");
  const [modDesig, setModDesig] = useState("Chief Analyst");
  const [eventTitle, setEventTitle] = useState("Global AI Summit 2026");
  const [topicTitle, setTopicTitle] = useState("Generative Models & The Future");
  const [theme, setTheme] = useState("default");

  const [bgImage, setBgImage] = useState(null);
  const [logoImage, setLogoImage] = useState(null);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef(""); // To accumulate finalize text

  const captureRef = useRef(null);

  const [apiKey, setApiKey] = useState("");

  const handleGenerateSummary = async () => {
    if (!transcript.trim()) {
      alert("Please provide some text to summarize.");
      return;
    }
    if (!apiKey.trim()) {
      alert("Please enter your Gemini API Key in the sidebar.");
      return;
    }
    setIsLoading(true);
    setSummary("");
    try {
      const response = await axios.post("http://localhost:5000/api/summary", { transcript, apiKey });
      setSummary(response.data.summary);
    } catch (err) {
      console.error(err);
      alert("Failed to generate summary: " + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  };


  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Speech Recognition API is not supported in this browser.");
      return;
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    transcriptRef.current = transcript;

    recognition.onresult = (e) => {
      let interim = "";
      let finalStr = transcriptRef.current;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalStr += e.results[i][0].transcript + " ";
          transcriptRef.current = finalStr;
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      setTranscript(finalStr + interim);
    };

    recognition.onerror = (e) => {
      console.error(e);
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) { }
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDemoText = () => {
    const txt = `Moderator: Welcome to the Web3 Summit. Today we're joined by Dr. Alan, a leading expert in Artificial Intelligence. Dr. Alan, how do you see generative AI impacting software development in the next 5 years?\n\nDr. Alan: Thank you. Generative AI will fundamentally shift the developer's role from writing boilerplate code to architecting systems and reviewing AI-generated logic. We'll see hyper-productivity, but it introduces challenges in code maintainability and security.\n\nModerator: That makes sense. What about the end-users? How will they interact with these systems?\n\nDr. Alan: End-users will experience deeply personalized software. Instead of rigid apps, we'll have adaptive interfaces that learn their preferences in real-time. Natural language will become the primary operating system interface.\n\nModerator: Fascinating. Any closing thoughts for the startups building in this space?\n\nDr. Alan: Focus on unique data moats. The base models are becoming commodities, so your competitive advantage will be the proprietary data you use to fine-tune these models for specific industry verticals.`;
    setTranscript(txt);
    transcriptRef.current = txt;
  };

  const handleBgUpload = (e) => { if (e.target.files?.[0]) setBgImage(URL.createObjectURL(e.target.files[0])); };
  const handleLogoUpload = (e) => { if (e.target.files?.[0]) setLogoImage(URL.createObjectURL(e.target.files[0])); };

  const downloadImage = async () => {
    if (captureRef.current) {
      const canvas = await html2canvas(captureRef.current, { scale: 2 });
      const link = document.createElement("a");
      link.download = `SummarIQ_${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const downloadPPT = () => {
    const pptx = new pptxgen();
    const slide = pptx.addSlide();
    slide.addText(eventTitle || "Event", { x: 0.5, y: 0.5, fontSize: 24, color: "6366f1" });
    slide.addText(summary, { x: 0.5, y: 1.5, w: 9, fontSize: 12 });
    pptx.writeFile({ fileName: `SummarIQ_${Date.now()}.pptx` });
  };

  return (
    <div className="app-layout" data-theme={theme}>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">🎙️</span>
          <h1 className="brand-name">SummarIQ <span className="gradient-text">PRO</span></h1>
        </div>

        <div className="nav-section">
          <span className="nav-label">Setup & Security</span>
          <div className="field">
            <label>Gemini API Key</label>
            <input
              type="password"
              placeholder="Enter your API Key..."
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />
            <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
              Key is sent securely to the local backend server.
            </div>
          </div>
        </div>

        <div className="nav-section">
          <span className="nav-label">Event Context</span>
          <div className="field">
            <label>Event Name</label>
            <input type="text" value={eventTitle} onChange={e => setEventTitle(e.target.value)} />
          </div>
          <div className="field">
            <label>Topic Title</label>
            <input type="text" value={topicTitle} onChange={e => setTopicTitle(e.target.value)} />
          </div>
        </div>

        <div className="nav-section">
          <span className="nav-label">Participants</span>
          <div className="field">
            <label>Moderator Name</label>
            <input type="text" value={modName} onChange={e => setModName(e.target.value)} />
          </div>
          <div className="field">
            <label>Moderator Designation</label>
            <input type="text" value={modDesig} onChange={e => setModDesig(e.target.value)} />
          </div>
        </div>

        <div className="nav-section">
          <span className="nav-label">Appearance (Uploads)</span>
          <div className="field">
            <label>Custom Background</label>
            <input type="file" accept="image/*" onChange={handleBgUpload} style={{ fontSize: "11px" }} />
          </div>
          <div className="field">
            <label>Company/Event Logo</label>
            <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ fontSize: "11px" }} />
          </div>

          <div className="theme-bar" style={{ padding: "10px", borderRadius: "12px", display: "flex", justifyContent: "space-around", marginTop: "10px" }}>
            <button className={`theme-btn ${theme === 'default' ? 'active' : ''}`} onClick={() => setTheme('default')}>🟣</button>
            <button className={`theme-btn ${theme === 'sunset' ? 'active' : ''}`} onClick={() => setTheme('sunset')}>🔴</button>
            <button className={`theme-btn ${theme === 'ocean' ? 'active' : ''}`} onClick={() => setTheme('ocean')}>🔵</button>
            <button className={`theme-btn ${theme === 'forest' ? 'active' : ''}`} onClick={() => setTheme('forest')}>🟢</button>
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className="workspace-header">
          <div className="status-group">
            <div className={`status-badge ${isListening ? 'listening' : ''}`} style={{ background: isListening ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.1)", color: isListening ? "#ef4444" : "var(--accent)" }}>
              {isListening ? 'Recording Live...' : 'Ready'}
            </div>
          </div>
          <div className="action-btns">
            <button className="btn btn-outline" style={{ borderColor: isListening ? "#ef4444" : "var(--border-color)", color: isListening ? "#ef4444" : "var(--text-main)" }} onClick={toggleListening}>
              🎙️ {isListening ? "Stop Mic" : "Start Mic"}
            </button>
            <button className="btn btn-primary" style={{ background: "var(--accent)" }} onClick={handleGenerateSummary}>
              ✨ AI Summary
            </button>
            <button className="btn btn-outline" onClick={handleDemoText}>🧪 Demo Text</button>
          </div>
        </header>

        <div className="workspace-content">
          <section className="transcript-panel">
            <span className="nav-label">Live Transcript</span>
            <textarea
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value);
                transcriptRef.current = e.target.value;
              }}
              placeholder="Live speech text will appear here..."
              style={{ flex: 1, background: "transparent", color: "white", border: "none", outline: "none", resize: "none" }}
            />
          </section>

          <section className="result-panel">
            <div className="preview-card-wrapper">
              <span className="nav-label">Result Preview</span>
              <div ref={captureRef} className="preview-card" style={{ flexWrap: "wrap", flexDirection: "row-reverse" }}>

                {/* Background Image Layer */}
                <div className="card-bg-overlay" style={{ backgroundImage: bgImage ? `url(${bgImage})` : "none" }}></div>

                {/* Optional Draggable Logo (simulated as absolute positioned) */}
                {logoImage && (
                  <div className="card-logo-box">
                    <img src={logoImage} alt="Event Logo" />
                  </div>
                )}

                <div className="card-right" style={{ width: "35%", zIndex: 1, background: "rgba(15, 23, 42, 0.3)", padding: 30, borderLeft: "1px solid rgba(255, 255, 255, 0.1)" }}>
                  <div className="badge" style={{ background: "var(--primary)", padding: "4px 8px", borderRadius: 4, fontSize: 10, fontWeight: 800, marginBottom: 12, display: "inline-block" }}>MODERATOR</div>
                  <div className="mini-photo" style={{ width: 60, height: 60, borderRadius: "50%", background: "gray", marginBottom: 10 }}></div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{modName}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 15 }}>{modDesig}</div>

                  <div style={{ marginTop: 20, paddingTop: 15, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                    <div style={{ fontWeight: 800, color: "white", fontSize: 14 }}>{eventTitle}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{topicTitle}</div>
                  </div>
                </div>

                <div className="card-left" style={{ width: "65%", padding: 30, zIndex: 1, display: "flex", flexDirection: "column" }}>
                  <span className="nav-label" style={{ color: "var(--primary)" }}>Insights Summary</span>
                  <div style={{ fontSize: 11, lineHeight: 1.6, color: "#e2e8f0", flex: 1 }}>
                    {isLoading ? (
                      <p style={{ fontStyle: "italic", opacity: 0.5 }}>AI Generating Insights...</p>
                    ) : summary ? (
                      <p style={{ textAlign: "justify" }}>{summary}</p>
                    ) : (
                      <p style={{ fontStyle: "italic", opacity: 0.5 }}>The AI-generated insights will appear here...</p>
                    )}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--text-dim)", marginTop: 10 }}>
                    <span>SummarIQ PRO — Live Analytics</span>
                    <span>{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button className="btn btn-outline" style={{ justifyContent: "center" }} onClick={downloadImage}>🖼️ PNG Image</button>
              <button className="btn btn-outline" style={{ justifyContent: "center" }} onClick={downloadPPT}>📊 PPT Slide</button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}