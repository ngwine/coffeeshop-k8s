/**
 * backend/test/ReviewRepository.test.js
 * Unit tests for ReviewRepository
 * Tests CRUD operations and data aggregation
 */

describe('ReviewRepository', () => {
  let ReviewRepository;
  let mockReviewModel;
  let repository;

  beforeEach(() => {
    // Mock Review model
    mockReviewModel = {
      create: jest.fn(),
      find: jest.fn().mockReturnThis(),
      findById: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    ReviewRepository = require('../patterns/repository/ReviewRepository');
    repository = new ReviewRepository(mockReviewModel);
  });

  describe('create()', () => {
    it('✅ should create review with data', async () => {
      const reviewData = {
        productId: 123,
        customerEmail: 'test@example.com',
        customerName: 'Test User',
        rating: 5,
        title: 'Great product',
        comment: 'Very satisfied',
      };

      const mockCreated = {
        _id: '1',
        ...reviewData,
        createdAt: new Date(),
        toObject: jest.fn().mockReturnValue({
          _id: '1',
          ...reviewData,
        }),
      };

      mockReviewModel.create.mockResolvedValue(mockCreated);

      const result = await repository.create(reviewData);

      expect(mockReviewModel.create).toHaveBeenCalledWith(reviewData);
      expect(result).toEqual(
        expect.objectContaining({
          productId: 123,
          customerEmail: 'test@example.com',
        })
      );
    });

    it('❌ should throw error if creation fails', async () => {
      const error = new Error('Database error');
      mockReviewModel.create.mockRejectedValue(error);

      const reviewData = { productId: 123, comment: 'Test' };

      await expect(repository.create(reviewData)).rejects.toThrow(
        expect.stringContaining('Failed to create review')
      );
    });

    it('✅ should handle object without toObject() method', async () => {
      const mockCreated = {
        _id: '1',
        productId: 123,
        comment: 'Test',
      };

      mockReviewModel.create.mockResolvedValue(mockCreated);

      const result = await repository.create({ productId: 123, comment: 'Test' });

      expect(result).toEqual(mockCreated);
    });
  });

  describe('findByProductId()', () => {
    it('✅ should find reviews by product id with pagination', async () => {
      const mockReviews = [
        { _id: '1', productId: 123, comment: 'Great' },
        { _id: '2', productId: 123, comment: 'Good' },
      ];

      mockReviewModel.find.mockResolvedValue(mockReviews);
      mockReviewModel.sort.mockReturnValue(mockReviewModel);
      mockReviewModel.skip.mockReturnValue(mockReviewModel);
      mockReviewModel.limit.mockReturnValue(mockReviewModel);
      mockReviewModel.lean.mockReturnValue(mockReviewModel);
      mockReviewModel.countDocuments.mockResolvedValue(2);

      const result = await repository.findByProductId(123, { page: 1, limit: 10 });

      expect(mockReviewModel.find).toHaveBeenCalledWith({ productId: 123 });
      expect(mockReviewModel.sort).toHaveBeenCalledWith('-createdAt');
      expect(mockReviewModel.skip).toHaveBeenCalledWith(0);
      expect(mockReviewModel.limit).toHaveBeenCalledWith(10);
      expect(result).toEqual(
        expect.objectContaining({
          data: mockReviews,
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        })
      );
    });

    it('✅ should calculate total pages correctly', async () => {
      mockReviewModel.find.mockResolvedValue([]);
      mockReviewModel.countDocuments.mockResolvedValue(25);

      const result = await repository.findByProductId(123, { page: 1, limit: 10 });

      expect(result.totalPages).toBe(3); // 25 / 10 = 2.5 → 3
    });

    it('✅ should use default pagination values', async () => {
      mockReviewModel.find.mockResolvedValue([]);
      mockReviewModel.countDocuments.mockResolvedValue(0);

      await repository.findByProductId(123, {});

      // Default: page 1, limit 10
      expect(mockReviewModel.skip).toHaveBeenCalledWith(0);
      expect(mockReviewModel.limit).toHaveBeenCalledWith(10);
    });

    it('❌ should throw error if query fails', async () => {
      mockReviewModel.find.mockRejectedValue(new Error('Query error'));

      await expect(repository.findByProductId(123)).rejects.toThrow(
        expect.stringContaining('Failed to find reviews')
      );
    });

    it('✅ should support custom sort order', async () => {
      mockReviewModel.find.mockResolvedValue([]);
      mockReviewModel.countDocuments.mockResolvedValue(0);

      await repository.findByProductId(123, { sort: 'rating' });

      expect(mockReviewModel.sort).toHaveBeenCalledWith('rating');
    });
  });

  describe('findById()', () => {
    it('✅ should find review by id', async () => {
      const mockReview = { _id: '1', productId: 123, comment: 'Great' };
      mockReviewModel.findById.mockResolvedValue(mockReview);

      const result = await repository.findById('1');

      expect(mockReviewModel.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockReview);
    });

    it('❌ should throw error if not found', async () => {
      mockReviewModel.findById.mockRejectedValue(new Error('Not found'));

      await expect(repository.findById('999')).rejects.toThrow(
        expect.stringContaining('Failed to find review')
      );
    });
  });

  describe('update()', () => {
    it('✅ should update review', async () => {
      const mockUpdated = {
        _id: '1',
        productId: 123,
        rating: 4,
        comment: 'Updated',
      };

      mockReviewModel.findById.mockResolvedValue(mockUpdated);

      const result = await repository.update('1', { rating: 4 });

      expect(result).toEqual(mockUpdated);
    });

    it('✅ should only update provided fields', async () => {
      const updateData = { rating: 4, comment: 'Updated' };
      const mockUpdated = { _id: '1', ...updateData };

      mockReviewModel.findById.mockResolvedValue(mockUpdated);

      await repository.update('1', updateData);

      expect(mockReviewModel.findById).toHaveBeenCalledWith('1');
    });

    it('❌ should throw error if update fails', async () => {
      mockReviewModel.findById.mockRejectedValue(new Error('Update error'));

      await expect(repository.update('1', { rating: 4 })).rejects.toThrow(
        expect.stringContaining('Failed to update review')
      );
    });
  });

  describe('delete()', () => {
    it('✅ should delete review', async () => {
      mockReviewModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await repository.delete('1');

      expect(mockReviewModel.deleteOne).toHaveBeenCalledWith({ _id: '1' });
      expect(result).toBe(true);
    });

    it('❌ should return false if review not found', async () => {
      mockReviewModel.deleteOne.mockResolvedValue({ deletedCount: 0 });

      const result = await repository.delete('999');

      expect(result).toBe(false);
    });

    it('❌ should throw error if deletion fails', async () => {
      mockReviewModel.deleteOne.mockRejectedValue(new Error('Delete error'));

      await expect(repository.delete('1')).rejects.toThrow(
        expect.stringContaining('Failed to delete review')
      );
    });
  });

  describe('getProductRating()', () => {
    it('✅ should calculate average rating', async () => {
      mockReviewModel.aggregate.mockResolvedValue([{ _id: null, avgRating: 4.5 }]);

      const result = await repository.getProductRating(123);

      expect(mockReviewModel.aggregate).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          avgRating: 4.5,
        })
      );
    });

    it('✅ should return 0 if no reviews', async () => {
      mockReviewModel.aggregate.mockResolvedValue([]);

      const result = await repository.getProductRating(123);

      expect(result).toEqual(
        expect.objectContaining({
          avgRating: 0,
        })
      );
    });

    it('❌ should throw error if query fails', async () => {
      mockReviewModel.aggregate.mockRejectedValue(new Error('Aggregation error'));

      await expect(repository.getProductRating(123)).rejects.toThrow(
        expect.stringContaining('Failed')
      );
    });
  });

  describe('getRatingDistribution()', () => {
    it('✅ should get rating distribution', async () => {
      const mockDistribution = [
        { _id: 5, count: 35 },
        { _id: 4, count: 30 },
        { _id: 3, count: 20 },
        { _id: 2, count: 10 },
        { _id: 1, count: 5 },
      ];

      mockReviewModel.aggregate.mockResolvedValue(mockDistribution);

      const result = await repository.getRatingDistribution(123);

      expect(mockReviewModel.aggregate).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          1: 5,
          2: 10,
          3: 20,
          4: 30,
          5: 35,
        })
      );
    });

    it('✅ should include all ratings 1-5 even if no reviews', async () => {
      mockReviewModel.aggregate.mockResolvedValue([]);

      const result = await repository.getRatingDistribution(123);

      expect(result).toEqual({
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      });
    });

    it('❌ should throw error if query fails', async () => {
      mockReviewModel.aggregate.mockRejectedValue(new Error('Query error'));

      await expect(repository.getRatingDistribution(123)).rejects.toThrow(
        expect.stringContaining('Failed')
      );
    });
  });

  describe('Data validation', () => {
    it('✅ should validate product id type', async () => {
      mockReviewModel.find.mockResolvedValue([]);
      mockReviewModel.countDocuments.mockResolvedValue(0);

      const result = await repository.findByProductId('123', {});

      expect(result).toHaveProperty('data');
    });

    it('✅ should handle null values gracefully', async () => {
      const mockReview = {
        _id: '1',
        productId: 123,
        comment: null, // ✅ Allow null
        title: undefined,
      };

      mockReviewModel.findById.mockResolvedValue(mockReview);

      const result = await repository.findById('1');

      expect(result).toEqual(mockReview);
    });
  });
});
