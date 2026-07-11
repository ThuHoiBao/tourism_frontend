import React, { useState, useRef, useEffect, useContext } from 'react';
import { X, Send, MoreVertical, History, PlusCircle, Trash2, ExternalLink } from 'lucide-react';
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

    let stopped = false;
    let started = false;

    const drawFrame = () => {
      if (stopped) return;
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

    // Bắt đầu phát + vòng vẽ (chỉ chạy 1 lần)
    const start = () => {
      if (started || stopped) return;
      started = true;
      video.play().catch(() => {});
      if ('requestVideoFrameCallback' in video) {
        video.requestVideoFrameCallback(drawFrame);
      } else {
        rafRef.current = requestAnimationFrame(drawFrame);
      }
    };

    // QUAN TRỌNG: khi quay lại trang, video đã được cache nên sự kiện 'loadeddata'
    // có thể đã bắn xong trước khi listener kịp gắn. Nếu video đã sẵn sàng thì chạy ngay,
    // đồng thời vẫn lắng nghe sự kiện cho trường hợp chưa tải xong.
    if (video.readyState >= 2) {
      start();
    } else {
      video.addEventListener('loadeddata', start);
      video.addEventListener('canplay', start);
      video.play().catch(() => {});
    }

    return () => {
      stopped = true;
      cancelAnimationFrame(rafRef.current);
      video.removeEventListener('loadeddata', start);
      video.removeEventListener('canplay', start);
    };
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
const STORAGE_THREADS_KEY = 'chatbot_threads_v1';
const STORAGE_ACTIVE_THREAD_KEY = 'chatbot_active_thread_id';

const createMessageId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const DEFAULT_WELCOME_TEXT = 'Xin chào! 👋\nMình là trợ lý du lịch ảo. Bạn đang muốn tìm tour đi đâu, hay cần tư vấn gì nè?';

const createWelcomeMessage = () => ({
  id: createMessageId(),
  sender: 'bot',
  text: DEFAULT_WELCOME_TEXT,
  timestamp: new Date().toISOString(),
});

const createSessionId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `session_${crypto.randomUUID()}`;
  }

  const randomPart = Math.random().toString(36).slice(2, 10);
  return `session_${Date.now()}_${randomPart}`;
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

const normalizeTimestamp = (timestamp) => {
  if (!timestamp) return new Date().toISOString();
  const dt = new Date(timestamp);
  return Number.isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();
};

const normalizeMessages = (messages) => {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((message) => message && (message.sender === 'user' || message.sender === 'bot'))
    .map((message) => ({
      ...message,
      id: message.id || createMessageId(),
      text: `${message.text || ''}`,
      timestamp: normalizeTimestamp(message.timestamp),
    }));
};

const trimThreadTitle = (value) => {
  const text = `${value || ''}`.trim().replace(/\s+/g, ' ');
  if (!text) return '';
  return text.length > 42 ? `${text.slice(0, 42)}...` : text;
};

const buildThreadTitle = (messages, createdAt) => {
  const safeMessages = normalizeMessages(messages);
  const firstUser = safeMessages.find((message) => message.sender === 'user' && `${message.text || ''}`.trim());
  if (firstUser) {
    const title = trimThreadTitle(firstUser.text);
    if (title) return title;
  }

  const dt = new Date(createdAt || Date.now());
  return `Cuộc trò chuyện ${dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
};

const createThread = ({ sessionId, messages, createdAt, id, title } = {}) => {
  const now = new Date().toISOString();
  const safeMessages = normalizeMessages(messages);
  const threadCreatedAt = normalizeTimestamp(createdAt || now);
  return {
    id: id || `thread_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    sessionId: sessionId || createSessionId(),
    messages: safeMessages.length > 0 ? safeMessages : [createWelcomeMessage()],
    title: trimThreadTitle(title) || buildThreadTitle(safeMessages, threadCreatedAt),
    createdAt: threadCreatedAt,
    updatedAt: normalizeTimestamp(now),
  };
};

