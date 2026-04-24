/**
 * ReviewRepository - PURE VERSION
 * Organized into patterns/repository
 */

const MongooseRepositoryAdapter = require('../adapter/MongooseRepositoryAdapter');

class ReviewRepository {
  constructor(ReviewModel) {
    const Model = ReviewModel || require('../../models/Review');
    this.adapter = new MongooseRepositoryAdapter(Model);
    this.model = Model;
  }

  async create(reviewData) {
    const review = {
      ...reviewData,
      createdAt: new Date(),
    };
    return await this.adapter.create(review);
  }

  async findByProductId(productId, options = {}) {
    const { page = 1, limit = 10, sort = '-createdAt' } = options;
    const criteria = { productId: productId };
    return await this.adapter.find(criteria, { page, limit, sort });
  }

  async findById(reviewId) {
    return await this.adapter.findById(reviewId);
  }

  async update(reviewId, updateData) {
    const data = {
      ...updateData,
      updatedAt: new Date(),
    };
    return await this.adapter.update(reviewId, data);
  }

  async delete(reviewId) {
    return await this.adapter.delete(reviewId);
  }

  async getProductRating(productId) {
    const pipeline = [
      { $match: { productId: Number(productId) } },
      {
        $group: {
          _id: '$productId',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          maxRating: { $max: '$rating' },
          minRating: { $min: '$rating' },
        },
      },
    ];
    const result = await this.adapter.aggregate(pipeline);
    return result.length > 0
      ? result[0]
      : {
          _id: productId,
          averageRating: 0,
          totalReviews: 0,
          maxRating: 0,
          minRating: 0,
        };
  }

  async getRatingDistribution(productId) {
    const pipeline = [
      { $match: { productId: Number(productId) } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ];
    const result = await this.adapter.aggregate(pipeline);
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    result.forEach((item) => {
      distribution[item._id] = item.count;
    });
    return distribution;
  }

  async findByCustomerId(customerId, options = {}) {
    const { page = 1, limit = 10, sort = '-createdAt' } = options;
    const criteria = { customerId: customerId };
    return await this.adapter.find(criteria, { page, limit, sort });
  }

  async findByRating(rating, options = {}) {
    const { page = 1, limit = 10, sort = '-createdAt' } = options;
    const criteria = { rating: rating };
    return await this.adapter.find(criteria, { page, limit, sort });
  }

  async findWithMinRating(minRating, options = {}) {
    const { page = 1, limit = 10, sort = '-createdAt' } = options;
    const criteria = { _ratingMin: minRating };
    return await this.adapter.find(criteria, { page, limit, sort });
  }

  async countByProductId(productId) {
    return await this.adapter.count({ productId });
  }

  async reviewExists(reviewId) {
    return await this.adapter.exists({ _id: reviewId });
  }

  async findRecent(limit = 10) {
    return await this.adapter.find({}, { limit, sort: '-createdAt' });
  }

  async getTopRatedProducts(limit = 10) {
    const pipeline = [
      {
        $group: {
          _id: '$productId',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
      { $match: { reviewCount: { $gte: 1 } } },
      { $sort: { averageRating: -1 } },
      { $limit: limit },
    ];
    return await this.adapter.aggregate(pipeline);
  }
}

module.exports = ReviewRepository;
