import { useState } from 'react';
import '@/App.css';
import axios from 'axios';
import { Upload, MessageCircle, FileText } from 'lucide-react';
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
      text: 'Hello! I\'m your AI study partner. Upload your PDF notes and chat with me, or click "Test Me" to generate quiz questions!',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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
      </div>

      {/* Right Panel - Chat */}
      <div className="right-panel" data-testid="right-panel">
        <div className="chat-header">
          <MessageCircle className="w-6 h-6" />
          <h2 className="chat-title">Chat with AI</h2>
        </div>

        <ScrollArea className="chat-messages" data-testid="chat-messages">
          <div className="messages-container">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message-wrapper ${message.type}`}
                data-testid={`message-${message.type}`}
              >
                <div className={`message-bubble ${message.type}`}>
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
