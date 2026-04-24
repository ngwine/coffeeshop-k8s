import React from 'react';
import { ArrowUp } from 'lucide-react';

import Card from '../common/Card';

const GeneratedLeads: React.FC = () => (
  <Card>
    <p className="text-sm text-text-secondary">Generated Leads</p>
    <p className="text-xs text-text-secondary">Monthly Report</p>
    <div className="flex justify-between items-center mt-4">
      <div>
        <p className="text-3xl font-bold text-text-primary">4,350</p>
        <div className="flex items-center text-sm text-accent-green mt-1">
          <ArrowUp size={16} className="mr-1" />
          <span>15.8%</span>
        </div>
      </div>
      <div className="relative w-20 h-20">
        <svg className="w-full h-full" viewBox="0 0 36 36">
          <path
            d="
              M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831
            "
            fill="none"
            stroke="#34d399"
            strokeOpacity="0.3"
            strokeWidth="3"
          />
          <path
            d="
              M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831
            "
            fill="none"
            stroke="#34d399"
            strokeWidth="3"
            strokeDasharray="84, 100"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-white">184</span>
          <span className="text-xs text-text-secondary">Total</span>
        </div>
      </div>
    </div>
  </Card>
);

export default GeneratedLeads;







