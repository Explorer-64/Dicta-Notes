import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NoIndexMeta } from 'components/NoIndexMeta';
import GoogleSTTRecorder from 'components/GoogleSTTRecorder';
import { AudioSourceType } from 'utils/recording/audioSourceTypes';

export default function GoogleSTTTest() {
  const [audioSource, setAudioSource] = useState<AudioSourceType>(AudioSourceType.MICROPHONE);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <NoIndexMeta />
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Audio Source Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Google STT Test (Smart VAD + Pitch Detection)</CardTitle>
            <p className="text-sm text-muted-foreground">
              Three-trigger chunking: Normal pauses (350ms) + Long duration (8s→150ms) + Pitch changes
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="text-sm font-medium">Audio Source:</label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={audioSource === AudioSourceType.MICROPHONE ? 'default' : 'outline'}
                  onClick={() => setAudioSource(AudioSourceType.MICROPHONE)}
                >
                  🎤 Microphone
                </Button>
                <Button
                  size="sm"
                  variant={audioSource === AudioSourceType.SYSTEM_AUDIO ? 'default' : 'outline'}
                  onClick={() => setAudioSource(AudioSourceType.SYSTEM_AUDIO)}
                >
                  🔊 System Audio
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Google STT Recorder Component */}
        <GoogleSTTRecorder audioSource={audioSource} />
      </div>
    </div>
  );
}
