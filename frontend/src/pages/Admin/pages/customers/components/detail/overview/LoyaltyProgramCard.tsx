import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Badge from '../../../../../components/Badge';
import { Gift, History, ChevronDown, ChevronUp } from 'lucide-react';
import { getOrderDisplayCode } from '../../../../../../../utils/orderDisplayCode';
import { fetchOrderById } from '../../../../../../../api/orders';

type LoyaltyProgramCardProps = {
  loyalty?: any;
  orders?: any[];
  onOrderClick?: (orderId: string, orderData?: any) => void;
};

const tierThresholds: Record<string, number> = {
  bronze: 0,
  silver: 1000,
  gold: 5000,
  platinum: 10000,
};

const tierColors: Record<string, string> = {
  bronze: 'yellow',
  silver: 'gray',
  gold: 'yellow',
  platinum: 'green',
};

const getTierDisplayName = (tier: string): string => {
  const tierLower = tier?.toLowerCase() || 'bronze';
  return tierLower.charAt(0).toUpperCase() + tierLower.slice(1) + ' member';
};

const LoyaltyProgramCard: React.FC<LoyaltyProgramCardProps> = ({ loyalty = {}, orders = [], onOrderClick }) => {
  const [fetchedDisplayCodes, setFetchedDisplayCodes] = useState<Map<string, string>>(new Map());
  const [fetchedOrderData, setFetchedOrderData] = useState<Map<string, any>>(new Map());
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  const totalEarned = loyalty.totalEarned || 0;
  const currentPoints = loyalty.currentPoints || 0;
  const pointsUsed = Math.max(0, totalEarned - currentPoints); // Điểm đã xài
  const tier = loyalty.tier || 'bronze';
  const history = loyalty.history || [];

  const tierDisplayName = getTierDisplayName(tier);
  const tierColor = tierColors[tier?.toLowerCase() || 'bronze'] || 'gray';

  const pointsToNextTier = useMemo(() => {
    const tierLower = tier?.toLowerCase() || 'bronze';
    const tiers = ['bronze', 'silver', 'gold', 'platinum'];
    const currentIndex = tiers.indexOf(tierLower);
    if (currentIndex === -1 || currentIndex === tiers.length - 1) {
      return null;
    }
    const nextTier = tiers[currentIndex + 1];
    const nextThreshold = tierThresholds[nextTier];
    return Math.max(0, nextThreshold - currentPoints);
  }, [tier, currentPoints]);

  const orderIdToDisplayCodeMap = useMemo(() => {
    const map = new Map<string, string>();
    orders.forEach((order: any) => {
      const id = String(order.id || '').trim();
      const mongoId = String(order._id || '').trim();
      const displayCode = getOrderDisplayCode(order);
      if (displayCode && displayCode !== '#----') {
        if (id) {
          map.set(id, displayCode);
          map.set(id.toLowerCase(), displayCode);
        }
        if (mongoId) {
          map.set(mongoId, displayCode);
          map.set(mongoId.toLowerCase(), displayCode);
        }
      }
    });
    return map;
  }, [orders]);

  useEffect(() => {
    if (!history || history.length === 0) return;

    const fetchMissingDisplayCodes = async () => {
      const missingOrderIds: string[] = [];
      history.forEach((entry: any) => {
        const orderId = String(entry.orderId || '').trim();
        if (
          orderId &&
          !orderIdToDisplayCodeMap.has(orderId) &&
          !orderIdToDisplayCodeMap.has(orderId.toLowerCase()) &&
          !fetchedDisplayCodes.has(orderId) &&
          !fetchedDisplayCodes.has(orderId.toLowerCase())
        ) {
          missingOrderIds.push(orderId);
        }
      });

      if (missingOrderIds.length > 0) {
        const newMap = new Map(fetchedDisplayCodes);
        const promises = missingOrderIds.slice(0, 10).map(async (orderId) => {
          try {
            const response = await fetchOrderById(orderId);
            const order = response?.data || response;
            if (order) {
              const displayCode = getOrderDisplayCode(order);
              if (displayCode && displayCode !== '#----') {
                newMap.set(orderId, displayCode);
                newMap.set(orderId.toLowerCase(), displayCode);
              }
              // Lưu order data để sử dụng khi click
              setFetchedOrderData((prev) => {
                const newDataMap = new Map(prev);
                newDataMap.set(orderId, order);
                newDataMap.set(orderId.toLowerCase(), order);
                return newDataMap;
              });
            }
          } catch (err) {
            // ignore missing order, fallback will handle
          }
        });
        await Promise.all(promises);
        if (newMap.size > fetchedDisplayCodes.size) {
          setFetchedDisplayCodes(newMap);
        }
      }
    };

    fetchMissingDisplayCodes();
  }, [history, orderIdToDisplayCodeMap, fetchedDisplayCodes]);

  const getDisplayCodeFromOrderId = useCallback(
    (orderId: string): string => {
      if (!orderId) return 'N/A';
      const searchId = String(orderId).trim();
      if (orderIdToDisplayCodeMap.has(searchId)) return orderIdToDisplayCodeMap.get(searchId)!;
      if (orderIdToDisplayCodeMap.has(searchId.toLowerCase())) {
        return orderIdToDisplayCodeMap.get(searchId.toLowerCase())!;
      }
      if (fetchedDisplayCodes.has(searchId)) return fetchedDisplayCodes.get(searchId)!;
      if (fetchedDisplayCodes.has(searchId.toLowerCase())) {
        return fetchedDisplayCodes.get(searchId.toLowerCase())!;
      }
      const order = orders.find((o: any) => {
        const id = String(o.id || '').trim();
        const mongoId = String(o._id || '').trim();
        return (
          id === searchId ||
          mongoId === searchId ||
          id.toLowerCase() === searchId.toLowerCase() ||
          mongoId.toLowerCase() === searchId.toLowerCase()
        );
      });
      if (order) {
        const displayCode = getOrderDisplayCode(order);
        if (displayCode && displayCode !== '#----') {
          return displayCode;
        }
      }
      return searchId;
    },
    [orderIdToDisplayCodeMap, fetchedDisplayCodes, orders]
  );

  return (
    <div className="bg-background-light p-6 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <Gift className="w-5 h-5 text-green-400" />
          </div>
          <h4 className="text-base font-semibold text-text-primary">Loyalty Program</h4>
        </div>
        <Badge color={tierColor as any}>{tierDisplayName}</Badge>
      </div>

      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-secondary">Total earned points:</span>
          <span className="text-sm font-semibold text-text-primary">
            {totalEarned.toLocaleString('vi-VN')} points
            {totalEarned > 0 && (
              <span className="text-xs text-text-secondary ml-1">
                ({((totalEarned * 1000).toLocaleString('vi-VN'))}₫)
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-secondary">Points used:</span>
          <span className="text-sm font-semibold text-orange-400">
            {pointsUsed.toLocaleString('vi-VN')} points
            {pointsUsed > 0 && (
              <span className="text-xs text-text-secondary ml-1">
                ({((pointsUsed * 1000).toLocaleString('vi-VN'))}₫)
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-secondary">Current available points:</span>
          <span className="text-sm font-semibold text-green-400">
            {currentPoints.toLocaleString('vi-VN')} points
            {currentPoints > 0 && (
              <span className="text-xs text-text-secondary ml-1">
                ({((currentPoints * 1000).toLocaleString('vi-VN'))}₫)
              </span>
            )}
          </span>
        </div>
      </div>

      {history.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-700">
          <button
            onClick={() => setIsHistoryExpanded((prev) => !prev)}
            className="flex items-center justify-between w-full gap-2 mb-2"
            style={{
              transition: 'none !important',
              boxShadow: 'none !important',
              WebkitTransition: 'none !important',
              MozTransition: 'none !important',
              OTransition: 'none !important',
              msTransition: 'none !important',
              backgroundColor: 'transparent',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transition = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transition = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.opacity = '1';
            }}
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-text-secondary" />
              <span className="text-xs font-semibold text-text-secondary">Recent History</span>
            </div>
            {isHistoryExpanded ? (
              <ChevronUp className="w-4 h-4 text-text-secondary" />
            ) : (
              <ChevronDown className="w-4 h-4 text-text-secondary" />
            )}
          </button>
          {isHistoryExpanded && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {history
                .slice()
                .reverse()
                .map((entry: any, idx: number) => {
                  const displayCode = getDisplayCodeFromOrderId(entry.orderId);
                  const orderId = String(entry.orderId || '').trim();
                  const handleOrderClick = async (e: React.MouseEvent) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (onOrderClick && orderId) {
                      // Tìm order data từ nhiều nguồn: orders list, fetchedOrderData
                      let orderData = orders.find((o: any) => {
                        const id = String(o.id || o._id || '').trim();
                        const mongoId = String(o._id || '').trim();
                        return id === orderId || mongoId === orderId || 
                               id.toLowerCase() === orderId.toLowerCase() || 
                               mongoId.toLowerCase() === orderId.toLowerCase();
                      });
                      
                      // Nếu không tìm thấy trong orders list, thử lấy từ fetchedOrderData
                      if (!orderData) {
                        orderData = fetchedOrderData.get(orderId) || fetchedOrderData.get(orderId.toLowerCase());
                      }
                      
                      // Nếu vẫn không có, thử fetch ngay (nhưng vẫn chuyển trang ngay lập tức)
                      if (!orderData) {
                        try {
                          const response = await fetchOrderById(orderId);
                          orderData = response?.data || response;
                          // Lưu vào cache để lần sau dùng
                          if (orderData) {
                            setFetchedOrderData((prev) => {
                              const newDataMap = new Map(prev);
                              newDataMap.set(orderId, orderData);
                              newDataMap.set(orderId.toLowerCase(), orderData);
                              return newDataMap;
                            });
                          }
                        } catch (err) {
                          // Nếu fetch thất bại, vẫn chuyển trang với orderId
                        }
                      }
                      
                      // Chuyển trang ngay lập tức với orderData nếu có
                      if (typeof onOrderClick === 'function') {
                        if (orderData) {
                          (onOrderClick as any)(orderId, orderData);
                        } else {
                          onOrderClick(orderId);
                        }
                      }
                    }
                  };
                  return (
                    <div key={idx} className="text-xs text-text-secondary">
                      <span className={entry.type === 'earned' ? 'text-green-400' : 'text-orange-400'}>
                        {entry.type === 'earned' ? '+' : '-'}
                        {entry.points?.toLocaleString('vi-VN') || entry.points}
                      </span>{' '}
                      points -{' '}
                      {onOrderClick && orderId ? (
                        <button
                          onClick={handleOrderClick}
                          className="text-primary cursor-pointer"
                          style={{
                            transition: 'none !important',
                            boxShadow: 'none !important',
                            WebkitTransition: 'none !important',
                            MozTransition: 'none !important',
                            OTransition: 'none !important',
                            msTransition: 'none !important',
                            backgroundColor: 'transparent',
                            textDecoration: 'none',
                            color: '#7c3aed', // text-primary - giữ nguyên màu
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transition = 'none';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.textDecoration = 'none';
                            e.currentTarget.style.color = '#7c3aed'; // Giữ nguyên màu primary
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transition = 'none';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.textDecoration = 'none';
                            e.currentTarget.style.color = '#7c3aed'; // Giữ nguyên màu primary
                          }}
                        >
                          {displayCode}
                        </button>
                      ) : (
                        <span>{displayCode}</span>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LoyaltyProgramCard;

