import React from 'react';
import styles from './TagCloud.module.scss';

const TagCloud = ({
  tags = [],
  selectedTag,
  onSelectTag,
  maxTags = 20  // tăng lên một chút để hiển thị nhiều hơn
}) => {
  const sortedTags = [...tags]
    .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
    .slice(0, maxTags);

  const maxUsage = Math.max(...sortedTags.map(t => t.usageCount || 1), 1);

  const getTagSize = (usageCount) => {
    const ratio = usageCount / maxUsage;
    if (ratio > 0.8) return 'xl';
    if (ratio > 0.6) return 'lg';
    if (ratio > 0.4) return 'md';
    if (ratio > 0.2) return 'sm';
    return 'xs';
  };

  const handleTagClick = (tagId) => {
    onSelectTag?.(tagId === selectedTag ? null : tagId);
  };

  return (
    <div className={styles.tagCloud}>
      <div className={styles.tagCloudHeader}>
        <h3 className={styles.tagCloudTitle}>Tags phổ biến</h3>
        <span className={styles.tagCloudCount}>{tags.length} tags</span>
      </div>

      <div className={styles.tagsContainer}>
        {sortedTags.length === 0 ? (
          <p className={styles.emptyText}>Chưa có tag nào</p>
        ) : (
          sortedTags.map(tag => {
            const size = getTagSize(tag.usageCount || 0);
            const isSelected = selectedTag === tag.tagId;

            return (
              <button
                key={tag.tagId}
                className={`${styles.tag} ${styles[`tag--${size}`]} ${isSelected ? styles.selected : ''}`}
                onClick={() => handleTagClick(tag.tagId)}
                title={`#${tag.tagName} • ${tag.usageCount || 0} bài viết`}
              >
                #{tag.tagName}
                <span className={styles.tagCount}>{tag.usageCount || 0}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TagCloud;
