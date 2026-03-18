import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, X, Send, HelpCircle, User, Mail } from 'lucide-react';
import brain from 'brain';
import { useLocation } from 'react-router-dom';
import { useCurrentUser } from 'app';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface QuickHelpTopic {
  title: string;
  description: string;
  questions: string[];
}

interface SupportChatResponse {
  response: string;
  suggestions: string[];
  escalate_to_support?: boolean;
  detected_language?: string;
}

export function FloatingSupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickHelp, setQuickHelp] = useState<QuickHelpTopic[]>([]);
  const [showQuickHelp, setShowQuickHelp] = useState(true);
  const [showEscalation, setShowEscalation] = useState(false);
  const [escalationForm, setEscalationForm] = useState({ name: '', email: '', issue: '' });
  const [lastResponse, setLastResponse] = useState<SupportChatResponse | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { user } = useCurrentUser();

  // Load quick help topics when component mounts
  useEffect(() => {
    loadQuickHelp();
  }, []);

  // Load chat history from session storage
  useEffect(() => {
    const savedMessages = sessionStorage.getItem('support-chat-history');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed);
        if (parsed.length > 0) {
          setShowQuickHelp(false);
        }
      } catch (e) {
        console.error('Failed to load chat history:', e);
      }
    }
  }, []);

  // Pre-fill escalation form with user data if available
  useEffect(() => {
    if (user && !escalationForm.name && !escalationForm.email) {
      setEscalationForm(prev => ({
        ...prev,
        name: user.displayName || '',
        email: user.email || ''
      }));
    }
  }, [user, escalationForm.name, escalationForm.email]);

  // Save chat history to session storage
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem('support-chat-history', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadQuickHelp = async () => {
    try {
      // Check if brain client method exists (handles development regeneration)
      if (typeof brain.get_quick_help !== 'function') {
        console.warn('Brain client method get_quick_help not available yet, using fallback');
        setQuickHelp([]);
        return;
      }
      
      const response = await brain.get_quick_help();
      const data = await response.json();
      setQuickHelp(data.topics || []);
    } catch (error) {
      console.error('Failed to load quick help:', error);
      // Fallback to empty array if loading fails
      setQuickHelp([]);
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setShowQuickHelp(false);
    setShowEscalation(false);

    try {
      const response = await brain.support_chat({
        message: messageText.trim(),
        current_page: location.pathname,
        chat_history: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp
        }))
      });

      const data: SupportChatResponse = await response.json();
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setLastResponse(data);
      
      // Show escalation option if suggested
      if (data.escalate_to_support) {
        setShowEscalation(true);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscalation = async () => {
    if (!escalationForm.name.trim() || !escalationForm.email.trim() || !escalationForm.issue.trim()) {
      alert('Please fill in all fields to contact support.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Prepare conversation context
      const conversationContext = messages.map(msg => 
        `${msg.role === 'user' ? 'User' : 'AI Assistant'}: ${msg.content}`
      ).join('\n\n');
      
      const response = await brain.escalate_to_support({
        user_name: escalationForm.name,
        user_email: escalationForm.email,
        conversation_context: conversationContext,
        current_issue: escalationForm.issue
      });
      
      const data = await response.json();
      
      const escalationMessage: ChatMessage = {
        role: 'assistant',
        content: data.success 
          ? data.message 
          : `I apologize, but I couldn't forward your request to support right now. ${data.message}`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, escalationMessage]);
      setShowEscalation(false);
      
      if (data.success) {
        // Reset escalation form
        setEscalationForm({ name: '', email: '', issue: '' });
      }
    } catch (error) {
      console.error('Failed to escalate to support:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'I apologize, but I couldn\'t connect you to support right now. Please try contacting us directly.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleQuestionClick = (question: string) => {
    sendMessage(question);
  };

  const clearChat = () => {
    setMessages([]);
    setShowQuickHelp(true);
    setShowEscalation(false);
    setLastResponse(null);
    sessionStorage.removeItem('support-chat-history');
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-20 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          aria-label="Open support chat"
          className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-600 hover:bg-blue-700 flex items-center justify-center"
        >
          <div className="relative">
            {/* Chat bubble using CSS */}
            <div className="w-6 h-5 bg-white rounded-lg relative">
              {/* Chat bubble tail */}
              <div className="absolute -bottom-1 left-1 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[4px] border-t-white"></div>
            </div>
          </div>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 right-6 z-50">
      <Card className="w-80 h-96 shadow-xl border-0 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            <span className="font-semibold">Support Chat</span>
          </div>
          <div className="flex gap-1">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="text-white hover:bg-blue-700 h-8 w-8 p-0"
              >
                <span className="text-xs">Clear</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-blue-700 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 flex flex-col h-80">
          <ScrollArea className="flex-1 p-4">
            {showQuickHelp && messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-3">
                  Hi! I'm here to help with Dicta-Notes. What can I assist you with?
                </p>
                
                {quickHelp.slice(0, 2).map((topic, index) => (
                  <div key={index} className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-800">{topic.title}</h4>
                    <div className="flex flex-wrap gap-1">
                      {topic.questions.slice(0, 2).map((question, qIndex) => (
                        <Badge
                          key={qIndex}
                          variant="outline"
                          className="cursor-pointer hover:bg-blue-50 text-xs py-1"
                          onClick={() => handleQuestionClick(question)}
                        >
                          {question}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg text-sm ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                
                {/* Escalation Form */}
                {showEscalation && !isLoading && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-3">
                    <p className="text-sm text-yellow-800 font-medium">
                      Would you like to speak with human support?
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="Your name"
                          value={escalationForm.name}
                          onChange={(e) => setEscalationForm(prev => ({ ...prev, name: e.target.value }))}
                          className="text-xs h-8"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="Your email"
                          type="email"
                          value={escalationForm.email}
                          onChange={(e) => setEscalationForm(prev => ({ ...prev, email: e.target.value }))}
                          className="text-xs h-8"
                        />
                      </div>
                      <Input
                        placeholder="Brief description of your issue"
                        value={escalationForm.issue}
                        onChange={(e) => setEscalationForm(prev => ({ ...prev, issue: e.target.value }))}
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleEscalation}
                        className="bg-yellow-600 hover:bg-yellow-700 text-xs h-7"
                      >
                        Contact Support
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowEscalation(false)}
                        className="text-xs h-7"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Show suggestions from last response */}
                {lastResponse?.suggestions && lastResponse.suggestions.length > 0 && !isLoading && (
                  <div className="flex flex-wrap gap-1">
                    {lastResponse.suggestions.map((suggestion, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer hover:bg-blue-50 text-xs py-1"
                        onClick={() => {
                          if (suggestion.toLowerCase().includes('human support') || 
                              suggestion.toLowerCase().includes('soporte humano') ||
                              suggestion.toLowerCase().includes('support humain') ||
                              suggestion.toLowerCase().includes('menschlichem support')) {
                            setShowEscalation(true);
                          } else {
                            handleQuestionClick(suggestion);
                          }
                        }}
                      >
                        {suggestion}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-3 rounded-lg rounded-bl-sm text-sm text-gray-600">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Input */}
          {!showEscalation && (
            <div className="p-4 border-t">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask me anything..."
                  disabled={isLoading}
                  className="flex-1 text-sm"
                />
                <Button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

