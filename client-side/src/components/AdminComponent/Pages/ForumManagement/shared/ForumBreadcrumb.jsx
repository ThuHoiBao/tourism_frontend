import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import styles from './shared.module.scss';

/**
 * Breadcrumb + nút quay về cho các trang admin forum.
 * @param {Array<{label:string, to?:string}>} items — item cuối là trang hiện tại (không có `to`)
 * @param {string} backTo — đường dẫn nút "Quay về" (mặc định /admin/forum)
 */
const ForumBreadcrumb = ({ items = [], backTo = '/admin/forum' }) => (
  <div className={styles.breadcrumbBar}>
    <Link to={backTo} className={styles.backBtn}>
      <ArrowLeft size={15} /> Quay về tổng quan
    </Link>
    <nav className={styles.breadcrumb}>
      {items.map((it, i) => (
        <span key={i} className={styles.crumbItem}>
          {it.to ? <Link to={it.to}>{it.label}</Link> : <span className={styles.crumbCurrent}>{it.label}</span>}
          {i < items.length - 1 && <ChevronRight size={13} className={styles.crumbSep} />}
        </span>
      ))}
    </nav>
  </div>
);

export default ForumBreadcrumb;
