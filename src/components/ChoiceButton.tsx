/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';

interface ChoiceButtonProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
  delay?: number;
}

export const ChoiceButton: React.FC<ChoiceButtonProps> = ({ text, onClick, disabled, delay = 0 }) => {
  return (
    <motion.button
      id={`choice-${text.substring(0, 10).replace(/\s+/g, '-')}`}
      onClick={onClick}
      disabled={disabled}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.01, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
      whileTap={{ scale: 0.99 }}
      className="group flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 text-left transition-all hover:border-accent-orange/50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="text-sm md:text-base font-medium pr-4">{text}</span>
      <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-accent-orange transition-colors shrink-0" />
    </motion.button>
  );
};
