import React from "react";

export const Footer: React.FC = () => {
    return (
        <footer style={styles.footer}>
            <div style={styles.container}>
                <p style={styles.text}>
                    &copy; 2026 予約システム. All rights reserved.
                </p>
            </div>
        </footer>
    );
};

const styles = {
    footer: {
      borderTop: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb',
      marginTop: 'auto',
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px 16px',
      textAlign: 'center' as const,
    },
    text: {
      fontSize: '14px',
      color: '#6b7280',
    },
  };