import React from "react";
import { LegalPageLayout } from "components/LegalPageLayout";
import { BackButton } from "components/BackButton";

export default function Terms() {
  const pageTitle = "Terms of Service";
  const metaDescription = "Review the Terms of Service for Dicta-Notes. Understand your rights and responsibilities when using our AI-powered transcription platform.";

  return (
    <LegalPageLayout 
      title={pageTitle}
      metaDescription={metaDescription}
      helmetContent={
        <>
          <link rel="canonical" href="https://dicta-notes.com/terms" />
        </>
      }
    >
      <BackButton />
      <section>
        <h2>1. Acceptance of Terms</h2>
        <p>Last updated: April 1, 2025</p>
        <p>
          Welcome to Dicta-Notes. By accessing or using our service, you agree to be bound by these Terms of Service. 
          If you disagree with any part of these terms, you may not access or use our service.
        </p>
      </section>

      <section>
        <h2>2. Description of Service</h2>
        <p>
          Dicta-Notes provides a real-time audio transcription service that converts spoken content into text, 
          differentiates between speakers, and allows users to save, edit, and export transcripts. We may 
          update, modify, or enhance the service at any time.
        </p>
      </section>

      <section>
        <h2>3. User Accounts</h2>
        <p>
          When you create an account with us, you must provide accurate and complete information. You are 
          responsible for maintaining the security of your account and for all activities that occur under your account. 
          We reserve the right to suspend or terminate accounts that violate these terms.
        </p>
        <p>
          You may terminate your account at any time through the account settings or by contacting support. 
          Upon termination, your right to use the service will immediately cease, and your data will be 
          handled in accordance with our Privacy Policy.
        </p>
      </section>

      <section>
        <h2>4. User Content</h2>
        <p>
          Our service allows you to upload, store, and share content, including audio recordings and transcriptions. 
          You retain all rights to your content, but grant us a license to use, store, and process it as necessary to 
          provide our service. You are solely responsible for the content you provide and must have all necessary rights 
          to share it.
        </p>
        <p>
          You must not upload content that:
        </p>
        <ul>
          <li>Violates any applicable laws or regulations</li>
          <li>Infringes on the intellectual property rights of others</li>
          <li>Contains harmful or malicious code</li>
          <li>Harasses, threatens, or defames others</li>
          <li>Contains explicit or inappropriate content</li>
        </ul>
      </section>

      <section>
        <h2>5. Intellectual Property</h2>
        <p>
          All aspects of our service, including but not limited to software, design, text, graphics, and logos, 
          are owned by Dicta-Notes or its licensors and are protected by copyright, trademark, and other intellectual 
          property laws. You may not copy, modify, distribute, or create derivative works based on our service without 
          explicit permission.
        </p>
      </section>

      <section>
        <h2>6. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, Dicta-Notes and its affiliates shall not be liable for any indirect, 
          incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred 
          directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from:
        </p>
        <ul>
          <li>Your use or inability to use our service</li>
          <li>Any unauthorized access to or use of our servers and/or any personal information stored therein</li>
          <li>Any interruption or cessation of transmission to or from our service</li>
          <li>Any bugs, viruses, or other harmful code that may be transmitted through our service</li>
        </ul>
      </section>

      <section>
        <h2>7. Disclaimer of Warranties</h2>
        <p>
          Our service is provided "as is" and "as available" without any warranties of any kind, either express or 
          implied, including but not limited to the implied warranties of merchantability, fitness for a particular 
          purpose, or non-infringement. We do not guarantee that our service will be uninterrupted, timely, secure, or 
          error-free, or that the results obtained from using our service will be accurate or reliable.
        </p>
      </section>

      <section>
        <h2>8. Changes to Terms</h2>
        <p>
          We reserve the right to modify these terms at any time. We will provide notice of significant changes by 
          posting the new terms on our website and updating the "last updated" date. Your continued use of our service 
          after such changes constitutes your acceptance of the new terms.
        </p>
      </section>

      <section>
        <h2>9. Governing Law</h2>
        <p>
          These terms shall be governed by and construed in accordance with the laws of the State of California, 
          without regard to its conflict of law provisions. Any legal action arising out of or relating to these terms 
          shall be filed only in the courts located in San Francisco County, California.
        </p>
      </section>

      <section>
        <h2>10. Contact Information</h2>
        <p>
          If you have any questions about these Terms of Service, please contact us at:
          <br />
          Email: info@dicta-notes.com
        </p>
      </section>
    </LegalPageLayout>
  );
}
