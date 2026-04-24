import React, { useState, useEffect } from 'react';
import { Star, Eye } from 'lucide-react';
import { ProductsApi } from '../../../../../../../api/products';

type WishlistCardProps = {
  customer?: any;
};

type WishlistItem = {
  productId: number | string;
  dateAdded: string;
  isOnSale?: boolean;
  product?: any; // Product details
};

const WishlistCard: React.FC<WishlistCardProps> = ({ customer }) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);

  const wishlist = customer?.wishlist || [];
  const wishlistCount = wishlist.length;

  // Fetch product details for wishlist items
  useEffect(() => {
    if (!showDetailsModal || wishlist.length === 0) {
      if (!showDetailsModal) {
        setWishlistItems([]);
      }
      return;
    }

    let isCancelled = false;

    const extractProducts = (response: any) => {
      const payload = response?.data ?? response;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.data)) return payload.data;
      if (Array.isArray(payload?.items)) return payload.items;
      if (Array.isArray(payload?.data?.items)) return payload.data.items;
      return [];
    };

    const buildProductMap = (products: any[]) => {
      const map = new Map<string, any>();
      products.forEach((product) => {
        const identifiers = [
          product?.id,
          product?._id,
          product?.productId,
        ]
          .filter((value) => value !== undefined && value !== null)
          .map((value) => String(value));

        identifiers.forEach((identifier) => {
          map.set(identifier, product);
        });
      });
      return map;
    };

    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        const response = await ProductsApi.list({ page: 1, limit: 2000 });
        const products = extractProducts(response);
        const productMap = buildProductMap(products);

        if (isCancelled) {
          return;
        }

        const itemsWithProducts = wishlist.map((item: WishlistItem) => {
          const product =
            productMap.get(String(item.productId)) ||
            productMap.get(String(item.productId ?? ''));
          return {
            ...item,
            product: product || null,
          };
        });

        setWishlistItems(itemsWithProducts);
      } catch (err) {
        if (!isCancelled) {
          setWishlistItems(
            wishlist.map((item: WishlistItem) => ({ ...item, product: null }))
          );
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchProductDetails();

    return () => {
      isCancelled = true;
    };
  }, [wishlist, showDetailsModal]);

  const saleItems = wishlistItems.filter((item) => item.isOnSale);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <div className="bg-background-light p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify center">
              <Star className="w-5 h-5 text-orange-400" />
            </div>
            <h4 className="text-base font-semibold text-text-primary">Wishlist</h4>
          </div>
          {wishlistCount > 0 && (
            <button
              onClick={() => setShowDetailsModal(true)}
              className="text-xs text-orange-400 flex items-center gap-1"
              style={{
                transition: 'none !important',
                boxShadow: 'none !important',
                WebkitTransition: 'none !important',
                MozTransition: 'none !important',
                OTransition: 'none !important',
                backgroundColor: 'transparent',
                color: 'rgb(251, 146, 60)', // text-orange-400
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transition = 'none';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'rgb(251, 146, 60)'; // Giữ nguyên màu orange-400
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transition = 'none';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'rgb(251, 146, 60)'; // Giữ nguyên màu orange-400
              }}
            >
              <Eye className="w-3 h-3" />
              View
            </button>
          )}
        </div>
        <p className="text-lg font-bold text-white mb-1">
          <span className="text-orange-400">{wishlistCount}</span> Items in wishlist
        </p>
        <p className="text-xs text-text-secondary mb-3">Receive notification when items go on sale</p>

        {saleItems.length > 0 && (
          <div className="mb-3 p-3 rounded-md bg-orange-500/15 border border-orange-400/30 text-xs text-orange-200">
            <p className="font-semibold text-orange-300">
              Sản phẩm {saleItems[0].product?.name || `#${saleItems[0].productId}`} ON SALE!
            </p>
            {saleItems.length > 1 && (
              <p className="text-orange-200 mt-1">
                +{saleItems.length - 1} ORDER PRODUCTS IN WISHLIST ARE ON SALE!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Wishlist Details Modal */}
      {showDetailsModal && (
        <WishlistDetailsModal
          wishlistItems={wishlistItems}
          loading={loading}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </>
  );
};

// Wishlist Details Modal Component
type WishlistDetailsModalProps = {
  wishlistItems: WishlistItem[];
  loading: boolean;
  onClose: () => void;
};

const WishlistDetailsModal: React.FC<WishlistDetailsModalProps> = ({ wishlistItems, loading, onClose }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-hidden" onClick={onClose}>
      <div 
        className="bg-background-light rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-text-primary">Wishlist Items</h3>
          <button
            onClick={onClose}
            className="text-text-secondary"
            style={{
              transition: 'none !important',
              boxShadow: 'none !important',
              WebkitTransition: 'none !important',
              MozTransition: 'none !important',
              OTransition: 'none !important',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transition = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transition = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            ✕
          </button>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto pr-2 thin-scrollbar">
          {loading ? (
            <div className="text-center py-8 text-text-secondary">Loading...</div>
          ) : wishlistItems.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">No items in wishlist</div>
          ) : (
            <div className="space-y-3">
              {wishlistItems.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-3 bg-background-dark rounded-lg"
                >
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-text-primary flex items-center gap-2">
                      {item.product ? (
                        item.product.name || `Product #${item.productId}`
                      ) : (
                        `Product #${item.productId}`
                      )}
                      {item.isOnSale && (
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-orange-500/20 text-orange-300">
                          ON SALE!
                        </span>
                      )}
                    </div>
                    {item.product && (
                      <div className="text-xs text-text-secondary mt-1">
                        SKU: {item.product.sku || 'N/A'} | 
                        Price: {item.product.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.product.price) : 'N/A'}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-text-secondary ml-4">
                    Added: {formatDate(item.dateAdded)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WishlistCard;

