import { mode, Mode } from "../constants";
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { NoIndexMeta } from 'components/NoIndexMeta';

const DebugMode = () => {
  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <NoIndexMeta />
      <Helmet>
        <h1 className="text-2xl font-bold mb-4">Frontend Mode Detection Debug</h1>
        <div className="bg-gray-100 p-4 rounded">
          <p><strong>Current Mode:</strong> {mode}</p>
          <p><strong>Is Development:</strong> {mode === Mode.DEV ? 'TRUE' : 'FALSE'}</p>
          <p><strong>Is Production:</strong> {mode === Mode.PROD ? 'TRUE' : 'FALSE'}</p>
          <p><strong>Mode Enum Values:</strong></p>
          <ul className="ml-4">
            <li>DEV = {Mode.DEV}</li>
            <li>PROD = {Mode.PROD}</li>
          </ul>
        </div>
      </Helmet>
    </div>
  );
};

export default DebugMode;
