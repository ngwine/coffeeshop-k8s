/**
 * AccountRepository - Data access layer for Account operations
 * Organized into patterns/repository
 */
class AccountRepository {
  constructor(CustomerModel) {
    this.Customer = CustomerModel || require('../../models/Customer');
  }

  /**
   * Get account info by customer ID
   */
  async getAccount(customerId) {
    return await this.Customer.findById(customerId).lean();
  }

  /**
   * Update account profile
   */
  async updateProfile(customerId, profileData) {
    const updated = await this.Customer.findByIdAndUpdate(
      customerId,
      profileData,
      { new: true, runValidators: true }
    );

    return updated ? (updated.toObject ? updated.toObject() : updated) : null;
  }

  /**
   * Update avatar
   */
  async updateAvatar(customerId, avatarUrl) {
    return await this.Customer.findByIdAndUpdate(
      customerId,
      { avatarUrl },
      { new: true }
    );
  }

  /**
   * Update preferences
   */
  async updatePreferences(customerId, preferences) {
    return await this.Customer.findByIdAndUpdate(
      customerId,
      { preferences },
      { new: true }
    );
  }

  /**
   * Update consents
   */
  async updateConsents(customerId, consents) {
    return await this.Customer.findByIdAndUpdate(
      customerId,
      { consents },
      { new: true }
    );
  }

  /**
   * Get account statistics
   */
  async getAccountStats(customerId) {
    const customer = await this.Customer.findById(customerId).lean();

    if (!customer) return null;

    return {
      totalOrders: customer.orders?.length || 0,
      totalSpent: customer.totalSpent || 0,
      loyaltyPoints: customer.loyalty?.currentPoints || 0,
      memberSince: customer.createdAt,
      status: customer.status,
    };
  }

  /**
   * Get account addresses
   */
  async getAddresses(customerId) {
    const customer = await this.Customer.findById(customerId).lean();
    return customer?.addresses || [];
  }

  /**
   * Get account payment methods
   */
  async getPaymentMethods(customerId) {
    const customer = await this.Customer.findById(customerId).lean();
    return customer?.paymentMethods || [];
  }

  /**
   * Get account wishlist
   */
  async getWishlist(customerId) {
    const customer = await this.Customer.findById(customerId).lean();
    return customer?.wishlist || [];
  }
}

module.exports = AccountRepository;
