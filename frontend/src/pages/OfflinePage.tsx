import React from "react";
import { Helmet } from "react-helmet-async";

// Basic styling similar to the intended offline.html
const styles: { [key: string]: React.CSSProperties } = {
  body: {
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    backgroundColor: "#f8f9fa",
    color: "#343a40",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh", // Use minHeight for flexibility
    margin: 0,
    textAlign: "center",
    flexDirection: "column",
    padding: "1rem", // Add some padding for smaller screens
  },
  container: {
    padding: "2rem",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    maxWidth: "500px", // Limit width
    width: "90%",
  },
  h1: {
    color: "#801336", // Theme color
    marginBottom: "1rem",
    fontSize: "1.75rem",
  },
  p: {
    marginBottom: "1.5rem",
    fontSize: "1rem",
    lineHeight: "1.5",
  },
  small: {
    fontSize: "0.875rem",
    color: "#6c757d",
  },
  svg: {
    width: "50px",
    height: "50px",
    marginBottom: "1rem",
    fill: "#6c757d",
  },
};

// Note: This page should be marked as OPEN (no auth needed)
const OfflinePage: React.FC = () => {
  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div style={styles.body}>
        <div style={styles.container}>
          <svg
            style={styles.svg}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.41 0 8 3.59 8 8 0 1.85-.63 3.55-1.69 4.9z"></path>
          </svg>
          <h1 style={styles.h1}>You are Offline</h1>
          <p style={styles.p}>
            It looks like you're not connected to the internet. Please check your
            connection.
          </p>
          <p style={styles.small}>
            <small>Some features may be limited until you reconnect.</small>
          </p>
        </div>
      </div>
    </>
  );
};

export default OfflinePage;
