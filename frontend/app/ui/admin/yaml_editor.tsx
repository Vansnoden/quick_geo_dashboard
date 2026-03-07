'use client';

import { useState } from 'react';
import { updateDashboardYaml } from '@/app/lib/actions';

export default function YamlEditor({ id, initialValue }: { id: number, initialValue: string }) {
  const [code, setCode] = useState(initialValue);

  return (
    <form id="yaml-form" action={() => updateDashboardYaml(id, code)} className="grow">
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full h-full bg-transparent text-green-400 font-mono text-sm p-4 outline-none resize-none"
        spellCheck={false}
      />
    </form>
  );
}