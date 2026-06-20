'use client';

import MonacoEditor from '@monaco-editor/react';
import type { Language } from '@/types';

// Monaco language IDs don't always match our Language type 1-to-1.
// This map translates our internal type to the Monaco language identifier.
const MONACO_LANGUAGE_MAP: Record<Language, string> = {
  typescript: 'typescript',
  javascript: 'javascript',
  python:     'python',
  rust:       'rust',
  go:         'go',
  sql:        'sql',
  bash:       'shell',
  json:       'json',
  markdown:   'markdown',
  plain:      'plaintext',
};

interface EditorProps {
  value: string;
  language: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
}

export function Editor({
  value,
  language,
  onChange,
  readOnly = false,
  height = '400px',
}: EditorProps) {
  const monacoLang = MONACO_LANGUAGE_MAP[language as Language] ?? 'plaintext';

  return (
    <div className="monaco-host" style={{ height }}>
      <MonacoEditor
        height={height}
        language={monacoLang}
        value={value}
        theme="vs-dark"
        onChange={(val) => {
          if (!readOnly && onChange && val !== undefined) {
            onChange(val);
          }
        }}
        options={{
          readOnly,
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, 'Courier New', monospace",
          fontLigatures: true,
          lineNumbers: 'on',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'off',
          tabSize: 2,
          insertSpaces: true,
          renderLineHighlight: readOnly ? 'none' : 'line',
          cursorStyle: readOnly ? 'line-thin' : 'line',
          selectionHighlight: true,
          occurrencesHighlight: 'off',
          renderWhitespace: 'none',
          padding: { top: 16, bottom: 16 },
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            useShadows: false,
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
          },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          contextmenu: !readOnly,
        }}
        loading={
          <div
            className="flex items-center justify-center bg-slate-900 text-slate-500 text-sm"
            style={{ height }}
          >
            Loading editor…
          </div>
        }
      />
    </div>
  );
}
