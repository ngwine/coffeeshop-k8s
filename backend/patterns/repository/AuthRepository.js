const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Customer = require('../../models/Customer');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

/**
 * AuthRepository - Data access layer cho Authentication
 * Organized into patterns/repository
 */
class AuthRepository {
  async findByEmail(email) {
    if (!email) return null;
    const normalized = String(email).toLowerCase().trim();
    return await Customer.findOne({ email: normalized });
  }

  async findById(id) {
    return await Customer.findById(id);
  }

  async emailExists(email) {
    const normalized = String(email).toLowerCase().trim();
    const existing = await Customer.findOne({
      email: normalized,
      status: { $ne: 'deleted' },
    });
    return !!existing;
  }

  async createCustomer(data) {
    return await Customer.create({
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: data.fullName,
      email: String(data.email).toLowerCase().trim(),
      password: data.password,
      status: data.status || 'active',
      provider: data.provider || 'local',
      role: data.role || 'customer',
      addresses: data.addresses || [],
      avatarUrl: data.avatarUrl,
    });
  }

  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  generateToken(userId, expiresIn = '7d') {
    return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn });
  }

  async updateCustomer(id, updateData) {
    return await Customer.findByIdAndUpdate(id, updateData, { new: true });
  }

  async saveResetOtp(customerId, otp, expiresIn = 10 * 60 * 1000) {
    const expires = new Date(Date.now() + expiresIn);
    return await Customer.findByIdAndUpdate(
      customerId,
      {
        resetPasswordOtp: otp,
        resetPasswordExpires: expires,
      },
      { new: true }
    );
  }

  async verifyResetOtp(customerId, otp) {
    const customer = await Customer.findById(customerId);
    if (!customer) return { valid: false, reason: 'Customer not found' };

    if (!customer.resetPasswordOtp || !customer.resetPasswordExpires) {
      return { valid: false, reason: 'No reset request found' };
    }

    if (String(customer.resetPasswordOtp) !== String(otp)) {
      return { valid: false, reason: 'Invalid OTP' };
    }

    if (customer.resetPasswordExpires < new Date()) {
      return { valid: false, reason: 'OTP expired' };
    }

    return { valid: true, customer };
  }

  async resetPassword(customerId, newHashedPassword) {
    return await Customer.findByIdAndUpdate(
      customerId,
      {
        password: newHashedPassword,
        resetPasswordOtp: undefined,
        resetPasswordExpires: undefined,
      },
      { new: true }
    );
  }

  async updateAvatar(customerId, avatarUrl) {
    return await Customer.findByIdAndUpdate(
      customerId,
      { avatarUrl },
      { new: true }
    );
  }
}

module.exports = AuthRepository;
