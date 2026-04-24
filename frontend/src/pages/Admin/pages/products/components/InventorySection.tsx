import React from 'react';

const INVENTORY_TABS = ['Restock', 'Shipping', 'Global Delivery', 'Attributes', 'Advanced'];

const InventorySection: React.FC = () => {
  return (
    <div className="bg-background-light p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 text-text-primary">Inventory</h3>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex lg:flex-col gap-2 text-sm">
          {INVENTORY_TABS.map((item, idx) => (
            <button
              key={item}
              className={`px-4 py-2 rounded-lg border border-gray-700 text-left transition-colors ${
                idx === 0
                  ? 'bg-primary/20 text-primary border-primary'
                  : 'bg-background-dark text-text-secondary hover:border-primary/60 hover:text-text-primary'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <p className="text-sm text-text-secondary">Options</p>
            <div className="mt-2 flex gap-3">
              <input
                type="number"
                min={0}
                placeholder="Quantity"
                className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
              />
              <button className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90">Confirm</button>
            </div>
          </div>
          <div className="grid gap-2 text-sm text-text-secondary">
            <div className="flex justify-between">
              <span>Product in stock now</span>
              <span className="text-text-primary font-medium">54</span>
            </div>
            <div className="flex justify-between">
              <span>Product in transit</span>
              <span className="text-text-primary font-medium">390</span>
            </div>
            <div className="flex justify-between">
              <span>Last time restocked</span>
              <span className="text-text-primary font-medium">24th June, 2023</span>
            </div>
            <div className="flex justify-between">
              <span>Total stock over lifetime</span>
              <span className="text-text-primary font-medium">2430</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventorySection;



