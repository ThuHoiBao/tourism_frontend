import React, { useState, useEffect } from 'react';
import {
  Tag, Palmtree, Heart, Home, Coins, Waves, Crown,
  Backpack, Camera, Mountain, Flower2, Globe, Snowflake,
  Sun, Leaf, Music2, Bike, UtensilsCrossed, Sunset, Compass
} from 'lucide-react';
import axios from '../../../utils/axiosCustomize';
import styles from './TagCloud.module.scss';

// Map tag name keywords → { icon, color }
const TAG_CONFIG = [
  { keywords: ['văn hóa', 'culture', 'lịch sử'],      icon: Globe,           color: '#7c3aed' },
  { keywords: ['honeymoon', 'tình nhân', 'lãng mạn'],  icon: Heart,           color: '#e11d48' },
  { keywords: ['gia đình', 'family'],                   icon: Home,            color: '#0369a1' },
  { keywords: ['tiết kiệm', 'budget', 'rẻ'],           icon: Coins,           color: '#b45309' },
  { keywords: ['biển', 'đảo', 'beach', 'sea'],         icon: Waves,           color: '#0891b2' },
  { keywords: ['sang trọng', 'luxury', 'cao cấp'],     icon: Crown,           color: '#d97706' },
  { keywords: ['bụi', 'phượt', 'backpack'],            icon: Backpack,        color: '#7c3aed' },
  { keywords: ['chụp ảnh', 'photo', 'photography'],    icon: Camera,          color: '#db2777' },
  { keywords: ['núi', 'rừng', 'mountain', 'trekking'], icon: Mountain,        color: '#059669' },
  { keywords: ['mùa xuân', 'spring'],                  icon: Flower2,         color: '#ec4899' },
  { keywords: ['solo', 'một mình'],                    icon: Compass,         color: '#0284c7' },
  { keywords: ['mùa đông', 'winter'],                  icon: Snowflake,       color: '#0ea5e9' },
  { keywords: ['mùa hè', 'summer'],                    icon: Sun,             color: '#f59e0b' },
  { keywords: ['mùa thu', 'autumn', 'fall'],           icon: Leaf,            color: '#ea580c' },
  { keywords: ['âm nhạc', 'music', 'lễ hội'],         icon: Music2,          color: '#8b5cf6' },
  { keywords: ['xe đạp', 'cycling', 'bike'],           icon: Bike,            color: '#16a34a' },
  { keywords: ['ẩm thực', 'food', 'đồ ăn'],           icon: UtensilsCrossed, color: '#dc2626' },
  { keywords: ['hoàng hôn', 'sunset', 'sunrise'],      icon: Sunset,          color: '#f97316' },
  { keywords: ['nhiệt đới', 'tropical', 'palm'],       icon: Palmtree,        color: '#10b981' },
];

function getTagConfig(tagName) {
  const lower = tagName.toLowerCase();
  for (const cfg of TAG_CONFIG) {
    if (cfg.keywords.some(kw => lower.includes(kw))) {
      return cfg;
    }
  }
  return null;
}

const TagCloud = ({ selectedTag, onSelectTag }) => {
  const [tags, setTags] = useState([]);

  useEffect(() => {
    axios.get('/forum/tags/popular', { params: { limit: 20 } })
      .then(res => setTags(res.data?.data || []))
      .catch(() => {});
  }, []);

  if (!tags.length) return null;

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <Tag size={16} className={styles.headerIcon} />
        <span className={styles.title}>Tag phổ biến</span>
        <span className={styles.count}>{tags.length}</span>
      </div>
      <div className={styles.body}>
        {tags.map(tag => {
          const id = tag.tagId || tag.tagID;
          const isSelected = selectedTag === id;
          const cfg = getTagConfig(tag.tagName || '');
          const IconComp = cfg ? cfg.icon : Tag;
          const color = cfg ? cfg.color : '#059669';

          return (
            <button
              key={id}
              className={`${styles.tag} ${isSelected ? styles.selected : ''}`}
              onClick={() => onSelectTag?.(isSelected ? null : id)}
              title={`#${tag.tagName} • ${tag.usageCount || 0} bài viết`}
              style={isSelected ? {} : { '--tag-color': color }}
            >
              <IconComp size={14} className={styles.tagIcon} style={isSelected ? {} : { color }} />
              <span className={styles.tagName}>{tag.tagName}</span>
              <span className={styles.tagCount}>{tag.usageCount || 0}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TagCloud;
