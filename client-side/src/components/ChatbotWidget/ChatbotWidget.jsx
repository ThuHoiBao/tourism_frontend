import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; 
import styles from './ChatbotWidget.module.scss';

// Danh sách câu thông báo chờ đợi thân thiện
const LOADING_MESSAGES = [
  "Mình đang tìm kiếm, đợi mình một xíu nhé...",
];

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Xin chào! 👋\nMình là trợ lý du lịch ảo. Bạn đang muốn tìm tour đi đâu, hay cần tư vấn gì nè?',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState(''); // State lưu câu thông báo loading
  const [sessionId] = useState(`session_${Date.now()}`);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll xuống cuối khi có tin nhắn mới hoặc đang loading
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto focus vào input khi mở chat
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    
    // Bắt đầu trạng thái Loading
    setIsLoading(true);
    // Random câu thông báo
    setLoadingText(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);

    try {
      const response = await fetch('http://localhost:8080/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.text,
          sessionId: sessionId,
          userId: null,
        }),
      });

      const data = await response.json();

      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: data.reply,
        timestamp: new Date(),
        tourSuggestions: data.tourSuggestions || [],
        quickActions: data.quickActions || [],
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Lỗi gửi tin nhắn:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: 'Xin lỗi, hệ thống đang bận một chút. Bạn thử lại sau nhé! 😓',
        timestamp: new Date(),
      }]);
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

  const handleQuickAction = (url) => {
    if (url) {
      window.location.href = url;
    }
  };

  return (
    <div className={`${styles.widgetContainer} ${isOpen ? styles.open : ''}`}>
      
      {/* Nút Mở Chat */}
      <button 
        className={`${styles.launcher} ${isOpen ? styles.hideLauncher : ''}`}
        onClick={() => setIsOpen(true)}
      >
        <MessageCircle size={28} />
        <span className={styles.pulse}></span>
      </button>

      {/* Cửa Sổ Chat */}
      <div className={`${styles.chatWindow} ${isOpen ? styles.showWindow : ''}`}>
        
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <div className={styles.avatarWrapper}>
              <Sparkles size={18} />
            </div>
            <div>
              <h3>Trợ lý du lịch</h3>
              <span className={styles.status}>● Đang hoạt động</span>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        {/* Khu vực tin nhắn */}
        <div className={styles.messagesArea}>
          {messages.map((message) => (
            <div key={message.id} className={`${styles.messageRow} ${message.sender === 'user' ? styles.userRow : styles.botRow}`}>
              
              {message.sender === 'bot' && <div className={styles.botAvatar}><MessageCircle size={16}/></div>}
              
              <div className={styles.messageContent}>
                <div className={styles.bubble}>
                  <ReactMarkdown
                    components={{
                      a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer" className={styles.tourLink}>
                          {children}
                        </a>
                      )
                    }}
                  >
                    {message.text}
                  </ReactMarkdown>
                </div>
                
                {/* Gợi ý Tour (Cards) */}
                {/* {message.tourSuggestions && message.tourSuggestions.length > 0 && (
                  <div className={styles.tourGrid}>
                    {message.tourSuggestions.map((tour) => (
                      <a key={tour.tourId} href={tour.detailUrl} className={styles.tourCard}>
                        <div className={styles.cardImage}>
                          <img 
                            src={tour.imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&auto=format&fit=crop&q=60'} 
                            alt={tour.tourName} 
                          />
                        </div>
                        <div className={styles.cardInfo}>
                          <h4>{tour.tourName}</h4>
                          <div className={styles.cardMeta}>
                            <span className={styles.duration}>
                              <Calendar size={12}/> {tour.duration}
                            </span>
                            <span className={styles.price}>
                              {tour.minPrice?.toLocaleString('vi-VN')}₫
                            </span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )} */}

                {/* Quick Actions */}
                {/* {message.quickActions && message.quickActions.length > 0 && (
                  <div className={styles.quickActions}>
                    {message.quickActions.map((action, idx) => (
                      <button 
                        key={idx} 
                        className={styles.actionBtn}
                        onClick={() => handleQuickAction(action.url)}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )} */}
                
                <span className={styles.timestamp}>
                  {new Date(message.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {/* Hiệu ứng Loading đẹp & Thân thiện */}
          {isLoading && (
            <div className={`${styles.messageRow} ${styles.botRow}`}>
              <div className={styles.botAvatar}><MessageCircle size={16}/></div>
              <div className={styles.loadingContainer}>
                <div className={styles.typingIndicator}>
                  <span></span><span></span><span></span>
                </div>
                <span className={styles.loadingText}>{loadingText}</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={styles.inputArea}>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập câu hỏi..."
            rows={1}
          />
          <button 
            onClick={handleSendMessage} 
            disabled={!inputValue.trim() || isLoading}
            className={styles.sendBtn}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotWidget;