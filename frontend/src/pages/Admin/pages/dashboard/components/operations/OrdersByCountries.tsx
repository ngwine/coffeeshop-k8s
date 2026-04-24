import React from 'react';
import { Circle, MoreHorizontal } from 'lucide-react';

import Card from '../common/Card';

const OrdersByCountries: React.FC = () => {
  const orders = [
    { type: 'SENDER', name: 'Veronica Herman', address: '101 Boulder, California(CA), 95959', status: 'completed' },
    { type: 'RECEIVER', name: 'Barry Schowalter', address: '939 Orange, California(CA), 92118', status: 'pending' },
    { type: 'SENDER', name: 'Myrtle Ullrich', address: '152 Windsor, California(CA), 95492', status: 'completed' },
    { type: 'RECEIVER', name: 'Helen Jacobs', address: '487 Sunset, California(CA), 94043', status: 'pending' },
  ];

  return (
    <Card>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-text-primary">Orders by Countries</h3>
          <p className="text-sm text-text-secondary">62 deliveries in progress</p>
        </div>
        <MoreHorizontal className="text-text-secondary cursor-pointer" />
      </div>
      <div className="flex justify-around border-b border-gray-700 mt-4 text-sm">
        <button className="py-2 text-primary border-b-2 border-primary font-semibold hover:bg-transparent hover:transform-none hover:shadow-none">New</button>
        <button className="py-2 text-text-secondary hover:bg-transparent hover:transform-none hover:shadow-none">Preparing</button>
        <button className="py-2 text-text-secondary hover:bg-transparent hover:transform-none hover:shadow-none">Shipping</button>
      </div>
      <div className="mt-4 space-y-4">
        {orders.map((order, index) => (
          <div key={index} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  order.status === 'completed' ? 'bg-green-500' : 'bg-primary'
                }`}
              >
                <Circle size={8} fill="white" stroke="none" />
              </div>
              {index !== orders.length - 1 && <div className="w-px h-full bg-gray-600" />}
            </div>
            <div>
              <p className={`text-xs font-semibold ${order.status === 'completed' ? 'text-green-400' : 'text-primary'}`}>
                {order.type}
              </p>
              <p className="font-semibold text-text-primary">{order.name}</p>
              <p className="text-xs text-text-secondary">{order.address}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default OrdersByCountries;





