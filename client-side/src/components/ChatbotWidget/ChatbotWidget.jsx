import React, { useState, useRef, useEffect, useContext } from 'react';
import { X, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; 
import styles from './ChatbotWidget.module.scss';
import futureMark from '../../assets/brand/future-mark.svg';
import AuthContext from '../../context/AuthContext';
// eslint-disable-next-line import/no-webpack-loader-syntax
import mascotVideo from '../../assets/video/PixVerse_V6_Image_Text_540P_Static_camera_lock (2).mp4';
import BookingConfirmCard from './BookingConfirmCard';
import OrderDetailCard    from './OrderDetailCard';
import BookingSuccessCard from './BookingSuccessCard';

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
 *
 * Perf: process tại 180×180 (không phải 540×540) → giảm 9× pixel ops.
 * Dùng requestVideoFrameCallback khi browser hỗ trợ → chỉ render khi có frame mới.
 */
const PROCESS_SIZE = 180; // px — đủ sắc nét cho mascot 152×152 hiển thị

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

    // Cố định kích thước canvas ở mức nhỏ — CSS sẽ scale lên
    canvas.width  = PROCESS_SIZE;
    canvas.height = PROCESS_SIZE;

    const drawFrame = () => {
      if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, PROCESS_SIZE, PROCESS_SIZE);

        const imgData = ctx.getImageData(0, 0, PROCESS_SIZE, PROCESS_SIZE);
        const d = imgData.data;

        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          // Loại bỏ pixel teal/green-screen:
          if (g > 100 && b > 80 && g > r * 1.3 && b > r * 1.1 && g + b > r * 3) {
            d[i + 3] = 0; // transparent
          }
        }

        ctx.putImageData(imgData, 0, 0);
      }

      // requestVideoFrameCallback: chỉ render khi video có frame mới (24-30fps)
      // fallback sang rAF khi browser chưa hỗ trợ
      if ('requestVideoFrameCallback' in video) {
        video.requestVideoFrameCallback(drawFrame);
      } else {
        rafRef.current = requestAnimationFrame(drawFrame);
      }
    };

    video.addEventListener('loadeddata', () => {
      video.play().catch(() => {});
      if ('requestVideoFrameCallback' in video) {
        video.requestVideoFrameCallback(drawFrame);
      } else {
        rafRef.current = requestAnimationFrame(drawFrame);
      }
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

const STORAGE_MESSAGES_KEY = 'chatbot_messages';
const STORAGE_SESSION_KEY  = 'chatbot_session_id';

const createSessionId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `session_${crypto.randomUUID()}`;
  }

  const randomPart = Math.random().toString(36).slice(2, 10);
  return `session_${Date.now()}_${randomPart}`;
};

const DEFAULT_WELCOME = {
  id: 1,
  sender: 'bot',
  text: 'Xin chào! 👋\nMình là trợ lý du lịch ảo. Bạn đang muốn tìm tour đi đâu, hay cần tư vấn gì nè?',
  timestamp: new Date(),
};

const hasBrokenVietnameseEncoding = (messages) => {
  if (!Array.isArray(messages)) return false;
  return messages.some((message) => {
    const text = `${message?.text || ''}`;
    return /Ã|Â|Ä|Æ|�/.test(text);
  });
};

const localizePassengerEnums = (text) => {
  if (!text) return text;
  return String(text)
    .replace(/\bMALE\b/g, 'Nam')
    .replace(/\bFEMALE\b/g, 'Nữ')
    .replace(/\bOTHER\b/g, 'Khác')
    .replace(/\bADULT\b/g, 'Người lớn')
    .replace(/\bCHILD\b/g, 'Trẻ em')
    .replace(/\bTODDLER\b/g, 'Trẻ nhỏ')
    .replace(/\bINFANT\b/g, 'Em bé');
};

