/**
 * backend/patterns/repository/Repository.js
 * 🟢 PURE - Framework-agnostic repository interface
 * 
 * Defines the contract for all data access operations.
 */

/**
 * Interface Repository (Repository Pattern)
 * @class Repository
 * @abstract
 */
class Repository {

  async find(criteria, options = {}) { throw new Error('find() must be implemented'); }

  async findOne(criteria) { throw new Error('findOne() must be implemented'); }

  async findById(id) { throw new Error('findById() must be implemented'); }

  async create(data) { throw new Error('create() must be implemented'); }

  async update(id, data) { throw new Error('update() must be implemented'); }

  async delete(id) { throw new Error('delete() must be implemented'); }

  async count(criteria) { throw new Error('count() must be implemented'); }

  async exists(criteria) { throw new Error('exists() must be implemented'); }
}

module.exports = Repository;
