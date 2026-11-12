import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppFooter } from './components/AppFooter';
import { DictionaryView } from './components/DictionaryView';
import { LandingView } from './components/LandingView';
import { PracticePanel } from './components/PracticePanel';
import { StudioView } from './components/StudioView';
import { TopNav, type View } from './components/TopNav';
import { useCamera } from './hooks/useCamera';
import { useHandRecognition, type FeedSource } from './hooks/useHandRecognition';
import { useSignCommit } from './hooks/useSignCommit';
import { CONFIG } from './lib/config';
import { speak, speechSupported, stopSpeaking } from './lib/speech';
import {
  addSpace,
  appendSign,
  backspace as removeToken,
  transcriptText,
} from './lib/transcript';
import { signById } from './data/signs';
import type { DetectedSign, TranscriptToken } from './types';

export default function App() {
  const [view, setView] = useState<View>('studio');
  const [tokens, setTokens] = useState<TranscriptToken[]>([]);
  const [dwellMs, setDwellMs] = useState<number>(CONFIG.dwellMs);
  const [mirrored, setMirrored] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [demo, setDemo] = useState(false);
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const [practicedIds, setPracticedIds] = useState<Set<string>>(new Set());
  const [speaking, setSpeaking] = useState(false);

  const camera = useCamera();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoStack = useRef<HTMLVideoElement[]>([]);

  /** Multiple camera surfaces can be mounted (studio behind a practice sheet). */
  const bindVideo = useCallback((element: HTMLVideoElement | null) => {
    if (!element) return () => {};
    videoStack.current = [...videoStack.current.filter((item) => item !== element), element];
    videoRef.current = element;

    return () => {
      videoStack.current = videoStack.current.filter((item) => item !== element);
      videoRef.current = videoStack.current[videoStack.current.length - 1] ?? null;
    };
  }, []);

  const active = camera.status === 'live' || demo;
  const source: FeedSource = demo ? 'demo' : 'camera';

  const engine = useHandRecognition({ active, source, videoRef });

  const onCommit = useCallback((sign: DetectedSign) => {
    setTokens((current) => appendSign(current, sign, performance.now()));
  }, []);

  const commitsEnabled = active && view === 'studio' && practiceId === null;

  const commit = useSignCommit({
    subscribe: engine.subscribe,
    enabled: commitsEnabled,
    dwellMs,
    onCommit,
  });

  const enableCamera = useCallback(
    async (goToStudio = true) => {
      const started = await camera.start();
      if (started) {
        setDemo(false);
        if (goToStudio) setView('studio');
      }
    },
    [camera],
  );

  const startDemo = useCallback(() => {
    camera.clearError();
    setDemo(true);
    setView('studio');
  }, [camera]);

  const pause = useCallback(() => {
    setDemo(false);
    camera.stop();
  }, [camera]);

  const handleSpeak = useCallback(() => {
    const text = transcriptText(tokens);
    if (!text) return;
    setSpeaking(true);
    speak(text, {
      onEnd: () => setSpeaking(false),
    });
  }, [tokens]);

  const openPractice = useCallback((id: string) => {
    setPracticeId(id);
    setPracticedIds((current) => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    if (view !== 'studio' || practiceId) return undefined;

    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }

      if (event.key === 'Backspace') {
        event.preventDefault();
        setTokens((current) => removeToken(current));
      } else if (event.key === ' ') {
        event.preventDefault();
        setTokens((current) => addSpace(current, performance.now()));
      } else if (event.key === 'Enter') {
        event.preventDefault();
        handleSpeak();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, practiceId, handleSpeak]);

  useEffect(() => () => stopSpeaking(), []);

  const practiceSign = useMemo(
    () => (practiceId ? signById.get(practiceId) ?? null : null),
    [practiceId],
  );

  const navStatus = demo
    ? 'simulated'
    : camera.status === 'live'
      ? engine.status === 'loading'
        ? 'loading'
        : 'live'
      : 'idle';

  return (
    <div className="grain flex min-h-screen flex-col bg-paper">
      <TopNav view={view} onChange={setView} status={navStatus} />

      <main id="top" className="flex-1">
        {view === 'dictionary' ? (
          <DictionaryView onPractice={openPractice} practicedIds={practicedIds} />
        ) : active ? (
          <StudioView
            camera={camera}
            engine={engine}
            bindVideo={bindVideo}
            source={source}
            mirrored={mirrored}
            showSkeleton={showSkeleton}
            onToggleMirror={() => setMirrored((value) => !value)}
            onToggleSkeleton={() => setShowSkeleton((value) => !value)}
            progressRef={commit.progressRef}
            readingLabel={commit.readingLabel}
            locked={commit.locked}
            tokens={tokens}
            dwellMs={dwellMs}
            onDwellChange={setDwellMs}
            onSpeak={handleSpeak}
            onSpace={() => setTokens((current) => addSpace(current, performance.now()))}
            onBackspace={() => setTokens((current) => removeToken(current))}
            onClear={() => setTokens([])}
            speaking={speaking}
            speechSupported={speechSupported()}
            onPause={pause}
          />
        ) : (
          <LandingView
            cameraStatus={camera.status}
            error={camera.error}
            modelStatus={engine.status}
            onEnable={() => void enableCamera(true)}
            onDemo={startDemo}
            onDismissError={camera.clearError}
          />
        )}
      </main>

      <AppFooter />

      {practiceSign && (
        <PracticePanel
          sign={practiceSign}
          onClose={() => setPracticeId(null)}
          camera={camera}
          engine={engine}
          bindVideo={bindVideo}
          source={source}
          mirrored={mirrored}
          showSkeleton={showSkeleton}
          onEnableCamera={() => void enableCamera(false)}
        />
      )}
    </div>
  );
}