const sanitizeThreads = (threads) => {
  if (!Array.isArray(threads)) return [];
  return threads
    .map((thread) => {
      const safeMessages = normalizeMessages(thread?.messages);
      const createdAt = normalizeTimestamp(thread?.createdAt || thread?.updatedAt || Date.now());
      const updatedAt = normalizeTimestamp(thread?.updatedAt || createdAt);
      const title = trimThreadTitle(thread?.title) || buildThreadTitle(safeMessages, createdAt);
      return {
        id: thread?.id || `thread_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        sessionId: thread?.sessionId || createSessionId(),
        messages: safeMessages.length > 0 ? safeMessages : [createWelcomeMessage()],
        title,
        createdAt,
        updatedAt,
      };
    })
    .filter(Boolean);
};

const sortThreadsByUpdatedAt = (threads) => {
  return [...threads].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
};

const getInitialThreadState = () => {
  try {
    const rawThreads = localStorage.getItem(STORAGE_THREADS_KEY);
    if (rawThreads) {
      const parsedThreads = sanitizeThreads(JSON.parse(rawThreads));
      if (parsedThreads.length > 0) {
        const savedActiveId = localStorage.getItem(STORAGE_ACTIVE_THREAD_KEY);
        const activeThreadId = parsedThreads.some((thread) => thread.id === savedActiveId)
          ? savedActiveId
          : parsedThreads[0].id;
        return { threads: parsedThreads, activeThreadId };
      }
    }
  } catch (_) {}

  try {
    const rawMessages = localStorage.getItem(STORAGE_MESSAGES_KEY);
    const legacyMessages = rawMessages ? normalizeMessages(JSON.parse(rawMessages)) : [];
    const safeLegacyMessages =
      legacyMessages.length > 0 && !hasBrokenVietnameseEncoding(legacyMessages)
        ? legacyMessages
        : [createWelcomeMessage()];

    const legacySessionId = localStorage.getItem(STORAGE_SESSION_KEY) || createSessionId();
    const migratedThread = createThread({
      sessionId: legacySessionId,
      messages: safeLegacyMessages,
      title: 'Cuộc trò chuyện hiện tại',
    });

    localStorage.setItem(STORAGE_THREADS_KEY, JSON.stringify([migratedThread]));
    localStorage.setItem(STORAGE_ACTIVE_THREAD_KEY, migratedThread.id);
    localStorage.removeItem(STORAGE_MESSAGES_KEY);
    localStorage.removeItem(STORAGE_SESSION_KEY);

    return {
      threads: [migratedThread],
      activeThreadId: migratedThread.id,
    };
  } catch (_) {
    const fallbackThread = createThread({
      messages: [createWelcomeMessage()],
      title: 'Cuộc trò chuyện mới',
    });
    return {
      threads: [fallbackThread],
      activeThreadId: fallbackThread.id,
    };
  }
};

const formatHistoryTime = (isoTime) => {
  const dt = new Date(isoTime || Date.now());
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
};

const ChatbotWidget = () => {
  const { user } = useContext(AuthContext);
  const initialThreadStateRef = useRef(null);
  if (!initialThreadStateRef.current) {
    initialThreadStateRef.current = getInitialThreadState();
  }
  const [isOpen, setIsOpen] = useState(false);
  const [threads, setThreads] = useState(initialThreadStateRef.current.threads);
  const [activeThreadId, setActiveThreadId] = useState(initialThreadStateRef.current.activeThreadId);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingThreadId, setLoadingThreadId] = useState(null);
  const [loadingText, setLoadingText] = useState(''); // State lưu câu thông báo loading
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [successToast, setSuccessToast] = useState('');
  // Trạng thái hiển thị bong bóng chat (hiện sau 1.2s khi trang load)
  const [bubbleVisible, setBubbleVisible] = useState(false);
  // Index câu chào hiện tại + key để re-trigger wave animation khi đổi câu
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [greetingKey,   setGreetingKey]   = useState(0);
  const [bubbleExiting, setBubbleExiting] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const inputRef = useRef(null);
  const actionMenuRef = useRef(null);
  const historyPanelRef = useRef(null);
  const toastTimerRef = useRef(null);

  const activeThread = threads.find((thread) => thread.id === activeThreadId) || threads[0] || null;
  const messages = activeThread?.messages || [];
  const sessionId = activeThread?.sessionId || '';
  const historyThreads = sortThreadsByUpdatedAt(threads);
  const showLoading = isLoading && loadingThreadId === activeThreadId;

  // Persist threads to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_THREADS_KEY, JSON.stringify(threads));
      if (activeThreadId) {
        localStorage.setItem(STORAGE_ACTIVE_THREAD_KEY, activeThreadId);
      }
      localStorage.removeItem(STORAGE_MESSAGES_KEY);
      localStorage.removeItem(STORAGE_SESSION_KEY);
    } catch (_) {
      // Khi chạm giới hạn localStorage, bỏ bớt thread cũ nhất để tránh vỡ widget.
      if (threads.length <= 1) return;
      const reduced = sortThreadsByUpdatedAt(threads).slice(0, Math.max(1, threads.length - 1));
      setThreads(reduced);
      if (!reduced.some((thread) => thread.id === activeThreadId)) {
        setActiveThreadId(reduced[0]?.id || null);
      }
    }
  }, [threads, activeThreadId]);

  useEffect(() => {
    if (!activeThread && threads.length > 0) {
      setActiveThreadId(threads[0].id);
    }
  }, [activeThread, threads]);

  // Nhảy tức thì (không animation) xuống tin nhắn mới nhất
  const scrollToBottom = (behavior = 'auto') => {
    const area = messagesAreaRef.current;
    if (area) {
      area.scrollTop = area.scrollHeight;
    }
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  };

  // Auto scroll mượt khi có tin nhắn mới hoặc đang loading (chỉ khi đang mở)
  useEffect(() => {
    if (isOpen) {
      scrollToBottom('smooth');
    }
  }, [messages, showLoading, isOpen]);

  // Khi mới mở chat: nhảy thẳng xuống tin nhắn cuối cùng (như Messenger),
  // không hiển thị đoạn cũ rồi mới cuộn. Chạy sau khi cửa sổ hiện xong.
  useEffect(() => {
    if (!isOpen) return;
    // Nhảy ngay lập tức + lặp lại sau khi animation mở cửa sổ hoàn tất
    scrollToBottom('auto');
    const raf = requestAnimationFrame(() => scrollToBottom('auto'));
    const t = setTimeout(() => scrollToBottom('auto'), 320);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [isOpen, activeThreadId]);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isActionMenuOpen && actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setIsActionMenuOpen(false);
      }

      if (
        isHistoryPanelOpen &&
        historyPanelRef.current &&
        !historyPanelRef.current.contains(event.target) &&
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target)
      ) {
        setIsHistoryPanelOpen(false);
      }
    };

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setIsActionMenuOpen(false);
        setIsHistoryPanelOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isActionMenuOpen, isHistoryPanelOpen]);

  const updateThreadMessages = (threadId, updater) => {
    setThreads((prevThreads) => {
      return prevThreads.map((thread) => {
        if (thread.id !== threadId) return thread;
        const nextMessages = updater(normalizeMessages(thread.messages));
        const nextUpdatedAt = new Date().toISOString();
        return {
          ...thread,
          messages: nextMessages,
          title: buildThreadTitle(nextMessages, thread.createdAt),
          updatedAt: nextUpdatedAt,
        };
      });
    });
  };

  const createNewThread = (title = 'Cuộc trò chuyện mới') => {
    const thread = createThread({
      title,
      messages: [createWelcomeMessage()],
    });
    setThreads((prevThreads) => [thread, ...prevThreads]);
    setActiveThreadId(thread.id);
    setInputValue('');
    setIsLoading(false);
    setLoadingThreadId(null);
    return thread;
  };

  const removeThread = (threadIdToDelete) => {
    setThreads((prevThreads) => {
      const remaining = prevThreads.filter((thread) => thread.id !== threadIdToDelete);
      if (remaining.length > 0) {
        const sorted = sortThreadsByUpdatedAt(remaining);
        if (activeThreadId === threadIdToDelete) {
          setActiveThreadId(sorted[0].id);
        }
        return remaining;
      }

      const fallback = createThread({
        title: 'Cuộc trò chuyện mới',
        messages: [createWelcomeMessage()],
      });
      setActiveThreadId(fallback.id);
      return [fallback];
    });
  };

  const handleSelectThread = (threadId) => {
    setActiveThreadId(threadId);
    setIsHistoryPanelOpen(false);
    setIsActionMenuOpen(false);
  };

  const showSuccessToast = (message) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setSuccessToast(message);
    toastTimerRef.current = setTimeout(() => {
      setSuccessToast('');
    }, 2200);
  };

  const openConfirmDialog = ({ title, message, onConfirm }) => {
    setConfirmDialog({
      open: true,
      title,
      message,
      onConfirm,
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });
  };

  const confirmDialogAction = () => {
    const action = confirmDialog.onConfirm;
    closeConfirmDialog();
    if (typeof action === 'function') {
      action();
    }
  };

  const handleStartNewConversation = () => {
    createNewThread('Cuộc trò chuyện mới');
    setIsActionMenuOpen(false);
    setIsHistoryPanelOpen(false);
  };

  const handleDeleteCurrentConversation = () => {
    if (!activeThread) return;
    const activeTitle = activeThread.title || 'Cuộc trò chuyện hiện tại';
    openConfirmDialog({
      title: 'Xóa cuộc trò chuyện?',
      message: `Bạn sắp xóa vĩnh viễn "${activeTitle}". Hành động này không thể hoàn tác.`,
      onConfirm: () => {
        removeThread(activeThread.id);
        setIsActionMenuOpen(false);
        setIsHistoryPanelOpen(false);
        showSuccessToast('Xóa thành công');
      },
    });
  };

  const handleDeleteThreadFromHistory = (event, threadId) => {
    event.stopPropagation();
    const targetThread = threads.find((thread) => thread.id === threadId);
    const targetTitle = targetThread?.title || 'cuộc trò chuyện này';
    openConfirmDialog({
      title: 'Xác nhận xóa lịch sử',
      message: `Xóa vĩnh viễn "${targetTitle}"?`,
      onConfirm: () => {
        removeThread(threadId);
        showSuccessToast('Xóa thành công');
      },
    });
  };

  const handleToggleActionMenu = () => {
    setIsActionMenuOpen((prev) => !prev);
  };

  const handleOpenHistoryPanel = () => {
    setIsHistoryPanelOpen(true);
    setIsActionMenuOpen(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !activeThread) return;

    const targetThreadId = activeThread.id;
    const targetSessionId = activeThread.sessionId;

    const userMessage = {
      id: createMessageId(),
      sender: 'user',
      text: inputValue,
      timestamp: new Date().toISOString(),
    };

    updateThreadMessages(targetThreadId, (prevMessages) => [...prevMessages, userMessage]);
    setInputValue('');
    
    // Bắt đầu trạng thái Loading
    setIsLoading(true);
    setLoadingThreadId(targetThreadId);
    // Random câu thông báo
    setLoadingText(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);

    try {
      const response = await fetch('http://localhost:8080/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.text,
          sessionId: targetSessionId,
          userId: user?.userId || user?.userID || null,
        }),
      });

      const data = await response.json();

      const botMessage = {
        id: createMessageId(),
        sender: 'bot',
        text: data.reply,
        timestamp: new Date().toISOString(),
        tourSuggestions: data.tourSuggestions || [],
        quickActions: data.quickActions || [],
        messageType: data.messageType || 'TEXT',
        bookingConfirmData: data.bookingConfirmData || null,
        orderDetail: data.orderDetail || null,
        bookingCode: data.bookingCode || null,
        paymentUrl: data.paymentUrl || null,
        paymentWaitingLink: data.paymentWaitingLink || null,
      };

      updateThreadMessages(targetThreadId, (prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Lỗi gửi tin nhắn:', error);
      updateThreadMessages(targetThreadId, (prevMessages) => [...prevMessages, {
        id: createMessageId(),
        sender: 'bot',
        text: 'Xin lỗi, hệ thống đang bận một chút. Bạn thử lại sau nhé! 😓',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
      setLoadingThreadId(null);
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
    } else if (action && action.startsWith('BOOK_TOUR_')) {
      const index = action.replace('BOOK_TOUR_', '');
      sendBotMessage('dat tour ' + index);
    } else if (action === 'VIEW_DEALS') {
      if (url) window.location.href = url;
      else sendBotMessage('tour nao dang giam gia');
    } else if (action === 'CALL_SUPPORT') {
      if (url) window.location.href = url;
    } else if (action === 'VIEW_FAVORITES' || action === 'VIEW_UPCOMING' || action === 'navigate') {
      if (url) window.location.href = url;
    } else if (action) {
      window.location.href = action;
    }
  };

  const sendBotMessage = async (text) => {
    if (!text || isLoading || !activeThread) return;
    const targetThreadId = activeThread.id;
    const targetSessionId = activeThread.sessionId;
    const userMsg = { id: createMessageId(), sender: 'user', text, timestamp: new Date().toISOString() };
    updateThreadMessages(targetThreadId, (prevMessages) => [...prevMessages, userMsg]);
    setIsLoading(true);
    setLoadingThreadId(targetThreadId);
    setLoadingText(LOADING_MESSAGES[0]);
    try {
      const response = await fetch('http://localhost:8080/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: targetSessionId, userId: user?.userId || user?.userID || null }),
      });
      const data = await response.json();
      updateThreadMessages(targetThreadId, (prevMessages) => [...prevMessages, {
        id: createMessageId(), sender: 'bot', text: data.reply, timestamp: new Date().toISOString(),
        tourSuggestions: data.tourSuggestions || [], quickActions: data.quickActions || [],
        messageType: data.messageType || 'TEXT',
        bookingConfirmData: data.bookingConfirmData || null,
        orderDetail: data.orderDetail || null,
        bookingCode: data.bookingCode || null,
        paymentUrl: data.paymentUrl || null,
        paymentWaitingLink: data.paymentWaitingLink || null,
      }]);
    } catch {
      updateThreadMessages(targetThreadId, (prevMessages) => [...prevMessages, {
        id: createMessageId(),
        sender: 'bot',
        text: 'Xin lỗi, hệ thống đang bận. Thử lại sau nhé!',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
      setLoadingThreadId(null);
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
          <div className={styles.headerActions} ref={actionMenuRef}>
            <button
              onClick={handleToggleActionMenu}
              className={styles.menuTriggerBtn}
              type="button"
              aria-label="Mở menu hành động chat"
            >
              <MoreVertical size={18} />
            </button>
            {isActionMenuOpen && (
              <div className={styles.actionMenu}>
                <button type="button" className={styles.actionMenuItem} onClick={handleOpenHistoryPanel}>
                  <History size={16} />
                  Lịch sử trò chuyện
                </button>
                <button type="button" className={styles.actionMenuItem} onClick={handleStartNewConversation}>
                  <PlusCircle size={16} />
                  Bắt đầu cuộc trò chuyện mới
                </button>
                <button type="button" className={`${styles.actionMenuItem} ${styles.destructiveItem}`} onClick={handleDeleteCurrentConversation}>
                  <Trash2 size={16} />
                  Xóa lịch sử trò chuyện
                </button>
              </div>
            )}
            <button onClick={() => { setIsOpen(false); setBubbleExiting(false); setBubbleVisible(true); }} className={styles.closeBtn} type="button">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className={styles.chatBody}>
          {isHistoryPanelOpen && (
            <aside className={styles.historyPanel} ref={historyPanelRef}>
              <div className={styles.historyHeader}>
                <span>Lịch sử chat</span>
                <button
                  type="button"
                  className={styles.historyCloseBtn}
                  onClick={() => setIsHistoryPanelOpen(false)}
                  aria-label="Đóng lịch sử trò chuyện"
                >
                  <X size={16} />
                </button>
              </div>
              <div className={styles.historyList}>
                {historyThreads.map((thread) => {
                  const lastMessage = thread.messages?.[thread.messages.length - 1];
                  const preview = trimThreadTitle(lastMessage?.text || 'Chưa có tin nhắn');
                  return (
                    <div
                      key={thread.id}
                      className={`${styles.historyItem} ${thread.id === activeThreadId ? styles.activeHistoryItem : ''}`}
                      onClick={() => handleSelectThread(thread.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleSelectThread(thread.id);
                        }
                      }}
                    >
                      <div className={styles.historyItemTop}>
                        <span className={styles.historyItemTitle}>{thread.title}</span>
                        <button
                          type="button"
                          className={styles.historyDeleteBtn}
                          onClick={(event) => handleDeleteThreadFromHistory(event, thread.id)}
                          aria-label="Xóa cuộc trò chuyện"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <span className={styles.historyPreview}>{preview}</span>
                      <span className={styles.historyTime}>{formatHistoryTime(thread.updatedAt)}</span>
                    </div>
                  );
                })}
                {historyThreads.length === 0 && (
                  <div className={styles.emptyHistory}>Chưa có cuộc trò chuyện nào.</div>
                )}
              </div>
            </aside>
          )}

          {/* Khu vực tin nhắn */}
          <div className={styles.messagesArea} ref={messagesAreaRef}>
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
                    {message.tourSuggestions.map((tour, idx) => {
                      const detailUrl = tour.detailUrl || (tour.tourCode ? `/tour/${tour.tourCode}` : null);
                      return (
                      <div
                        key={tour.tourId || idx}
                        className={styles.tourCard}
                        title={detailUrl ? `Xem chi tiết ${tour.tourName}` : tour.tourName}
                      >
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
                          <div className={styles.cardActions}>
                          {detailUrl && (
                            <button type="button" className={styles.cardDetailLink} onClick={() => { window.location.href = detailUrl; }}>
                              Xem chi tiết <ExternalLink size={12} />
                            </button>
                          )}
                            <button type="button" className={styles.cardBookBtn} onClick={() => sendBotMessage(`dat tour ${idx + 1}`)}>
                              Đặt tour
                            </button>
                          </div>
                        </div>
                      </div>
                    )})}
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
            {showLoading && (
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
        </div>

        {successToast && (
          <div className={styles.successToast} role="status" aria-live="polite">
            {successToast}
          </div>
        )}

        {confirmDialog.open && (
          <div className={styles.confirmOverlay} onClick={closeConfirmDialog}>
            <div className={styles.confirmDialog} onClick={(event) => event.stopPropagation()}>
              <h4>{confirmDialog.title}</h4>
              <p>{confirmDialog.message}</p>
              <div className={styles.confirmActions}>
                <button type="button" className={styles.confirmCancelBtn} onClick={closeConfirmDialog}>
                  Hủy
                </button>
                <button type="button" className={styles.confirmDeleteBtn} onClick={confirmDialogAction}>
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}

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
            disabled={!inputValue.trim() || isLoading || !activeThread}
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
