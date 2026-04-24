import React from 'react';

import AdvancedAnalytics from './components/advanced/AdvancedAnalytics';
import StatisticsOverview from './components/overview/StatisticsOverview';
import PopularProducts from './components/products/PopularProducts';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6 pt-8">
      <div className="grid grid-cols-1 md:grid-cols-5">
        <StatisticsOverview />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <PopularProducts />
      </div>

      <div className="grid grid-cols-1">
        <AdvancedAnalytics />
      </div>
    </div>
  );
};

export default Dashboard;
