import React from 'react';
import { ResetPasswordForm } from 'components/ResetPasswordForm';
import { Header } from 'components/Header';
import { Helmet } from "react-helmet-async";
import { NoIndexMeta } from 'components/NoIndexMeta';

const ForgotPassword = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <NoIndexMeta />
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://dicta-notes.com/login" />
        <title>Forgot Password - Dicta-Notes</title>
      </Helmet>
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <ResetPasswordForm />
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
