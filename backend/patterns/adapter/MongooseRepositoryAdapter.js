/**
 * backend/patterns/adapter/MongooseRepositoryAdapter.js
 * 🔗 ADAPTER - Adapts pure Repository to Mongoose
 * 
 * Implements Repository interface for MongoDB/Mongoose.
 * This is the ONLY place where Mongoose specifics exist.
 */

const Repository = require('../repository/Repository');

class MongooseRepositoryAdapter extends Repository {
  constructor(mongooseModel) {
    super();
    this.model = mongooseModel;
    this.name = mongooseModel.modelName;
    console.log(`✅ [MongooseAdapter] Created for model: ${this.name}`);
  }

  /**
   * Find multiple records - implements pure interface with Mongoose
   */
  async find(criteria = {}, options = {}) {
    try {
      const { page = 1, limit = 10, sort = '-createdAt' } = options;
      const skip = (page - 1) * limit;

      const mongooseCriteria = this._buildMongooseCriteria(criteria);

      const [data, total] = await Promise.all([
        this.model.find(mongooseCriteria)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        this.model.countDocuments(mongooseCriteria),
      ]);

      return {
        data,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new Error(`[${this.name}] Find failed: ${error.message}`);
    }
  }

  async findOne(criteria) {
    try {
      const mongooseCriteria = this._buildMongooseCriteria(criteria);
      return await this.model.findOne(mongooseCriteria).lean();
    } catch (error) {
      throw new Error(`[${this.name}] FindOne failed: ${error.message}`);
    }
  }

  /**
   * @param {string} id - Khóa chính
   */
  async findById(id) {
    try {
      return await this.model.findById(id).lean();
    } catch (error) {
      if (error.name === 'CastError') {
        return null;
      }
      throw new Error(`[${this.name}] FindById failed: ${error.message}`);
    }
  }

  async create(data) {
    try {
      const doc = await this.model.create(data);
      return doc.toObject ? doc.toObject() : doc;
    } catch (error) {
      throw new Error(`[${this.name}] Create failed: ${error.message}`);
    }
  }

  /**
   * @param {string} idOrCriteria - ID hoặc tiêu chí cập nhật
   */
  async update(idOrCriteria, data) {
    try {
      const validated = {
        ...data,
        updatedAt: new Date(),
      };

      // If criteria object is provided instead of ID
      if (typeof idOrCriteria === 'object' && idOrCriteria !== null && !idOrCriteria._bsontype) {
        const mongooseCriteria = this._buildMongooseCriteria(idOrCriteria);
        const result = await this.model.updateMany(
          mongooseCriteria,
          { $set: validated },
          { runValidators: true }
        );
        return result.modifiedCount > 0;
      }

      // Default to findByIdAndUpdate
      const updated = await this.model.findByIdAndUpdate(
        idOrCriteria,
        { $set: validated },
        { new: true, runValidators: true }
      ).lean();

      return updated;
    } catch (error) {
      throw new Error(`[${this.name}] Update failed: ${error.message}`);
    }
  }

  /**
   * @param {string} idOrCriteria - ID hoặc tiêu chí xóa
   */
  async delete(idOrCriteria) {
    try {
      // If criteria object is provided
      if (typeof idOrCriteria === 'object' && idOrCriteria !== null && !idOrCriteria._bsontype) {
        const mongooseCriteria = this._buildMongooseCriteria(idOrCriteria);
        const result = await this.model.deleteMany(mongooseCriteria);
        return result.deletedCount > 0;
      }

      // Default to findByIdAndDelete
      const result = await this.model.findByIdAndDelete(idOrCriteria);
      return !!result;
    } catch (error) {
      if (error.name === 'CastError') {
        return false;
      }
      throw new Error(`[${this.name}] Delete failed: ${error.message}`);
    }
  }


  async count(criteria = {}) {
    try {
      return await this.model.countDocuments(criteria);
    } catch (error) {
      throw new Error(`[${this.name}] Count failed: ${error.message}`);
    }
  }

  async exists(criteria) {
    try {
      const result = await this.model.exists(criteria);
      return !!result;
    } catch (error) {
      throw new Error(`[${this.name}] Exists failed: ${error.message}`);
    }
  }

  // async aggregate(pipeline) {
  //   try {
  //     return await this.model.aggregate(pipeline);
  //   } catch (error) {
  //     throw new Error(`[${this.name}] Aggregate failed: ${error.message}`);
  //   }
  // }

  _buildMongooseCriteria(pureCriteria = {}) {
    const mongooseCriteria = {};

    for (const key of Object.keys(pureCriteria)) {
      const value = pureCriteria[key];

      if (key === '_categoryRegex') {
        mongooseCriteria.category = {
          $regex: value,
          $options: pureCriteria._categoryOptions || 'i',
        };
        delete mongooseCriteria._categoryOptions;
        continue;
      }

      if (key === '_categoryOptions') continue;

      if (key === '_searchFields' && pureCriteria._searchTerm) {
        const fields = value || [];
        const term = pureCriteria._searchTerm;
        mongooseCriteria.$or = fields.map((field) => ({
          [field]: { $regex: term, $options: 'i' },
        }));
        continue;
      }

      if (key === '_searchTerm') continue;

      if (key === '_priceRange') {
        const { min, max } = value;
        mongooseCriteria.price = {};
        if (min !== undefined) mongooseCriteria.price.$gte = min;
        if (max !== undefined) mongooseCriteria.price.$lte = max;
        continue;
      }

      if (key === '_minRating') {
        mongooseCriteria.rating = { $gte: value };
        continue;
      }

      if (key === '_categoryName') {
        mongooseCriteria.category = value;
        continue;
      }

      if (typeof value === 'object' && value !== null) {
        if (value._in !== undefined) {
          mongooseCriteria[key] = { $in: value._in };
          continue;
        }
        if (value._gt !== undefined) {
          mongooseCriteria[key] = { $gt: value._gt };
          continue;
        }
        if (value._gte !== undefined) {
          mongooseCriteria[key] = { $gte: value._gte };
          continue;
        }
        if (value._lt !== undefined) {
          mongooseCriteria[key] = { $lt: value._lt };
          continue;
        }
        if (value._lte !== undefined) {
          mongooseCriteria[key] = { $lte: value._lte };
          continue;
        }
        if (value._regex !== undefined) {
          mongooseCriteria[key] = {
            $regex: value._regex,
            $options: value._options || 'i',
          };
          continue;
        }
      }

      mongooseCriteria[key] = value;
    }

    return mongooseCriteria;
  }

  /**
   * Run MongoDB aggregation pipeline
   * @param {Array} pipeline - MongoDB aggregation pipeline stages
   * @returns {Promise<Array>} Aggregation results
   */
  async aggregate(pipeline) {
    try {
      return await this.model.aggregate(pipeline);
    } catch (error) {
      throw new Error(`[${this.name}] Aggregate failed: ${error.message}`);
    }
  }
}

module.exports = MongooseRepositoryAdapter;
