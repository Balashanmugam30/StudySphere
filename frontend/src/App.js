/**
 * StudySphere - Smart Study Partner with Agora Conversational AI
 */

import { useState, useEffect, useRef } from "react";
import "@/App.css";
import axios from "axios";
import { Upload, MessageCircle, FileText, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

const BACKEND_BASE = "https://studysphere-pr1v.onrender.com";

function App() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "ai",
      text: "Hello! I'm your AI study partner. Upload a PDF, chat with me, generate quizzes, or use Voice Mode!",
      timestamp: new Date(),
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  const recognitionRef = useRef(null);
  const scrollAreaRef = useRef(null);

  // Check speech recognition
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      setVoiceSupported(true);
      console.log("Speech Recognition Available");
    } else {
      console.warn("Speech Recognition Not Supported");
    }
  }, []);

  // -----------------------------
  // PDF UPLOAD TO BACKEND
  // -----------------------------
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a valid PDF");
      return;
    }

    setUploadedFile(file.name);
    toast.success("Uploading PDF...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${BACKEND_BASE}/upload_pdf`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(response.data.message);
    } catch (error) {
      toast.error("Failed to upload PDF");
      console.error(error);
    }
  };

  // -----------------------------
  // VOICE RECOGNITION MODE
  // -----------------------------
  const startVoiceMode = () => {
    if (!voiceSupported) {
      toast.error("Speech recognition not supported");
      return;
    }
    toast.success("Voice Mode Enabled!");
    setIsVoiceMode(true);
  };

  const stopVoiceMode = () => {
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsVoiceMode(false);
    setIsRecording(false);
    toast.info("Voice Mode Stopped");
  };

  // 🎤 Start Recording
  const startRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
      console.log("Recording started...");
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("User said:", transcript);
      setInputMessage(transcript);
      handleSendMessage(transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
      console.log("Recording stopped.");
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // -----------------------------
  // SEND TEXT OR VOICE MESSAGE TO BACKEND
  // -----------------------------
  const sendMessageToBackend = async (question) => {
    const url = `${BACKEND_BASE}/ask`;
    const response = await axios.post(url, { question });
    return response.data.answer;
  };

  // User pressed Send
  const handleSendMessage = async (forcedMessage = null) => {
    const msg = forcedMessage || inputMessage;
    if (!msg.trim()) return;

    const userMsg = {
      id: Date.now(),
      type: "user",
      text: msg,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const answer = await sendMessageToBackend(msg);

      const aiMessage = {
        id: Date.now() + 1,
        type: "ai",
        text: answer,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "ai",
          text: "❌ Backend error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------
  // QUIZ BUTTON
  // -----------------------------
  const handleTestMe = async () => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), type: "user", text: "Generate quiz", timestamp: new Date() },
    ]);

    setIsLoading(true);
    try {
      const response = await axios.post(`${BACKEND_BASE}/quiz`, {});
      const aiMessage = {
        id: Date.now() + 1,
        type: "ai",
        text: response.data.answer,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      toast.error("Quiz generation failed");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    try {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    } catch {}
  }, [messages]);

  return (
    <div className="app-container">
      {/* LEFT PANEL */}
      <div className="left-panel">
        <h1 className="app-title">
          <FileText className="title-icon" /> StudySphere
        </h1>
        <p className="app-subtitle">Your AI Study Partner</p>

        {/* PDF Upload Section */}
        <div className="upload-card">
          <Upload className="upload-icon" />
          <h3>Upload Study Materials</h3>
          <p>Upload your PDF notes to get started</p>

          <label htmlFor="pdf-upload">
            <Button onClick={() => document.getElementById("pdf-upload").click()}>
              <Upload className="w-4 h-4 mr-2" />
              Choose PDF File
            </Button>
          </label>

          <input id="pdf-upload" type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />

          {uploadedFile && (
            <div className="uploaded-file">
              <FileText className="w-4 h-4" /> {uploadedFile}
            </div>
          )}
        </div>

        {/* Voice Mode */}
        {!isVoiceMode ? (
          <Button onClick={startVoiceMode} disabled={!voiceSupported}>
            <Mic className="w-4 h-4 mr-2" />
            Voice Mode
          </Button>
        ) : (
          <div className="voice-controls">
            <Button onClick={stopVoiceMode}>
              <MicOff className="w-4 h-4 mr-2" /> Stop Voice Mode
            </Button>

            {!isRecording ? (
              <Button onClick={startRecording}>
                <Mic className="w-4 h-4 mr-2" /> Start Recording
              </Button>
            ) : (
              <div className="recording-indicator">
                <div className="recording-dot"></div> Recording...
              </div>
            )}
          </div>
        )}

        <Button onClick={handleTestMe}>
          <MessageCircle className="w-4 h-4 mr-2" /> Test Me
        </Button>

        <div className="agora-footer">Powered by Agora Conversational AI</div>
      </div>

      {/* RIGHT PANEL - CHAT */}
      <div className="right-panel">
        <div className="chat-header">
          <MessageCircle className="w-6 h-6" />
          <h2>Chat with AI</h2>
        </div>

        {/* CHAT MESSAGES */}
        <ScrollArea className="chat-messages" ref={scrollAreaRef}>
          {messages.map((m) => (
            <div key={m.id} className={`message-wrapper ${m.type}`}>
              <div className={`message-bubble ${m.type}`}>
                {m.text}
                <div className="message-time">
                  {m.timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message-wrapper ai">
              <div className="message-bubble ai loading">Typing...</div>
            </div>
          )}
        </ScrollArea>

        {/* INPUT BOX */}
        <div className="chat-input-container">
          <Input
            type="text"
            placeholder="Ask something..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <Button onClick={() => handleSendMessage()}>Send</Button>
        </div>
      </div>
    </div>
  );
}

export default App;
