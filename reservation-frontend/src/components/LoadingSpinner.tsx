import React from "react";

interface LoadingSpinnerProps {
    message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = "読み込み中..."}) => {
    return (
        <div style={styles.container}>
            <div style={styles.spinner}></div>
            <p style={styles.message}>{message}</p>
        </div>
    );
};

const styles = {
    container: {
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        gap: "16px",
    },
    spinner: {
        border: "4px solid #f3f3f3",
        borderTop: "4px solid #3b82f6",
        borderRadius: "50%",
        width: "48px",
        height: "48px",
        animation: "spin 1s linear infinite",
    },
    message: {
        color: "#666",
        fontSize: "16px",
    },
};