import React, { useMemo, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import styles from './RichTextEditor.module.scss';

// Đưa formats ra ngoài để tránh re-render (như bài trước đã tối ưu)
const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'list', 'bullet',
  'indent',
  'align',
  'link'
];

const RichTextEditor = ({ value, onChange, placeholder, height = '200px' }) => {
  const quillRef = useRef(null);

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false 
    }
  }), []);

  // --- SỬA ĐỔI QUAN TRỌNG TẠI ĐÂY ---
  const handleChange = (content, delta, source, editor) => {
    // 1. Chặn vòng lặp: Chỉ xử lý khi thay đổi đến từ hành động của người dùng ('user')
    // Nếu source là 'api' (do React render lại) hoặc 'silent', ta bỏ qua.
    if (source !== 'user') return;

    let cleaned = content;
    
    // Logic clean HTML giữ nguyên
    if (content && content !== '<p><br></p>') {
      cleaned = content
        .replace(/(<br\s*\/?>){2,}/gi, '<br>')
        .replace(/(<br\s*\/?>)+(<\/(p|ul|ol|h[1-6]|div)>)/gi, '$2')
        .replace(/(<br\s*\/?>)+(<(p|ul|ol|h[1-6]|div))/gi, '$2')
        .replace(/<p>(&nbsp;|\s|<br\s*\/?>)*<\/p>/gi, '<p><br></p>');
    }
    
    // 2. Kiểm tra thêm: Chỉ gọi onChange nếu nội dung thực sự thay đổi so với props value
    // Điều này giúp tránh việc set state lại chính giá trị cũ
    if (cleaned !== value) {
        onChange(cleaned);
    }
  };

  return (
    <div className={styles.editorWrapper}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value || ''}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{ height }}
      />
    </div>
  );
};

export default RichTextEditor;