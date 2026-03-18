import brain from "brain";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";

/**
 * Simple component that displays robots.txt content
 */
const Robots = () => {
  const [content, setContent] = useState("");

  useEffect(() => {
    // Fetch the robots.txt content
    const fetchRobots = async () => {
      try {
        const response = await brain.get_robots();
        const text = await response.text();
        setContent(text);
      } catch (error) {
        console.error("Error fetching robots:", error);
        setContent("Error loading robots.txt");
      }
    };
    
    fetchRobots();
    
    // Add content-type meta tag
    const meta = document.createElement("meta");
    meta.setAttribute("http-equiv", "Content-Type");
    meta.setAttribute("content", "text/plain; charset=utf-8");
    document.head.appendChild(meta);
    
    return () => {
      // Remove meta tag on unmount
      const metaTag = document.querySelector('meta[http-equiv="Content-Type"]');
      if (metaTag) {
        metaTag.remove();
      }
    };
  }, []);
  
  // Display content as pre-formatted text
  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <pre style={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
        {content}
      </pre>
    </>
  );
};

export default Robots;
