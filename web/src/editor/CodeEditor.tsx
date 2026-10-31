import React, { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { offlineDB } from '../services/db.js';
import { DEFAULT_LIMITS } from '@dagna/shared';

interface CodeEditorProps {
  problemId: string;
  language: string;
  onCodeChange: (code: string) => void;
  initialCode?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  problemId,
  language,
  onCodeChange,
  initialCode = '',
}) => {
  const [code, setCode] = useState(initialCode);

  // Restore draft from IndexedDB on problem/language change
  useEffect(() => {
    async function loadDraft() {
      const draft = await offlineDB.drafts.get([problemId, language]);
      if (draft && draft.code) {
        setCode(draft.code);
        onCodeChange(draft.code);
      } else if (initialCode) {
        setCode(initialCode);
        onCodeChange(initialCode);
      } else {
        const template = getDefaultTemplate(language);
        setCode(template);
        onCodeChange(template);
      }
    }
    loadDraft();
  }, [problemId, language]);

  const handleChange = (value: string) => {
    setCode(value);
    onCodeChange(value);

    // Debounced draft save to Dexie
    offlineDB.drafts.put({
      problemId,
      language,
      code: value,
      updatedAt: Date.now(),
    });
  };

  const codeBytes = new TextEncoder().encode(code).length;
  const maxBytes = DEFAULT_LIMITS.MAX_SOURCE_SIZE_BYTES;
  const isOverLimit = codeBytes > maxBytes;

  const getExtensions = () => {
    switch (language) {
      case 'cpp':
        return [cpp()];
      case 'python':
        return [python()];
      case 'javascript':
        return [javascript()];
      default:
        return [cpp()];
    }
  };

  return (
    <div className="flex flex-col rounded-lg border border-slate-700 bg-slate-900 overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-950 text-xs text-slate-400 font-mono">
        <span className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Draft autosaved</span>
        </span>
        <span className={isOverLimit ? 'text-red-400 font-bold' : 'text-slate-400'}>
          {Math.round(codeBytes / 1024)} KB / {Math.round(maxBytes / 1024)} KB
        </span>
      </div>

      <CodeMirror
        value={code}
        height="400px"
        theme={oneDark}
        extensions={getExtensions()}
        onChange={handleChange}
        className="text-sm font-mono"
      />
    </div>
  );
};

function getDefaultTemplate(language: string): string {
  switch (language) {
    case 'cpp':
      return `#include <iostream>\n\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    // Write your solution here\n    \n    return 0;\n}\n`;
    case 'python':
      return `import sys\n\ndef main():\n    # Read input from standard input\n    pass\n\nif __name__ == '__main__':\n    main()\n`;
    case 'javascript':
      return `const fs = require('fs');\n\nfunction main() {\n    const input = fs.readFileSync(0, 'utf-8');\n    // Write your solution here\n}\n\nmain();\n`;
    default:
      return '';
  }
}
