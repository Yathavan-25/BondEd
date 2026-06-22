/* eslint-disable react-hooks/set-state-in-effect */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const SENTENCES = [
  { line1: "Find Your Perfect", line2: "Study Partner" },
  { line1: "Achieve Your Goals", line2: "Together" },
  { line1: "Learn Smarter", line2: "Not Harder" },
  { line1: "Build Your Ultimate", line2: "Study Group" },
  { line1: "Unlock Your Potential", line2: "Through Teamwork" },
];

const TYPEWRITER_SPEED = 55;
const LINE2_DELAY = 200;
const HOLD_DURATION = 1500;
const ERASE_SPEED = 30;

type Phase = 'typing1' | 'typing2' | 'holding' | 'erasing2' | 'erasing1';

export default function Title() {
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [displayed1, setDisplayed1] = useState('');
  const [displayed2, setDisplayed2] = useState('');
  const [phase, setPhase] = useState<Phase>('typing1');

  const { line1, line2 } = SENTENCES[sentenceIndex];

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === 'typing1') {
      if (displayed1.length < line1.length) {
        timeout = setTimeout(() => {
          setDisplayed1(line1.slice(0, displayed1.length + 1));
        }, TYPEWRITER_SPEED);
      } else {
        timeout = setTimeout(() => setPhase('typing2'), LINE2_DELAY);
      }
    }
    else if (phase === 'typing2') {
      if (displayed2.length < line2.length) {
        timeout = setTimeout(() => {
          setDisplayed2(line2.slice(0, displayed2.length + 1));
        }, TYPEWRITER_SPEED);
      } else {
        timeout = setTimeout(() => setPhase('holding'), HOLD_DURATION);
      }
    }
    else if (phase === 'holding') {
      setPhase('erasing2');
    }
    else if (phase === 'erasing2') {
      if (displayed2.length > 0) {
        timeout = setTimeout(() => {
          setDisplayed2(displayed2.slice(0, -1));
        }, ERASE_SPEED);
      } else {
        setPhase('erasing1');
      }
    }
    else if (phase === 'erasing1') {
      if (displayed1.length > 0) {
        timeout = setTimeout(() => {
          setDisplayed1(displayed1.slice(0, -1));
        }, ERASE_SPEED);
      } else {
        setSentenceIndex((prev) => (prev + 1) % SENTENCES.length);
        setPhase('typing1');
      }
    }

    return () => clearTimeout(timeout);
  }, [phase, displayed1, displayed2, line1, line2]);

  return (
    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[72px] font-bold text-white tracking-tight leading-[1.2] mb-4 flex flex-col items-center h-[2.4em]">

      <span className="inline-flex items-center whitespace-nowrap">
        {displayed1}
        {phase === 'typing1' && <Cursor />}
      </span>

      <span className="inline-flex items-center whitespace-nowrap text-primary-linear">
        {displayed2}
        {(phase === 'typing2' || phase === 'holding') && <Cursor />}
      </span>

    </h1>
  );
}

const Cursor = () => (
  <motion.span
    className="inline-block w-0.75 h-[0.85em] bg-white align-middle ml-1"
    animate={{ opacity: [1, 0] }}
    transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
  />
);