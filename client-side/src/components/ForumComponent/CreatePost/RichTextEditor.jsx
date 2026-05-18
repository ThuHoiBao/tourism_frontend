import React, { useMemo, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from '../../../utils/axiosCustomize';
import styles from './RichTextEditor.module.scss';

const RichTextEditor = ({ value, onChange, placeholder = 'Viết nội dung...' }) => {
  const quillRef = useRef(null);

  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await axios.post('/upload/image', formData);
        const url = res.data.data.imageUrl; // URL từ Cloudinary

        const quill = quillRef.current.getEditor();
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, 'image', url);
        quill.setSelection(range.index + 1);
      } catch (err) {
        console.error('Upload ảnh thất bại:', err);
        alert('Không thể upload ảnh. Vui lòng thử lại.');
      }
    };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
  }), []);

  return (
    <div className={styles.editorContainer}>
      <ReactQuill
        ref={quillRef}
        value={value}
        onChange={onChange}
        modules={modules}
        formats={['header', 'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'align', 'link', 'image']}
        placeholder={placeholder}
        theme="snow"
      />
    </div>
  );
};

export default RichTextEditor;
