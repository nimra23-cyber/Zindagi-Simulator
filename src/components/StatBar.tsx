/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Heart, Wallet, Brain } from 'lucide-react';

interface StatProps {
  label: string;
  value: number;
  max: number;
  color: string;
  icon: React.ReactNode;
  isCurrency?: boolean;
}

export const StatBar: React.FC<StatProps> = ({ label, value, max, color, icon, isCurrency }) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  return (
    <div className="flex flex-col gap-1 w-full" id={`stat-${label.toLowerCase()}`}>
      <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-white/60">
        <div className="flex items-center gap-1.5">
          {icon}
          <span>{label}</span>
        </div>
        <span>{isCurrency ? `Rs. ${value}` : `${value}/${max}`}</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div 
          className={`h-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: isCurrency ? "100%" : `${percentage}%` }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
        />
      </div>
    </div>
  );
};
