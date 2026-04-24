const mailer = require('../config/mailer');

/**
 * AuthController - Business logic layer cho Authentication
 */
class AuthController {
  constructor(authRepository) {
    this.authRepository = authRepository;
  }

  /**
   * Normalize user document for frontend payload
   */
  _toUserPayload(doc) {
    if (!doc) return null;
    const plain = doc.toObject ? doc.toObject() : { ...doc };

    delete plain.password;
    delete plain.__v;
    delete plain.resetPasswordOtp;
    delete plain.resetPasswordExpires;

    const fullName =
      plain.fullName ||
      [plain.firstName, plain.lastName].filter(Boolean).join(' ');

    const normalizedEmail = String(plain.email || '').toLowerCase().trim();
    const userRole =
      plain.role || (normalizedEmail === 'admin@gmail.com' ? 'admin' : 'customer');

    return {
      id: String(plain._id || plain.id),
      email: plain.email,
      fullName,
      firstName: plain.firstName,
      lastName: plain.lastName,
      avatarUrl: plain.avatarUrl,
      phone: plain.phone || null,
      gender: plain.gender || null,
      dateOfBirth: plain.dateOfBirth || null,
      addresses: Array.isArray(plain.addresses) ? plain.addresses : [],
      paymentMethods: Array.isArray(plain.paymentMethods)
        ? plain.paymentMethods
        : [],
      wishlist: Array.isArray(plain.wishlist) ? plain.wishlist : [],
      loyalty: plain.loyalty || null,
      preferences: plain.preferences || null,
      consents: plain.consents || null,
      tags: Array.isArray(plain.tags) ? plain.tags : [],
      status: plain.status || 'active',
      role: userRole,
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
    };
  }

