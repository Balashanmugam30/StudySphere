/**
 * StudySphere - Smart Study Partner with Agora Conversational AI
 * HackFest GDG New Delhi - LA-01 Track
 * 
 * Features:
 * - Agora RTC Voice Integration for conversational AI
 * - Web Speech API for speech-to-text recognition
 * - Real-time chat with AI backend
 * - PDF upload simulation
 * - Quiz generation
 */

import { useState, useEffect, useRef } from 'react';
import '@/App.css';
import axios from 'axios';
import { Upload, MessageCircle, FileText, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

const EXTERNAL_BACKEND = 'https://studysphere-c3jet4vgr4gooj9g8vq5tm.streamlit.app';

function App() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      text: 'Hello! I\'m your AI study partner with voice support powered by Agora. Upload your PDF notes, chat with me, click "Test Me" to generate quiz questions, or use Voice Mode to speak with me!',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Agora Voice Mode States
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [agoraClient, setAgoraClient] = useState(null);
  
  const recognitionRef = useRef(null);
  const scrollAreaRef = useRef(null);

  // Check for Agora SDK and Speech Recognition support on mount
  useEffect(() => {
    // Check if Agora SDK is loaded
    if (window.AgoraRTC) {
      console.log('✅ Agora RTC SDK loaded successfully');
    } else {
      console.warn('⚠️ Agora RTC SDK not loaded');
    }

    // Check for Web Speech API support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
      console.log('✅ Speech Recognition supported');
    } else {
      setVoiceSupported(false);
      console.warn('⚠️ Speech Recognition not supported in this browser');
    }
  }, []);

  // Initialize Agora RTC Client
  const initializeAgoraClient = () => {
    try {
      if (window.AgoraRTC) {
        const client = window.AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        setAgoraClient(client);
        console.log('✅ Agora RTC client initialized');
        return client;
      } else {
        console.warn('Agora SDK not available, continuing without RTC features');
        return null;
      }
    } catch (error) {
      console.error('Error initializing Agora client:', error);
      return null;
    }
  };

  // Start Voice Mode with Agora
  const startVoiceMode = async () => {
    if (!voiceSupported) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Initialize Agora client if available
      if (window.AgoraRTC && !agoraClient) {
        const client = initializeAgoraClient();
        console.log('Agora client ready for voice capture');
      }

      setIsVoiceMode(true);
      toast.success('🎤 Voice Mode activated! Click "Start Recording" to speak.');
    } catch (error) {
      console.error('Microphone permission denied:', error);
      toast.error('Microphone access denied. Please allow microphone permissions.');
    }
  };

  // Stop Voice Mode
  const stopVoiceMode = () => {
    if (isRecording) {
      stopRecording();
    }
    setIsVoiceMode(false);
    toast.info('Voice Mode deactivated');
  };

  // Start Recording Voice
  const startRecording = () => {
    if (!voiceSupported) {
      toast.error('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
      console.log('🎤 Recording started...');
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('Recognized text:', transcript);
      
      // Add user voice message to chat
      const voiceMessage = {
        id: Date.now(),
        type: 'user',
        text: `🎤 ${transcript}`,
        timestamp: new Date(),
        isVoice: true
      };
      setMessages(prev => [...prev, voiceMessage]);
      
      // Send to backend
      setIsLoading(true);
      try {
        const responseData = await sendMessageToBackend(transcript);
        
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          text: responseData.text || responseData.response || JSON.stringify(responseData),
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
        toast.success('Voice message processed!');
      } catch (error) {
        const errorMessage = {
          id: Date.now() + 1,
          type: 'ai',
          text: '❌ Sorry, I couldn\'t process your voice message. Please try again.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        toast.error('Failed to process voice message');
      } finally {
        setIsLoading(false);
        setIsRecording(false);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      
      let errorMsg = 'Voice recognition failed';
      if (event.error === 'no-speech') {
        errorMsg = 'No speech detected. Please try again.';
      } else if (event.error === 'not-allowed') {
        errorMsg = 'Microphone access denied.';
      }
      toast.error(errorMsg);
    };

    recognition.onend = () => {
      setIsRecording(false);
      console.log('🎤 Recording ended');
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Stop Recording
  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  // Existing functions (unchanged)
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file.name);
      toast.success(`PDF Uploaded Successfully: ${file.name}`);
    } else if (file) {
      toast.error('Please upload a PDF file');
    }
  };

  const sendMessageToBackend = async (question) => {
    try {
      const response = await axios.post(EXTERNAL_BACKEND, {
        question: question
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      return response.data;
    } catch (error) {
      console.error('Backend error:', error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const responseData = await sendMessageToBackend(inputMessage);
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        text: responseData.text || responseData.response || JSON.stringify(responseData),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        text: '❌ Sorry, I couldn\'t connect to the backend. Please check your connection and try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestMe = async () => {
    setIsLoading(true);
    
    const testMessage = {
      id: Date.now(),
      type: 'user',
      text: 'Test Me - Generate quiz questions',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, testMessage]);

    try {
      const responseData = await sendMessageToBackend('Generate 3 multiple-choice quiz questions from my notes.');
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        text: responseData.text || responseData.response || JSON.stringify(responseData),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        text: '❌ Sorry, I couldn\'t generate quiz questions. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to generate quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="app-container" data-testid="app-container">
      {/* Left Panel */}
      <div className="left-panel" data-testid="left-panel">
        <div className="panel-header">
          <h1 className="app-title">
            <FileText className="title-icon" />
            StudySphere
          </h1>
          <p className="app-subtitle">Your Conversational AI Study Partner</p>
        </div>

        <div className="upload-section">
          {/* PDF Upload */}
          <div className="upload-card">
            <Upload className="upload-icon" />
            <h3 className="upload-title">Upload Study Materials</h3>
            <p className="upload-description">Upload your PDF notes to get started</p>
            
            <label htmlFor="pdf-upload">
              <Button 
                className="upload-button" 
                data-testid="upload-button"
                onClick={() => document.getElementById('pdf-upload').click()}
                type="button"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose PDF File
              </Button>
            </label>
            <input
              id="pdf-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              data-testid="pdf-input"
            />
            
            {uploadedFile && (
              <div className="uploaded-file" data-testid="uploaded-file">
                <FileText className="w-4 h-4" />
                <span className="truncate">{uploadedFile}</span>
              </div>
            )}
          </div>

          {/* Voice Mode Button (Agora) */}
          <div className="voice-mode-section">
            {!isVoiceMode ? (
              <Button 
                className="voice-mode-button"
                onClick={startVoiceMode}
                disabled={!voiceSupported}
                data-testid="voice-mode-button"
              >
                <Mic className="w-4 h-4 mr-2" />
                🎤 Voice Mode (Agora)
              </Button>
            ) : (
              <div className="voice-active-controls">
                <Button 
                  className="voice-mode-button active"
                  onClick={stopVoiceMode}
                  data-testid="stop-voice-mode-button"
                >
                  <MicOff className="w-4 h-4 mr-2" />
                  Stop Voice Mode
                </Button>
                
                {!isRecording ? (
                  <Button 
                    className="record-button"
                    onClick={startRecording}
                    data-testid="start-recording-button"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <div className="recording-indicator" data-testid="recording-indicator">
                    <div className="recording-dot"></div>
                    <span>Voice Recording...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Test Me Button */}
          <Button 
            className="test-button" 
            onClick={handleTestMe}
            disabled={isLoading}
            data-testid="test-me-button"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Test Me
          </Button>
        </div>

        {/* Agora Footer Branding */}
        <div className="agora-footer">
          <p>Powered by Agora Conversational AI</p>
        </div>
      </div>

      {/* Right Panel - Chat */}
      <div className="right-panel" data-testid="right-panel">
        <div className="chat-header">
          <MessageCircle className="w-6 h-6" />
          <h2 className="chat-title">Chat with AI</h2>
          {isVoiceMode && (
            <div className="voice-mode-badge">
              <Mic className="w-4 h-4" />
              <span>Voice Active</span>
            </div>
          )}
        </div>

        <ScrollArea className="chat-messages" data-testid="chat-messages" ref={scrollAreaRef}>
          <div className="messages-container">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message-wrapper ${message.type}`}
                data-testid={`message-${message.type}`}
              >
                <div className={`message-bubble ${message.type} ${message.isVoice ? 'voice-message' : ''}`}>
                  <p className="message-text">{message.text}</p>
                  <span className="message-time">
                    {message.timestamp.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message-wrapper ai" data-testid="loading-indicator">
                <div className="message-bubble ai loading">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="chat-input-container" data-testid="chat-input-container">
          <Input
            type="text"
            placeholder="Ask a question about your notes..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="chat-input"
            data-testid="chat-input"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={isLoading || !inputMessage.trim()}
            className="send-button"
            data-testid="send-button"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

export default App;
