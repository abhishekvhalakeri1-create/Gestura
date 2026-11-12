import { useCallback, useEffect, useRef, useState } from 'react';
import type { CameraDevice, CameraError, CameraErrorKind, CameraStatus } from '../types';

function describeError(error: unknown): CameraError {
  const name = error instanceof DOMException ? error.name : '';

  const table: Record<string, CameraError> = {
    NotAllowedError: {
      kind: 'denied',
      title: 'Camera permission was declined',
      message:
        'Gestura needs your camera to read a handshape. Re-enable it in your browser’s site settings, then try again.',
    },
    PermissionDeniedError: {
      kind: 'denied',
      title: 'Camera permission was declined',
      message:
        'Re-enable camera access for this site in your browser settings, then try again.',
    },
    NotFoundError: {
      kind: 'missing',
      title: 'No camera found',
      message:
        'We couldn’t find a camera on this device. Plug one in, or explore the studio with the simulated feed.',
    },
    DevicesNotFoundError: {
      kind: 'missing',
      title: 'No camera found',
      message: 'No camera is attached to this device.',
    },
    NotReadableError: {
      kind: 'busy',
      title: 'The camera is in use',
      message:
        'Another app is holding the camera. Close it — a video call, perhaps — and try again.',
    },
    TrackStartError: {
      kind: 'busy',
      title: 'The camera is in use',
      message: 'Another application has the camera open. Close it and try again.',
    },
    OverconstrainedError: {
      kind: 'missing',
      title: 'That camera isn’t available',
      message: 'The chosen camera could not start. Try the default camera instead.',
    },
    SecurityError: {
      kind: 'insecure',
      title: 'A secure connection is required',
      message: 'Camera access only works over HTTPS or on localhost.',
    },
  };

  if (name && table[name]) return table[name];

  return {
    kind: 'unknown' as CameraErrorKind,
    title: 'The camera didn’t start',
    message:
      error instanceof Error && error.message
        ? error.message
        : 'Something interrupted the camera. Reload the page and try again.',
  };
}

async function readDevices(): Promise<CameraDevice[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices
    .filter((device) => device.kind === 'videoinput')
    .map((device, index) => ({
      deviceId: device.deviceId,
      label: device.label || `Camera ${index + 1}`,
    }));
}

export interface CameraController {
  status: CameraStatus;
  error: CameraError | null;
  stream: MediaStream | null;
  devices: CameraDevice[];
  deviceId: string | null;
  start: (deviceId?: string) => Promise<boolean>;
  stop: () => void;
  switchCamera: () => Promise<void>;
  clearError: () => void;
}

export function useCamera(): CameraController {
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState<CameraError | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startingRef = useRef(false);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  const start = useCallback(
    async (requestedId?: string) => {
      if (startingRef.current) return false;
      startingRef.current = true;
      setStatus('requesting');
      setError(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        const unsupported: CameraError = {
          kind: window.isSecureContext ? 'unsupported' : 'insecure',
          title: window.isSecureContext ? 'Camera not supported' : 'A secure connection is required',
          message: window.isSecureContext
            ? 'This browser does not expose a camera API. Try a recent version of Chrome, Edge, Firefox or Safari.'
            : 'Camera access only works over HTTPS or on localhost. Open the app on a secure address and try again.',
        };
        setError(unsupported);
        setStatus('error');
        startingRef.current = false;
        return false;
      }

      try {
        stopTracks();
        const next = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: requestedId
            ? { deviceId: { exact: requestedId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        });

        streamRef.current = next;
        setStream(next);
        setStatus('live');
        setDeviceId(requestedId ?? next.getVideoTracks()[0]?.getSettings().deviceId ?? null);

        const videoTracks = next.getVideoTracks();
        videoTracks[0]?.addEventListener('ended', () => {
          setStatus('idle');
        });

        setDevices(await readDevices());
        return true;
      } catch (caught) {
        const described = describeError(caught);
        setError(described);
        setStatus('error');
        return false;
      } finally {
        startingRef.current = false;
      }
    },
    [stopTracks],
  );

  const stop = useCallback(() => {
    stopTracks();
    setStatus('idle');
  }, [stopTracks]);

  const switchCamera = useCallback(async () => {
    const list = devices.length > 0 ? devices : await readDevices();
    if (list.length < 2) return;
    const currentIndex = list.findIndex((device) => device.deviceId === deviceId);
    const next = list[(currentIndex + 1) % list.length];
    setDevices(list);
    await start(next.deviceId);
  }, [deviceId, devices, start]);

  useEffect(() => {
    if (!navigator.mediaDevices?.addEventListener) return;
    const refresh = () => {
      void readDevices().then(setDevices);
    };
    navigator.mediaDevices.addEventListener('devicechange', refresh);
    return () => navigator.mediaDevices.removeEventListener('devicechange', refresh);
  }, []);

  useEffect(() => () => stopTracks(), [stopTracks]);

  const clearError = useCallback(() => {
    setError(null);
    setStatus((current) => (current === 'error' ? 'idle' : current));
  }, []);

  return {
    status,
    error,
    stream,
    devices,
    deviceId,
    start,
    stop,
    switchCamera,
    clearError,
  };
}
