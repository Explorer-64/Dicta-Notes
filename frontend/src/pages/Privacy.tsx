import React from "react";
import { LegalPageLayout } from "components/LegalPageLayout";
import { BackButton } from "components/BackButton";

export default function Privacy() {
  const pageTitle = "Privacy Policy";
  const metaDescription = "Learn how Dicta-Notes collects, uses, and protects your personal data. Our Privacy Policy details your rights and our commitment to data security.";

  return (
    <LegalPageLayout 
      title={pageTitle} 
      metaDescription={metaDescription}
      helmetContent={
        <>
          <link rel="canonical" href="https://dicta-notes.com/privacy" />
        </>
      }
    >
      <BackButton />
      <section>
        <h2>1. Introduction</h2>
        <p>Last updated: April 1, 2025</p>
        <p>
          At Dicta-Notes, we respect your privacy and are committed to protecting your personal data. 
          This privacy policy explains how we collect, use, and safeguard your information when you use our 
          transcription service.
        </p>
      </section>

      <section>
        <h2>2. Information We Collect</h2>
        <p>We collect the following types of information:</p>
        <ul>
          <li>
            <strong>Audio recordings and transcriptions:</strong> When you use our service, we 
            process the audio you provide to generate transcriptions. These may contain personal 
            information spoken during the recording.
          </li>
          <li>
            <strong>Session information:</strong> We store metadata about your transcription sessions, 
            including titles, dates, duration, and speaker information.
          </li>
          <li>
            <strong>Device information:</strong> We may collect information about your device, 
            including browser type, operating system, and device identifiers.
          </li>
          <li>
            <strong>Usage data:</strong> We collect information about how you interact with our service, 
            including features used and time spent on the application.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. How We Use Your Information</h2>
        <p>We use your information for the following purposes:</p>
        <ul>
          <li>To provide and maintain our transcription service</li>
          <li>To improve and personalize your experience</li>
          <li>To develop new features and functionality</li>
          <li>To communicate with you about service updates</li>
          <li>To monitor usage and diagnose technical issues</li>
          <li>To ensure the security of our service</li>
        </ul>
      </section>

      <section>
        <h2>4. Data Storage and Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your 
          personal data against unauthorized access, alteration, disclosure, or destruction. 
          However, no method of transmission over the Internet or electronic storage is 100% secure, 
          and we cannot guarantee absolute security.
        </p>
      </section>

      <section>
        <h2>5. Your Rights</h2>
        <p>Depending on your location, you may have the following rights regarding your data:</p>
        <ul>
          <li>The right to access your personal data</li>
          <li>The right to correct inaccurate or incomplete data</li>
          <li>
            <strong>The right to delete your data:</strong> You can request deletion of your account 
            and all associated data directly through the application settings (Settings &gt; Delete Account) 
            or by contacting us.
          </li>
          <li>The right to restrict or object to our processing of your data</li>
          <li>The right to data portability</li>
          <li>The right to withdraw consent at any time</li>
        </ul>
      </section>

      <section>
        <h2>6. Sharing Your Information</h2>
        <p>
          We do not sell your personal information. We may share your information with third parties 
          in the following circumstances:
        </p>
        <ul>
          <li>With service providers who help us operate our service</li>
          <li>When required by law or to respond to legal process</li>
          <li>To protect our rights, privacy, safety, or property</li>
          <li>In connection with a merger, acquisition, or sale of assets</li>
        </ul>
      </section>

      <section>
        <h2>7. Children's Privacy</h2>
        <p>
          Our service is not intended for children under 16 years of age. We do not knowingly 
          collect personal information from children under 16. If we learn we have collected personal 
          information from a child under 16, we will delete this information.
        </p>
      </section>

      <section>
        <h2>8. Changes to This Policy</h2>
        <p>
          We may update this privacy policy from time to time. We will notify you of any changes 
          by posting the new policy on this page and updating the "last updated" date.
        </p>
      </section>

      <section>
        <h2>9. Contact Us</h2>
        <p>
          If you have any questions about this privacy policy, please contact us at:
          <br />
          Email: info@dicta-notes.com
        </p>
      </section>
    </LegalPageLayout>
  );
}
