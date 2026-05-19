import React, { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; 
import styles from './ChatbotWidget.module.scss';
import futureMark from '../../assets/brand/future-mark.svg';
// eslint-disable-next-line import/no-webpack-loader-syntax
import mascotVideo from '../../assets/video/PixVerse_V6_Image_Text_540P_Static_camera_lock (2).mp4';

// Danh sách câu thông báo chờ đợi thân thiện
const LOADING_MESSAGES = [
  "Mình đang tìm kiếm, đợi mình một xíu nhé...",
];

// Các câu chào xoay vòng trong speech bubble (tự động chuyển sau 3.5s)
const GREETING_MESSAGES = [
  'Chào mừng bạn đến với Future Travel! 👋',
  'Bạn muốn đi du lịch đâu? Hãy kể cho tôi nghe nhé! ✈️',
  'Tôi có thể tư vấn các chuyến đi giá tốt nhất của Future Travel cho bạn! 🌏',
  'Hãy cho tôi về chuyến đi mà bạn muốn trải nghiệm tại Future Travel nhé! 🏖️',
];
/**
 * ChromaKeyCanvas — xử lý green-screen real-time bằng Canvas API.
 * Mỗi frame video được vẽ lên canvas, sau đó các pixel "teal/xanh lá"
 * bị set alpha = 0 (trong suốt), chỉ giữ lại nhân vật mascot.
 * Hoạt động với video nền xanh (chroma key) không cần convert sang WebM alpha.
 */
const ChromaKeyCanvas = ({ src, className }) => {
  const canvasRef = useRef(null);
  const videoRef  = useRef(null);
  const rafRef    = useRef(null);

  useEffect(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // willReadFrequently giúp Chrome tối ưu getImageData()
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const drawFrame = () => {
      if (video.readyState >= 2) {
        // Đồng bộ kích thước canvas với video
        const vw = video.videoWidth  || 540;
        const vh = video.videoHeight || 540;
        if (canvas.width !== vw || canvas.height !== vh) {
          canvas.width  = vw;
          canvas.height = vh;
        }

        ctx.drawImage(video, 0, 0, vw, vh);

        const imgData = ctx.getImageData(0, 0, vw, vh);
        const d = imgData.data;

        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          // Loại bỏ pixel teal/green-screen:
          // Điều kiện: kênh G chiếm ưu thế, B trung bình cao → nền teal xanh
          if (g > 100 && b > 80 && g > r * 1.3 && b > r * 1.1 && g + b > r * 3) {
            d[i + 3] = 0; // transparent
          }
        }

        ctx.putImageData(imgData, 0, 0);
      }
      rafRef.current = requestAnimationFrame(drawFrame);
    };

    video.addEventListener('loadeddata', () => {
      video.play().catch(() => {});
      rafRef.current = requestAnimationFrame(drawFrame);
    });

    return () => cancelAnimationFrame(rafRef.current);
  }, [src]);

  return (
    <>
      {/* Video ẩn — chỉ dùng làm nguồn frame */}
      <video
        ref={videoRef}
        src={src}
        loop
        muted
        playsInline
        style={{ display: 'none' }}
      />
      {/* Canvas hiển thị với nền trong suốt */}
      <canvas
        ref={canvasRef}
        className={className}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </>
  );
};

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
  // Trạng thái hiển thị bong bóng chat (hiện sau 1.2s khi trang load)
  const [bubbleVisible, setBubbleVisible] = useState(false);
  // Index câu chào hiện tại + key để re-trigger wave animation khi đổi câu
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [greetingKey,   setGreetingKey]   = useState(0);
  const [bubbleExiting, setBubbleExiting] = useState(false);

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

  // Hiện bong bóng chat sau 1.2s khi trang load
  useEffect(() => {
    const timer = setTimeout(() => setBubbleVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Xoay vòng: hiện 3.5s → mờ dần biến mất 1.5s → câu tiếp theo fade-in
  useEffect(() => {
    if (!bubbleVisible) return;
    const exitTimerRef = { current: null };
    const showTimer = setTimeout(() => {
      setBubbleExiting(true); // bắt đầu fade-out
      exitTimerRef.current = setTimeout(() => {
        setGreetingIndex(prev => (prev + 1) % GREETING_MESSAGES.length);
        setGreetingKey(prev => prev + 1);
        setBubbleExiting(false); // fade-in câu mới
      }, 1500);
    }, 3500);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(exitTimerRef.current);
    };
  }, [bubbleVisible, greetingKey]); // greetingKey thay đổi → effect chạy lại → chu kỳ tiếp

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
      
      {/* Mascot + Bong bóng chat */}
      <div className={`${styles.mascotContainer} ${isOpen ? styles.hideMascot : ''}`}>
        {/* Bong bóng tin nhắn — fade-out 1.5s rồi đổi câu tiếp theo */}
        <div className={`${styles.speechBubble} ${bubbleVisible ? styles.bubbleVisible : ''} ${bubbleExiting ? styles.bubbleExiting : ''}`}>
          <p className={styles.bubbleText} key={greetingKey}>
            {GREETING_MESSAGES[greetingIndex]}
          </p>
        </div>

        {/* Nút mascot video */}
        <button
          className={styles.launcher}
          onClick={() => { setIsOpen(true); setBubbleVisible(false); setBubbleExiting(false); }}
          aria-label="Mở trợ lý du lịch"
        >
          {/* Canvas chroma-key — tự động loại bỏ nền xanh green-screen */}
          <ChromaKeyCanvas
            src={mascotVideo}
            className={styles.mascotVideo}
          />
        </button>
      </div>

      {/* Cửa Sổ Chat */}
      <div className={`${styles.chatWindow} ${isOpen ? styles.showWindow : ''}`}>
        
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <div className={styles.avatarWrapper}>
              <img src={futureMark} alt="" className={styles.brandAvatar} />
            </div>
            <div>
              <h3>Trợ lý du lịch</h3>
              <span className={styles.status}>● Đang hoạt động</span>
            </div>
          </div>
          <button onClick={() => { setIsOpen(false); setBubbleExiting(false); setBubbleVisible(true); }} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        {/* Khu vực tin nhắn */}
        <div className={styles.messagesArea}>
          {messages.map((message) => (
            <div key={message.id} className={`${styles.messageRow} ${message.sender === 'user' ? styles.userRow : styles.botRow}`}>
              
              {message.sender === 'bot' && (
                <div className={styles.botAvatar}>
                  <img src={futureMark} alt="" className={styles.brandAvatar} />
                </div>
              )}
              
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
              <div className={styles.botAvatar}>
                <img src={futureMark} alt="" className={styles.brandAvatar} />
              </div>
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
