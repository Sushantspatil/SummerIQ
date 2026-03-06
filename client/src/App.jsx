
import { useState, useRef, useCallback } from "react";
import axios from "axios";
import html2canvas from "html2canvas";
import pptxgen from "pptxgenjs";

export default function App() {
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [moderator, setModerator] = useState({ name: "Master Moderator", designation: "Chief Analyst", photo: null });
  const [speakers, setSpeakers] = useState([]);
  const [eventTitle, setEventTitle] = useState("Global AI Summit 2026");
  const [topicTitle, setTopicTitle] = useState("Generative Models & The Future");
  const [theme, setTheme] = useState("default");
  const [bgImage, setBgImage] = useState(null);
  const [logoImage, setLogoImage] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");
  const captureRef = useRef(null);
  const [apiKey, setApiKey] = useState("");
  const [selectedLang, setSelectedLang] = useState("en-US");

  const languages = [
    { code: "en-US", name: "English" },
    { code: "hi-IN", name: "Hindi (हिन्दी)" },
    { code: "mr-IN", name: "Marathi (मराठी)" },
    { code: "hi-IN", name: "Mixed (Hindi + English + Marathi)" },
  ];

  // ── Draggable Logo State ─────────────────────────────────────
  const [logoPos, setLogoPos] = useState({ x: 10, y: 10 });
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, logoX: 0, logoY: 0 });

  const handleLogoDragStart = useCallback((e) => {
    e.preventDefault();
    draggingRef.current = true;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      logoX: logoPos.x,
      logoY: logoPos.y,
    };
    const onMove = (me) => {
      if (!draggingRef.current) return;
      const dx = me.clientX - dragStartRef.current.mouseX;
      const dy = me.clientY - dragStartRef.current.mouseY;
      setLogoPos({ x: dragStartRef.current.logoX + dx, y: dragStartRef.current.logoY + dy });
    };
    const onUp = () => {
      draggingRef.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [logoPos]);

  const handleGenerateSummary = async () => {
    if (!transcript.trim()) {
      alert("Please provide some text to summarize.");
      return;
    }
    setIsLoading(true);
    setSummary("");
    try {
      const response = await axios.post("http://localhost:5000/api/summary", { transcript, apiKey });
      setSummary(response.data.summary);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.error || err.message;
      const details = err.response?.data?.details;
      alert(`Error: ${errorMsg}${details ? `\n\nDetails: ${details}` : ""}`);
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
    if (!SR) { alert("Speech Recognition not supported in this browser."); return; }
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = selectedLang;
    transcriptRef.current = transcript;
    recognition.onresult = (e) => {
      let interim = "";
      let finalStr = transcriptRef.current;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) { finalStr += e.results[i][0].transcript + " "; transcriptRef.current = finalStr; }
        else interim += e.results[i][0].transcript;
      }
      setTranscript(finalStr + interim);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => { if (isListening && recognitionRef.current) { try { recognitionRef.current.start(); } catch (e) { } } };
    try { recognition.start(); recognitionRef.current = recognition; setIsListening(true); } catch (err) { console.error(err); }
  };

  const handleDemoText = () => {
    const txt = `Moderator: Welcome to the Web3 Summit. Today we're joined by Dr. Alan, a leading expert in Artificial Intelligence. Dr. Alan, how do you see generative AI impacting software development in the next 5 years?\n\nDr. Alan: Thank you. Generative AI will fundamentally shift the developer's role from writing boilerplate code to architecting systems and reviewing AI-generated logic. We'll see hyper-productivity, but it introduces challenges in code maintainability and security.\n\nModerator: That makes sense. What about the end-users? How will they interact with these systems?\n\nDr. Alan: End-users will experience deeply personalized software. Instead of rigid apps, we'll have adaptive interfaces that learn their preferences in real-time. Natural language will become the primary operating system interface.\n\nModerator: Fascinating. Any closing thoughts for the startups building in this space?\n\nDr. Alan: Focus on unique data moats. The base models are becoming commodities, so your competitive advantage will be the proprietary data you use to fine-tune these models for specific industry verticals.`;
    setTranscript(txt);
    transcriptRef.current = txt;
  };

  const handleBgUpload = (e) => { if (e.target.files?.[0]) setBgImage(URL.createObjectURL(e.target.files[0])); };
  const handleLogoUpload = (e) => { if (e.target.files?.[0]) { setLogoImage(URL.createObjectURL(e.target.files[0])); setLogoPos({ x: 10, y: 10 }); } };

  const handleAddSpeaker = () => { if (speakers.length < 10) setSpeakers([...speakers, { id: Date.now(), name: "", designation: "", photo: null }]); };
  const handleRemoveSpeaker = (id) => { setSpeakers(speakers.filter(s => s.id !== id)); };
  const handleSpeakerChange = (id, field, value) => { setSpeakers(speakers.map(s => s.id === id ? { ...s, [field]: value } : s)); };
  const handleSpeakerPhotoUpload = (e, id) => { if (e.target.files?.[0]) handleSpeakerChange(id, 'photo', URL.createObjectURL(e.target.files[0])); };
  const handleModeratorChange = (field, value) => { setModerator({ ...moderator, [field]: value }); };
  const handleModeratorPhotoUpload = (e) => { if (e.target.files?.[0]) setModerator({ ...moderator, photo: URL.createObjectURL(e.target.files[0]) }); };

  const downloadImage = async () => {
    if (captureRef.current) {
      // scale:4 for high-quality, crisp PNG output
      const canvas = await html2canvas(captureRef.current, {
        scale: 4,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });
      const link = document.createElement("a");
      link.download = `SummarIQ_${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
    }
  };

  const downloadPPT = async () => {
    if (!captureRef.current) return;

    // Capture the exact same card as PNG
    const canvas = await html2canvas(captureRef.current, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
    });

    const imgData = canvas.toDataURL("image/png", 1.0);

    // Embed as full 16:9 slide — identical to the PNG export
    const pptx = new pptxgen();
    pptx.layout = "LAYOUT_WIDE"; // 13.33" × 7.5" widescreen
    const slide = pptx.addSlide();
    slide.addImage({ data: imgData, x: 0, y: 0, w: "100%", h: "100%" });
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
          <span className="nav-label">Setup &amp; Security</span>
          <div className="field">
            <label>AI Provider Key <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></label>
            <input
              type="password"
              placeholder="sk-... or AIza... (or leave blank)"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />
            <small style={{ color: '#aaa', fontSize: '11px', marginTop: '5px', display: 'block' }}>
              Leave blank to use local summarization — no API needed!
            </small>
          </div>
          <div className="field" style={{ marginTop: '15px' }}>
            <label>Recording Language</label>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                color: 'white',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code} style={{ background: '#1e293b' }}>
                  {lang.name}
                </option>
              ))}
            </select>
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
          <span className="nav-label">Moderator Profile</span>
          <div className="speaker-field-group" style={{ padding: "12px", background: "rgba(99, 102, 241, 0.05)", borderRadius: "8px", border: "1px solid rgba(99, 102, 241, 0.1)" }}>
            <div className="field">
              <label>Moderator Name</label>
              <input type="text" value={moderator.name} onChange={e => handleModeratorChange('name', e.target.value)} placeholder="Full Name" />
            </div>
            <div className="field">
              <label>Designation</label>
              <input type="text" value={moderator.designation} onChange={e => handleModeratorChange('designation', e.target.value)} placeholder="Title" />
            </div>
            <div className="field">
              <label>Photo</label>
              <input type="file" accept="image/*" onChange={handleModeratorPhotoUpload} style={{ fontSize: "11px" }} />
            </div>
          </div>
        </div>

        <div className="nav-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span className="nav-label">Additional Speakers ({speakers.length}/10)</span>
            {speakers.length < 10 && (
              <button className="btn btn-primary" onClick={handleAddSpeaker} style={{ padding: "4px 8px", fontSize: "10px" }}>+ Add</button>
            )}
          </div>

          <div className="speakers-list" style={{ maxHeight: "300px", overflowY: "auto", paddingRight: "5px" }}>
            {speakers.map((speaker, index) => (
              <div key={speaker.id} className="speaker-field-group" style={{ marginBottom: "20px", padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--accent)" }}>Speaker {index + 1}</span>
                  <button onClick={() => handleRemoveSpeaker(speaker.id)} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "10px" }}>Remove</button>
                </div>
                <div className="field">
                  <label>Full Name</label>
                  <input type="text" value={speaker.name} onChange={e => handleSpeakerChange(speaker.id, 'name', e.target.value)} placeholder="Enter name" />
                </div>
                <div className="field">
                  <label>Designation</label>
                  <input type="text" value={speaker.designation} onChange={e => handleSpeakerChange(speaker.id, 'designation', e.target.value)} placeholder="Enter title" />
                </div>
                <div className="field">
                  <label>Photo</label>
                  <input type="file" accept="image/*" onChange={e => handleSpeakerPhotoUpload(e, speaker.id)} style={{ fontSize: "11px" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="nav-section">
          <span className="nav-label">Appearance (Uploads)</span>
          <div className="field">
            <label>Custom Background</label>
            <input type="file" accept="image/*" onChange={handleBgUpload} style={{ fontSize: "11px" }} />
          </div>
          <div className="field">
            <label>Company/Event Logo <span style={{ color: "var(--text-muted)", fontSize: 10 }}>(drag inside card)</span></label>
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
            <button className="btn btn-primary" style={{ background: "var(--accent)" }} onClick={handleGenerateSummary} disabled={isLoading}>
              {isLoading ? "⏳ Generating..." : "✨ AI Summary"}
            </button>
            <button className="btn btn-outline" onClick={handleDemoText}>🧪 Demo Text</button>
          </div>
        </header>

        <div className="workspace-content">
          <section className="transcript-panel">
            <span className="nav-label">Live Transcript</span>
            <textarea
              value={transcript}
              onChange={(e) => { setTranscript(e.target.value); transcriptRef.current = e.target.value; }}
              placeholder="Live speech text will appear here..."
              style={{ flex: 1, background: "transparent", color: "white", border: "none", outline: "none", resize: "none" }}
            />
          </section>

          <section className="result-panel">
            <div className="preview-card-wrapper">
              <span className="nav-label">Result Preview</span>
              <div ref={captureRef} className="preview-card" style={{ position: "relative", flexWrap: "wrap", flexDirection: "row-reverse", overflow: "hidden" }}>

                {/* Background Image Layer */}
                <div className="card-bg-overlay" style={{ backgroundImage: bgImage ? `url(${bgImage})` : "none" }}></div>

                {/* ── Draggable Logo ── */}
                {logoImage && (
                  <div
                    className="card-logo-box"
                    style={{
                      position: "absolute",
                      left: logoPos.x,
                      top: logoPos.y,
                      zIndex: 10,
                      cursor: "grab",
                      userSelect: "none",
                    }}
                    onMouseDown={handleLogoDragStart}
                  >
                    <img src={logoImage} alt="Event Logo" style={{ maxWidth: 80, maxHeight: 80, objectFit: "contain", display: "block" }} />
                  </div>
                )}

                {/* Right Panel — Moderator + Speakers */}
                <div className="card-right" style={{ width: "35%", zIndex: 1, background: "rgba(15, 23, 42, 0.45)", padding: "20px", borderLeft: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", gap: "10px", overflow: "hidden" }}>

                  {(moderator.name || moderator.designation || moderator.photo) && (
                    <div className="moderator-card" style={{ background: "rgba(99, 102, 241, 0.15)", padding: "12px", borderRadius: "12px", border: "1px solid rgba(99, 102, 241, 0.3)", marginBottom: "5px", flexShrink: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div className="mini-photo" style={{ width: 55, height: 55, borderRadius: "50%", background: moderator.photo ? `url(${moderator.photo}) center/cover no-repeat` : "#334155", flexShrink: 0, border: "2px solid var(--primary)" }}></div>
                        <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{moderator.name || "TBA"}</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{moderator.designation || "Host"}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="speakers-grid" style={{ display: "flex", flexDirection: "column", gap: "8px", overflow: "hidden" }}>
                    {speakers.filter(s => s.name || s.designation || s.photo).map((speaker) => (
                      <div key={speaker.id} style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.03)", padding: "8px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
                        <div className="mini-photo" style={{ width: 35, height: 35, borderRadius: "50%", background: speaker.photo ? `url(${speaker.photo}) center/cover no-repeat` : "#334155", flexShrink: 0, border: "1px solid var(--accent)" }}></div>
                        <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
                          <div style={{ fontWeight: 600, fontSize: 12, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{speaker.name || "Speaker"}</div>
                          <div style={{ fontSize: 9, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{speaker.designation}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.1)", overflow: "hidden" }}>
                    <div style={{ fontWeight: 800, color: "white", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{eventTitle}</div>
                    <div style={{ fontSize: 9, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{topicTitle}</div>
                  </div>
                </div>

                {/* Left Panel — Summary */}
                <div className="card-left" style={{ width: "65%", padding: 30, zIndex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <span className="nav-label" style={{ color: "var(--primary)" }}>Insights Summary</span>
                  <div style={{ fontSize: 11, lineHeight: 1.7, color: "#e2e8f0", flex: 1, overflowY: "auto" }}>
                    {isLoading ? (
                      <p style={{ fontStyle: "italic", opacity: 0.5 }}>AI Generating Insights...</p>
                    ) : summary ? (
                      <p style={{ textAlign: "justify", margin: 0 }}>{summary}</p>
                    ) : (
                      <p style={{ fontStyle: "italic", opacity: 0.5 }}>The AI-generated insights will appear here...</p>
                    )}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--text-dim)", marginTop: 10, flexShrink: 0 }}>
                    <span>SummarIQ PRO — Live Analytics</span>
                    <span>{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Summary Editor ── */}
            {summary && (
              <div style={{ marginTop: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", letterSpacing: "0.04em", textTransform: "uppercase" }}>✏️ Edit Summary</span>
                  <button
                    className="btn btn-primary"
                    style={{ padding: "4px 12px", fontSize: 11, background: isEditingSummary ? "#10b981" : "var(--accent)" }}
                    onClick={() => setIsEditingSummary(v => !v)}
                  >
                    {isEditingSummary ? "✅ Done" : "✏️ Edit"}
                  </button>
                </div>

                {isEditingSummary && (
                  <>
                    {/* Quick-clean action buttons */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                      <button
                        className="btn btn-outline"
                        style={{ fontSize: 10, padding: "3px 10px" }}
                        onClick={() => setSummary(s => s.replace(/,/g, ""))}
                      >Remove Commas (,)</button>
                      <button
                        className="btn btn-outline"
                        style={{ fontSize: 10, padding: "3px 10px" }}
                        onClick={() => setSummary(s => s.replace(/\?/g, ""))}
                      >Remove Question Marks (?)</button>
                      <button
                        className="btn btn-outline"
                        style={{ fontSize: 10, padding: "3px 10px" }}
                        onClick={() => setSummary(s => s.replace(/  +/g, " ").trim())}
                      >Remove Extra Spaces</button>
                      <button
                        className="btn btn-outline"
                        style={{ fontSize: 10, padding: "3px 10px" }}
                        onClick={() => setSummary(s => s.replace(/\.(?=[^\s])/g, ". "))}
                      >Fix Missing Spaces After .</button>
                      <button
                        className="btn btn-outline"
                        style={{ fontSize: 10, padding: "3px 10px", color: "#ef4444", borderColor: "#ef4444" }}
                        onClick={() => setSummary(s => s.replace(/[,?]/g, "").replace(/  +/g, " ").trim())}
                      >🧹 Clean All</button>
                    </div>

                    {/* Editable textarea */}
                    <textarea
                      value={summary}
                      onChange={e => setSummary(e.target.value)}
                      rows={6}
                      style={{
                        width: "100%",
                        background: "rgba(255,255,255,0.05)",
                        color: "#e2e8f0",
                        border: "1px solid rgba(99,102,241,0.4)",
                        borderRadius: 8,
                        padding: "10px 12px",
                        fontSize: 12,
                        lineHeight: 1.65,
                        resize: "vertical",
                        outline: "none",
                        fontFamily: "inherit",
                        boxSizing: "border-box",
                      }}
                    />
                  </>
                )}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
              <button className="btn btn-outline" style={{ justifyContent: "center" }} onClick={downloadImage}>🖼️ PNG Image</button>
              <button className="btn btn-outline" style={{ justifyContent: "center" }} onClick={downloadPPT}>📊 PPT Slide</button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}