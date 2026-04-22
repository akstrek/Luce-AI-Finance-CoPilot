'use client'
import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export default function LLMBadge() {
  const [model, setModel] = useState(
    process.env.NEXT_PUBLIC_LLM_MODEL ?? 'nvidia/nemotron-3-super-120b-a12b:free'
  )

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(data => { if (data.llm_model) setModel(data.llm_model) })
      .catch(() => {})
  }, [])

  const displayName = model.includes('/')
    ? model.split('/')[1].split(':')[0].split('-')[0]
    : model.split('-')[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.8 }}
      className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[200] pointer-events-none"
    >
      <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="relative flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-[#00ff50] shadow-[0_0_8px_rgba(0,255,80,0.6)]"></div>
          <div className="absolute w-2 h-2 rounded-full bg-[#00ff50] animate-ping opacity-75"></div>
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-[#00ff50]/60 leading-none mb-1">Engine</span>
          <span className="text-[10px] font-bold text-white/90 tracking-tight leading-none font-syne capitalize">{displayName}</span>
        </div>
      </div>
    </motion.div>
  );
}
