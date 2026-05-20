import React from 'react';
import { Layers, BookOpen, MessageSquare, Lightbulb, MapPin, Utensils, Globe, FolderOpen, Camera, Mountain, Plane, Coffee, Compass } from 'lucide-react';
import styles from './CategorySidebar.module.scss';

const ICON_MAP = {
  BookOpen,
  MessageSquare,
  Lightbulb,
  MapPin,
  Utensils,
  Globe,
  FolderOpen,
  Camera,
  Mountain,
  Plane,
  Coffee,
  Compass,
};

const CATEGORY_COLORS = [
  '#0369a1', '#f97316', '#10b981', '#f59e0b', '#0891b2', '#ef4444', '#0284c7', '#06b6d4', '#e11d48',
];

const CategorySidebar = ({
  categories = [],
  selectedCategory,
  onSelectCategory,
}) => {
  const handleCategoryClick = (categoryId) => {
    if (onSelectCategory) {
      onSelectCategory(categoryId === selectedCategory ? null : categoryId);
    }
  };

  const totalPosts = categories.reduce((sum, cat) => sum + (cat.postCount || 0), 0);

  const getIcon = (iconName) => ICON_MAP[iconName] || FolderOpen;

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Layers size={16} className={styles.headerIcon} />
          Danh mục
        </div>
        <span className={styles.count}>{categories.length + 1}</span>
      </div>

      <div className={styles.list}>
        <button
          className={`${styles.item} ${!selectedCategory ? styles.active : ''}`}
          onClick={() => handleCategoryClick(null)}
        >
          <span className={styles.iconBox} style={{ background: '#0ea5e918', color: '#0ea5e9' }}>
            <Globe size={14} />
          </span>
          <span className={styles.itemName}>Tất cả bài viết</span>
          {totalPosts > 0 && <span className={styles.itemCount}>{totalPosts}</span>}
        </button>

        {categories.map((category, idx) => {
          const Icon = getIcon(category.icon);
          const isActive = selectedCategory === category.categoryId;
          const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
          return (
            <button
              key={category.categoryId}
              className={`${styles.item} ${isActive ? styles.active : ''}`}
              onClick={() => handleCategoryClick(category.categoryId)}
            >
              <span className={styles.iconBox} style={{ background: `${color}18`, color }}>
                <Icon size={14} />
              </span>
              <span className={styles.itemName}>{category.name}</span>
              {category.postCount > 0 && (
                <span className={styles.itemCount}>{category.postCount}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategorySidebar;
