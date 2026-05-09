const bcrypt = require("bcryptjs");
const prisma = require("../utils/prismaClient");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateToken");

// ─── REGISTER ───────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // 2. Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Save user to database
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role?.toUpperCase() === "ORGANIZER" ? "ORGANIZER" : "ATTENDEE",
      },
      // Never return the password field
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    console.log("Created user");
    
    // 4. Generate JWT
    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id, role: user.role });

    // 5. Send response
    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      data: { user, accessToken, refreshToken },
    });

  } catch (error) {
    next(error);
  }
};

// ─── LOGIN ───────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // 3. Generate tokens
    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id, role: user.role });

    // 4. Return — client stores both tokens
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
    });

  } catch (error) {
    next(error);
  }
};

// ─── REFRESH ──────────────────────────────────────────
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    // 1. Verify the refresh token signature + expiry
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: err.name === "TokenExpiredError"
          ? "Refresh token has expired. Please login again."
          : "Invalid refresh token.",
      });
    }

    // 2. Check user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists.",
      });
    }

    // 3. Issue a new access token only
    const newAccessToken = generateAccessToken({ id: user.id, role: user.role });

    return res.status(200).json({
      success: true,
      message: "Access token refreshed.",
      data: {
        accessToken: newAccessToken,
      },
    });

  } catch (error) {
    next(error);
  }
};

// ─── LOGOUT ───────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    // JWT is stateless — logout is handled client-side by deleting tokens.
    // Server just confirms the action.
    return res.status(200).json({
      success: true,
      message: "Logged out successfully. Please delete your tokens on the client.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refresh, logout };