const ChatbotWidget = () => {
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MESSAGES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && !hasBrokenVietnameseEncoding(parsed)) return parsed;
        localStorage.removeItem(STORAGE_MESSAGES_KEY);
      }
    } catch (_) {}
    return [DEFAULT_WELCOME];
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState(''); // State lưu câu thông báo loading
  const [sessionId, setSessionId] = useState(() => {
    const saved = localStorage.getItem(STORAGE_SESSION_KEY);
    if (saved) return saved;
    const newId = createSessionId();
    localStorage.setItem(STORAGE_SESSION_KEY, newId);
    return newId;
  });
  // Trạng thái hiển thị bong bóng chat (hiện sau 1.2s khi trang load)
  const [bubbleVisible, setBubbleVisible] = useState(false);
  // Index câu chào hiện tại + key để re-trigger wave animation khi đổi câu
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [greetingKey,   setGreetingKey]   = useState(0);
  const [bubbleExiting, setBubbleExiting] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Persist messages to localStorage
  useEffect(() => {
    try {
      // Keep last 50 messages to avoid localStorage overflow
      const toSave = messages.slice(-50);
      localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(toSave));
    } catch (_) {}
  }, [messages]);

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
          userId: user?.userId || user?.userID || null,
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
        messageType: data.messageType || 'TEXT',
        bookingConfirmData: data.bookingConfirmData || null,
        orderDetail: data.orderDetail || null,
        bookingCode: data.bookingCode || null,
        paymentUrl: data.paymentUrl || null,
        paymentWaitingLink: data.paymentWaitingLink || null,
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

  const handleQuickAction = (quickAction) => {
    const action = typeof quickAction === 'string' ? quickAction : quickAction?.action;
    const url = typeof quickAction === 'object' ? quickAction?.url : null;
    if (action === 'CONFIRM_BOOKING') {
      sendBotMessage('Xác nhận');
    } else if (action === 'CANCEL') {
      sendBotMessage('Hủy');
    } else if (action === 'RESET_SEARCH') {
      sendBotMessage('Tìm lại tour khác');
    } else if (action === 'NEW_BOOKING') {
      sendBotMessage('Đặt tour mới');
    } else if (action === 'RESUME_BOOKING') {
      sendBotMessage('tiếp tục đặt tour');
    } else if (action === 'LOOKUP') {
      // Focus input để user nhập mã booking
      inputRef.current?.focus();
      setInputValue('BK');
    } else if (action && action.startsWith('LOOKUP_')) {
      const code = action.replace('LOOKUP_', '');
      sendBotMessage('tra cứu ' + code);
    } else if (action === 'VIEW_DEALS') {
      if (url) window.location.href = url;
      else sendBotMessage('tour nao dang giam gia');
    } else if (action === 'VIEW_FAVORITES' || action === 'VIEW_UPCOMING' || action === 'navigate') {
      if (url) window.location.href = url;
    } else if (action) {
      window.location.href = action;
    }
  };

  const sendBotMessage = async (text) => {
    if (!text || isLoading) return;
    const userMsg = { id: Date.now(), sender: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setLoadingText(LOADING_MESSAGES[0]);
    try {
      const response = await fetch('http://localhost:8080/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId, userId: user?.userId || user?.userID || null }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, {
        id: Date.now() + 1, sender: 'bot', text: data.reply, timestamp: new Date(),
        tourSuggestions: data.tourSuggestions || [], quickActions: data.quickActions || [],
        messageType: data.messageType || 'TEXT',
        bookingConfirmData: data.bookingConfirmData || null,
        orderDetail: data.orderDetail || null,
        bookingCode: data.bookingCode || null,
        paymentUrl: data.paymentUrl || null,
        paymentWaitingLink: data.paymentWaitingLink || null,
      }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: 'Xin lỗi, hệ thống đang bận. Thử lại sau nhé!', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    const ok = window.confirm('Bạn có muốn xóa toàn bộ hội thoại hiện tại và tạo phiên chat mới không?');
    if (!ok) return;

    localStorage.removeItem(STORAGE_MESSAGES_KEY);
    localStorage.removeItem(STORAGE_SESSION_KEY);

    const newId = createSessionId();
    localStorage.setItem(STORAGE_SESSION_KEY, newId);

    setSessionId(newId);
    setMessages([DEFAULT_WELCOME]);
    setInputValue('');
    setLoadingText('');
    setIsLoading(false);
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
          <div className={styles.headerActions}>
            <button onClick={handleResetChat} className={styles.resetBtn} type="button">
              Xóa chat
            </button>
            <button onClick={() => { setIsOpen(false); setBubbleExiting(false); setBubbleVisible(true); }} className={styles.closeBtn} type="button">
              <X size={20} />
            </button>
          </div>
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
                    {localizePassengerEnums(message.text)}
                  </ReactMarkdown>
                </div>

                {/* BOOKING_CONFIRM card */}
                {message.messageType === 'BOOKING_CONFIRM' && message.bookingConfirmData && (
                  <BookingConfirmCard
                    data={message.bookingConfirmData}
                    onConfirm={() => sendBotMessage('Xác nhận')}
                    onCancel={() => sendBotMessage('Hủy')}
                  />
                )}

                {/* ORDER_DETAIL card */}
                {message.messageType === 'ORDER_DETAIL' && message.orderDetail && (
                  <OrderDetailCard data={message.orderDetail} />
                )}

                {/* BOOKING_SUCCESS card */}
                {message.messageType === 'BOOKING_SUCCESS' && (() => {
                  // Prefer dedicated fields, fall back to parsing text
                  const code  = message.bookingCode
                    || (message.text && (message.text.match(/\*\*(BK[A-Za-z0-9]{8})\*\*/) || [])[1]);
                  const url   = message.paymentUrl
                    || (message.text && ((message.text.match(/\(https?:\/\/[^)]+payos[^)]*\)/) || [])[0] || '').replace(/[()]/g, ''));
                  const waitingLink = message.paymentWaitingLink || null;
                  return code
                    ? <BookingSuccessCard bookingCode={code} paymentUrl={url} paymentWaitingLink={waitingLink} />
                    : null;
                })()}

                {/* Tour suggestion cards */}
                {message.messageType === 'TOUR_SUGGESTIONS' && message.tourSuggestions && message.tourSuggestions.length > 0 && (
                  <div className={styles.tourGrid}>
                    {message.tourSuggestions.map((tour, idx) => (
                      <div key={tour.tourId || idx} className={styles.tourCard}>
                        <div className={styles.cardImage}>
                          <img
                            src={tour.imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&auto=format&fit=crop&q=60'}
                            alt={tour.tourName}
                          />
                        </div>
                        <div className={styles.cardInfo}>
                          <h4>{tour.tourName}</h4>
                          <div className={styles.cardMeta}>
                            {tour.duration && <span className={styles.duration}>⏱️ {tour.duration}</span>}
                            {tour.minPrice > 0 && <span className={styles.price}>{Number(tour.minPrice).toLocaleString('vi-VN')}₫</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Actions */}
                {message.quickActions && message.quickActions.length > 0 && (
                  <div className={styles.quickActions}>
                    {message.quickActions.map((action, idx) => (
                      <button
                        key={idx}
                        className={styles.actionBtn}
                        onClick={() => handleQuickAction(action)}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
                
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
