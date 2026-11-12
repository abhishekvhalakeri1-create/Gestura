export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-stone">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-7 px-5 py-9 sm:flex-row sm:items-start sm:justify-between sm:px-8 lg:px-12">
        <div className="max-w-[62ch]">
          <span className="eyebrow">A prototype, honestly labelled</span>
          <p className="mt-2.5 text-[12px] leading-[1.75] text-muted">
            Gestura reads the geometry of a handshape, not a trained ASL model. It will
            misread unusual lighting, half-visible hands and fast transitions, and it is not
            a substitute for a qualified interpreter. What it will never do is send your
            camera feed anywhere — detection happens in this tab and the video is discarded
            the moment the frame is read.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-9 gap-y-4">
          {[
            ['On-device', 'MediaPipe tasks-vision'],
            ['Built with', 'React · WebAssembly'],
            ['Set in', 'Instrument Serif · Inter'],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                {label}
              </div>
              <div className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted">
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
