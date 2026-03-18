import React from "react";
import { LegalPageLayout } from "components/LegalPageLayout";
import { BackButton } from "components/BackButton";
import { useNavigate } from "react-router-dom";

export default function CookiePolicy() {
  const navigate = useNavigate();
  const pageTitle = "Cookie Policy";
  const metaDescription = "Understand how Dicta-Notes uses cookies to enhance your experience. Our Cookie Policy explains the types of cookies used and how to manage them.";

  return (
    <LegalPageLayout 
      title={pageTitle}
      metaDescription={metaDescription}
    >
      <BackButton />
      <section>
        <h2>1. Introduction</h2>
        <p>Last updated: April 1, 2025</p>
        <p>
          This Cookie Policy explains how Dicta-Notes ("we", "us", or "our") uses cookies and similar 
          technologies on our website and application. It explains what these technologies are and why 
          we use them, as well as your rights to control our use of them.
        </p>
      </section>

      <section>
        <h2>2. What Are Cookies?</h2>
        <p>
          Cookies are small text files that are stored on your device when you visit a website. They are 
          widely used to make websites work more efficiently and provide information to the owners of 
          the site. Cookies can be "persistent" or "session" cookies. Persistent cookies remain on your 
          device after you close your browser until they expire or you delete them. Session cookies are 
          deleted from your device once you close your browser.
        </p>
      </section>

      <section>
        <h2>3. Types of Cookies We Use</h2>
        <p>We use the following types of cookies:</p>
        
        <h3>Essential Cookies</h3>
        <p>
          These cookies are necessary for the website to function properly. They enable basic functions 
          like page navigation, secure areas of the website, and access to certain features. The website 
          cannot function properly without these cookies.
        </p>
        
        <h3>Analytics Cookies</h3>
        <p>
          These cookies help us understand how visitors interact with our website by collecting and reporting 
          information anonymously. This helps us improve our website and services.
        </p>
        
        <h3>Functional Cookies</h3>
        <p>
          These cookies enable enhanced functionality and personalization, such as remembering your preferences 
          and settings. They may be set by us or by third-party providers whose services we have added to our pages.
        </p>
        
        <h3>Performance Cookies</h3>
        <p>
          These cookies collect information about how you use our website, like which pages you visited and which 
          links you clicked on. None of this information can be used to identify you. Their sole purpose is to 
          improve website functions.
        </p>
      </section>

      <section>
        <h2>4. Third-Party Cookies</h2>
        <p>
          In addition to our own cookies, we may also use various third-party cookies to report usage statistics
          and analyze site performance. These cookies may track your browsing habits and activity when using 
          our website, but we do not use any advertising or tracking cookies for marketing purposes.
        </p>
      </section>

      <section>
        <h2>5. How to Control Cookies</h2>
        <p>
          Most web browsers allow some control of most cookies through browser settings. You can set your browser 
          to refuse cookies, to delete cookies, or to alert you when cookies are being sent. To learn more about 
          how to manage cookies in your web browser, visit the browser's help section or visit 
          <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer">www.allaboutcookies.org</a>.
        </p>
        <p>
          You can also manage your cookie preferences on our website by visiting our 
          <span onClick={() => navigate('/CookieSettings')} className="text-primary hover:underline cursor-pointer">Cookie Settings</span> page.
        </p>
      </section>

      <section>
        <h2>6. What Happens If You Block Cookies?</h2>
        <p>
          If you block or reject cookies, you may still use our website, but some features may not function properly. 
          Essential cookies cannot be rejected as they are strictly necessary to provide you with the services you have requested.
        </p>
      </section>

      <section>
        <h2>7. Changes to This Cookie Policy</h2>
        <p>
          We may update this Cookie Policy from time to time to reflect changes in technology, regulation, or our business 
          practices. Any changes will become effective when we post the revised policy on this page. We encourage you to 
          periodically review this page for the latest information on our cookie practices.
        </p>
      </section>

      <section>
        <h2>8. Contact Us</h2>
        <p>
          If you have any questions about our use of cookies or this Cookie Policy, please contact us at:
          <br />
          Email: info@dicta-notes.com
        </p>
      </section>
    </LegalPageLayout>
  );
}