  /**
   * Send temporary password email
   */
  async _sendTempPasswordEmail(toEmail, tempPassword) {
    const appName = process.env.APP_NAME || 'Coffee Shop';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const html = `
      <!doctype html>
      <html>
        <head><meta charset="utf-8" /></head>
        <body style="margin:0;padding:24px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
            style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.12);">
            <tr>
              <td style="padding:24px 24px 16px;">
                <h1 style="margin:0 0 8px;font-size:20px;color:#111827;">Your ${appName} account is ready</h1>
                <p style="margin:0 0 16px;font-size:15px;color:#374151;">We've created an account for you so you can track your orders and save your details.</p>
                <p style="margin:0 0 4px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;">Login email</p>
                <p style="margin:0 0 16px;font-size:15px;color:#111827;"><strong>${toEmail}</strong></p>
                <p style="margin:0 0 4px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;">Temporary password</p>
                <p style="margin:0 0 16px;font-size:18px;color:#111827;"><strong>${tempPassword}</strong></p>
                <p style="margin:0 0 16px;font-size:14px;color:#6b7280;">For security, please log in and change this password in your account settings.</p>
                <p style="margin:0;"><a href="${frontendUrl}/account" style="display:inline-block;padding:10px 18px;border-radius:999px;background:#7c3aed;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;">Go to your account</a></p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const from =
      process.env.FROM_EMAIL ||
      process.env.MAIL_FROM ||
      process.env.SMTP_USER ||
      'no-reply@example.com';

    const mailOptions = {
      from,
      to: toEmail,
      subject: `${appName} – your temporary password`,
      html,
    };

    return await mailer.sendMail(mailOptions);
  }

  /**
   * Send reset OTP email
   */
  async _sendResetOtpEmail(toEmail, otp) {
    const from = process.env.FROM_EMAIL || 'no-reply@example.com';

    const html = `
      <div style="font-family:system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height:1.6; color:#111827;">
        <h2 style="margin-bottom:8px;">Reset your password</h2>
        <p>Hello,</p>
        <p>You recently requested to reset the password for your <strong>Coffee Shop</strong> account.</p>
        <p>Your verification code is:</p>
        <p style="font-size:22px; font-weight:700; letter-spacing:4px;">${otp}</p>
        <p>This code is valid for <strong>10 minutes</strong>.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
        <hr style="border:none; border-top:1px solid #e5e7eb; margin:16px 0;" />
        <p style="font-size:12px; color:#6b7280;">This is an automated email from the Coffee Shop system.</p>
      </div>
    `;

    await mailer.sendMail({
      from,
      to: toEmail,
      subject: 'Reset your password - Coffee Shop',
      text: `Your password reset OTP is ${otp} (valid for 10 minutes).`,
      html,
    });
  }

  /**
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const {
        name,
        firstName: bodyFirstName,
        lastName: bodyLastName,
        email,
        password,
        address,
        sendPasswordEmail,
      } = req.body || {};

      const normalizedEmail = String(email || '').toLowerCase().trim();

      if (!normalizedEmail || !password) {
        return res.status(400).json({
          success: false,
          message: 'Missing email or password',
        });
      }

      // Build fullName
      let fullName =
        (name || `${bodyFirstName || ''} ${bodyLastName || ''}` || '').trim();

      if (!fullName) {
        return res.status(400).json({
          success: false,
          message: 'Missing full name',
        });
      }

      // Parse firstName/lastName
      let firstName = bodyFirstName;
      let lastName = bodyLastName;

      if (!firstName || !lastName) {
        const parts = fullName.split(/\s+/).filter(Boolean);
        if (parts.length === 1) {
          firstName = parts[0];
          lastName = parts[0];
        } else if (parts.length > 1) {
          firstName = parts.slice(0, -1).join(' ');
          lastName = parts[parts.length - 1];
        }
      }

      if (!firstName) firstName = fullName;
      if (!lastName) lastName = fullName;

      // Check if email exists
      const emailExists = await this.authRepository.emailExists(normalizedEmail);
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'This email is already registered. Please log in instead.',
        });
      }

      // Create address if provided
      const trimmedAddress =
        typeof address === 'string' ? address.trim() : '';
      const defaultAddresses = trimmedAddress
        ? [
            {
              label: 'home',
              type: 'shipping',
              recipientName: fullName,
              phone: '',
              address: trimmedAddress,
              ward: '',
              district: '',
              city: '',
              isDefault: true,
            },
          ]
        : [];

      // Hash password
      const hashedPassword = await this.authRepository.hashPassword(password);

      // Create customer
      const customer = await this.authRepository.createCustomer({
        firstName,
        lastName,
        fullName,
        email: normalizedEmail,
        password: hashedPassword,
        status: 'active',
        provider: 'local',
        role: normalizedEmail === 'admin@gmail.com' ? 'admin' : 'customer',
        addresses: defaultAddresses,
      });

      // Send temp password email if requested
      const shouldSendTempPassword =
        sendPasswordEmail === true ||
        sendPasswordEmail === 'true' ||
        sendPasswordEmail === 1 ||
        sendPasswordEmail === '1';

      if (shouldSendTempPassword) {
        try {
          await this._sendTempPasswordEmail(customer.email, password);
        } catch (mailErr) {
          console.error('Error sending temp password email:', mailErr.message);
          // Don't fail register if email sends fails
        }
      }

      // Generate token
      const token = this.authRepository.generateToken(
        customer._id.toString()
      );

      return res.status(201).json({
        success: true,
        token,
        user: this._toUserPayload(customer),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body || {};

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Missing email or password',
        });
      }

      const customer = await this.authRepository.findByEmail(email);

      if (!customer || !customer.password) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect email or password',
        });
      }

      const isValid = await this.authRepository.verifyPassword(
        password,
        customer.password
      );

      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect email or password',
        });
      }

      const token = this.authRepository.generateToken(
        customer._id.toString()
      );

      return res.json({
        success: true,
        token,
        user: this._toUserPayload(customer),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/forgot-password/request
   */
  async forgotPasswordRequest(req, res, next) {
    try {
      const { email } = req.body || {};

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Missing email',
        });
      }

      const customer = await this.authRepository.findByEmail(email);

      // Generic response to avoid leaking email existence
      if (!customer) {
        return res.json({
          success: true,
          message: 'If this email exists in our system, we have sent a verification code.',
        });
      }

      // Generate OTP
      const otp = String(Math.floor(100000 + Math.random() * 900000));

      // Save OTP
      await this.authRepository.saveResetOtp(customer._id, otp);

      // Send email
      try {
        await this._sendResetOtpEmail(customer.email, otp);
      } catch (mailErr) {
        console.error('Error sending reset OTP email:', mailErr.message);
        // Don't fail if email send fails
      }

      return res.json({
        success: true,
        message: 'Verification code sent. Please check your email.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/forgot-password/verify
   */
  async forgotPasswordVerify(req, res, next) {
    try {
      const { email, otp, newPassword } = req.body || {};

      if (!email || !otp || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Missing email, OTP, or new password',
        });
      }

      const customer = await this.authRepository.findByEmail(email);

      if (!customer) {
        return res.status(400).json({
          success: false,
          message: 'Incorrect email or verification code',
        });
      }

      // Verify OTP
      const otpResult = await this.authRepository.verifyResetOtp(
        customer._id,
        otp
      );

      if (!otpResult.valid) {
        return res.status(400).json({
          success: false,
          message:
            otpResult.reason === 'OTP expired'
              ? 'Verification code has expired. Please request a new one.'
              : 'Verification code is invalid or has expired',
        });
      }

      // Hash new password
      const hashedPassword = await this.authRepository.hashPassword(
        newPassword
      );

      // Reset password
      const updatedCustomer = await this.authRepository.resetPassword(
        customer._id,
        hashedPassword
      );

      return res.json({
        success: true,
        message: 'Password reset successfully. Please log in with your new password.',
        user: this._toUserPayload(updatedCustomer),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/google (redirect to Google OAuth)
   */
  google(req, res) {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_REDIRECT_URI =
      process.env.GOOGLE_REDIRECT_URI ||
      `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/auth/google/callback`;

    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        message: 'Google OAuth is not configured',
      });
    }

    const rawState = req.query.state || '/';
    const state = decodeURIComponent(rawState);

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
      access_type: 'offline',
      state,
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return res.redirect(googleAuthUrl);
  }

  /**
   * GET /api/auth/google/callback (Google OAuth callback)
   */
  async googleCallback(req, res, next) {
    try {
      const { code, state } = req.query;
      const rawState = state || '/';
      const redirectState = decodeURIComponent(rawState);

      if (!code) {
        return res
          .status(400)
          .json({ success: false, message: 'Missing authorization code' });
      }

      const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
      const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
      const GOOGLE_REDIRECT_URI =
        process.env.GOOGLE_REDIRECT_URI ||
        `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/auth/google/callback`;
      const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

      // Exchange code for token
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: GOOGLE_REDIRECT_URI,
        }),
      });

      if (!tokenRes.ok) {
        const errorText = await tokenRes.text();
        console.error('Google token exchange failed:', errorText);
        return res.status(500).json({
          success: false,
          message: 'Google authentication failed',
        });
      }

      const tokenJson = await tokenRes.json();
      const { access_token } = tokenJson;

      // Get user profile
      const profileRes = await fetch(
        'https://openidconnect.googleapis.com/v1/userinfo',
        { headers: { Authorization: `Bearer ${access_token}` } }
      );

      if (!profileRes.ok) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch Google profile',
        });
      }

      const profile = await profileRes.json();
      const googleEmail = profile.email?.toLowerCase();
      const fullName = profile.name || googleEmail;
      const picture = profile.picture;
      let firstName = profile.given_name;
      let lastName = profile.family_name;

      // Fallback: parse fullName
      if (!firstName || !lastName) {
        const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
        if (parts.length === 1) {
          firstName = parts[0];
          lastName = parts[0];
        } else if (parts.length > 1) {
          firstName = parts.slice(0, -1).join(' ');
          lastName = parts[parts.length - 1];
        }
      }

      if (!firstName) firstName = fullName || googleEmail;
      if (!lastName) lastName = fullName || googleEmail;

      if (!googleEmail) {
        return res.status(400).json({
          success: false,
          message: 'Google account has no email',
        });
      }

      // Find or create customer
      let customer = await this.authRepository.findByEmail(googleEmail);

      if (!customer) {
        const randomPassword = Math.random().toString(36).slice(-12);
        const hashedPassword = await this.authRepository.hashPassword(
          randomPassword
        );

        customer = await this.authRepository.createCustomer({
          fullName,
          firstName,
          lastName,
          email: googleEmail,
          password: hashedPassword,
          status: 'active',
          provider: 'google',
          role: 'customer',
          avatarUrl: picture,
          addresses: [],
        });
      } else {
        // Update profile if needed
        let needUpdate = false;
        const updateData = {};

        if (!customer.fullName && fullName) {
          updateData.fullName = fullName;
          needUpdate = true;
        }
        if (!customer.firstName && firstName) {
          updateData.firstName = firstName;
          needUpdate = true;
        }
        if (!customer.lastName && lastName) {
          updateData.lastName = lastName;
          needUpdate = true;
        }
        if (picture && !customer.avatarUrl) {
          updateData.avatarUrl = picture;
          needUpdate = true;
        }
        if (!customer.provider) {
          updateData.provider = 'google';
          needUpdate = true;
        }

        if (needUpdate) {
          customer = await this.authRepository.updateCustomer(
            customer._id,
            updateData
          );
        }
      }

      // Generate token
      const token = this.authRepository.generateToken(
        customer._id.toString()
      );

      // Redirect to frontend
      const redirectUrl =
        FRONTEND_URL.replace(/\/$/, '') +
        `/auth/google/callback?token=${encodeURIComponent(token)}&next=${encodeURIComponent(redirectState)}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
