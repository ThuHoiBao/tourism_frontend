import React from 'react';
import styles from './ForumLayout.module.scss';

const ForumLayout = ({
  children,
  leftSidebar = true,
  rightSidebar = true,
  leftSidebarContent = null,
  rightSidebarContent = null
}) => {
  return (
    <div className={styles.forumLayout}>
      <div className={styles.forumContainer}>
        {leftSidebar && leftSidebarContent && (
          <aside className={styles.forumLeftSidebar}>
            {leftSidebarContent}
          </aside>
        )}

        <main className={styles.forumMain}>
          {children}
        </main>

        {rightSidebar && rightSidebarContent && (
          <aside className={styles.forumRightSidebar}>
            {rightSidebarContent}
          </aside>
        )}
      </div>
    </div>
  );
};

export default ForumLayout;
