'use client';


import { useState, useTransition } from 'react';
import { updateDashboardYaml } from '@/app/lib/actions';

export default function YamlEditor({ id, initialValue }: { id: number, initialValue: string }) {
  const [code, setCode] = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      await updateDashboardYaml(id, code);
      // Optional: Add a toast notification here
    });
  };

  return (
    <div className="grow relative flex flex-col h-full">
      {/* Hidden form that matches the ID in your Header button */}
      <form 
        id="yaml-form" 
        action={handleSave} 
        className="absolute inset-0"
      >
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className={`w-full h-full bg-transparent text-green-400 font-mono text-sm p-4 outline-none resize-none transition-opacity ${isPending ? 'opacity-50' : 'opacity-100'}`}
          spellCheck={false}
          placeholder="# Enter your YAML configuration here..."
        />
      </form>
      
      {isPending && (
        <div className="absolute top-2 right-4 text-xs text-violet-400 animate-pulse">
          Saving...
        </div>
      )}
    </div>
  );
}