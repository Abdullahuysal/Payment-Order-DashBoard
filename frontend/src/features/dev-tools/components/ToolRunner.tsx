import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

import { Button } from '@/components/ui';

import { DEVTOOLS_MOCK } from '../api/devTools.api';
import type { DevToolConfig } from '../registry';
import type { OptionState, OptionValue } from '../types';
import { useDevToolRunner } from '../hooks/useDevToolRunner';
import { OptionRow } from './OptionRow';
import { ResultPanel } from './ResultPanel';
import { InlineHint, PanelHeading } from './kit';

export function ToolRunner({ config }: { config: DevToolConfig }) {
  const secondary = config.secondaryInput;

  const [input, setInput] = useState('');
  const [inputB, setInputB] = useState('');
  const [options, setOptions] = useState<OptionState>({ ...config.defaults });

  const runner = useDevToolRunner(config.key);
  const { mutate, reset } = runner;
  const inputRef = useRef(input);
  inputRef.current = input;
  const inputBRef = useRef(inputB);
  inputBRef.current = inputB;
  const attemptedRef = useRef(false);

  const runNow = () => {
    if (inputRef.current.trim().length === 0) return;
    attemptedRef.current = true;
    mutate(
      secondary
        ? { input: inputRef.current, inputB: inputBRef.current, options }
        : { input: inputRef.current, options },
    );
  };

  const run = () => runNow();

  useEffect(() => {
    if (!attemptedRef.current || inputRef.current.trim().length === 0) return;
    const id = window.setTimeout(
      () =>
        mutate(
          secondary
            ? { input: inputRef.current, inputB: inputBRef.current, options }
            : { input: inputRef.current, options },
        ),
      150,
    );
    return () => window.clearTimeout(id);
  }, [options, inputB, secondary, mutate]);

  const setOption = (key: string, value: OptionValue) =>
    setOptions((current) => ({ ...current, [key]: value }));

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      run();
    }
  };

  const empty = input.trim().length === 0;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <PanelHeading>{config.inputLabel}</PanelHeading>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInput(config.sample)}
              className="text-[11px] text-fg-subtle transition-colors hover:text-fg-muted"
            >
              örnek yükle
            </button>
            {(input.length > 0 || inputB.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  setInput('');
                  setInputB('');
                  attemptedRef.current = false;
                  reset();
                }}
                className="text-[11px] text-fg-subtle transition-colors hover:text-fg-muted"
              >
                temizle
              </button>
            )}
          </div>
        </div>

        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          placeholder={config.inputPlaceholder}
          className="h-64 w-full resize-y rounded-lg border border-border bg-bg px-3 py-2.5 font-mono text-xs leading-relaxed text-fg placeholder:text-fg-subtle focus:border-border-strong focus:outline-none"
        />

        {secondary && (
          <>
            <div className="flex items-center justify-between pt-1">
              <PanelHeading>{secondary.label}</PanelHeading>
              {secondary.sample !== undefined && (
                <button
                  type="button"
                  onClick={() => setInputB(secondary.sample ?? '')}
                  className="text-[11px] text-fg-subtle transition-colors hover:text-fg-muted"
                >
                  örnek yükle
                </button>
              )}
            </div>
            <textarea
              value={inputB}
              onChange={(event) => setInputB(event.target.value)}
              onKeyDown={onKeyDown}
              spellCheck={false}
              placeholder={secondary.placeholder}
              className="h-64 w-full resize-y rounded-lg border border-border bg-bg px-3 py-2.5 font-mono text-xs leading-relaxed text-fg placeholder:text-fg-subtle focus:border-border-strong focus:outline-none"
            />
          </>
        )}

        {config.options.length > 0 && (
          <div className="rounded-lg border border-border bg-surface px-3 py-1.5">
            {config.options.map((field) => (
              <OptionRow
                key={field.key}
                field={field}
                value={options[field.key]}
                onChange={setOption}
              />
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={run} disabled={empty || runner.isPending}>
            {runner.isPending ? 'Çalışıyor…' : 'Çalıştır'}
          </Button>
          <span className="text-[11px] text-fg-subtle">
            <span className="tnum">⌘/Ctrl+↵</span> ile de çalışır
            {DEVTOOLS_MOCK && ' · mock yanıt'}
          </span>
        </div>
      </section>

      <div>
        {runner.isPending ? (
          <div className="h-64 animate-pulse rounded-lg border border-border bg-surface motion-reduce:animate-none" />
        ) : runner.isError ? (
          <InlineHint className="border-status-down/30 text-status-down">
            {runner.error.message}
          </InlineHint>
        ) : runner.data ? (
          <ResultPanel result={runner.data} />
        ) : (
          <InlineHint>{config.summary}</InlineHint>
        )}
      </div>
    </div>
  );
}
