const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 2705;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// In-memory user database (replace with a real database in production)
const users = {
  students: [
    {
      id: 1,
      email: "student@example.com",
      password: "$2b$10$X7EBGITGHmJYYYZZZ.YYYOj8zxjmvWRFyFABCDEFGHIJKLMNOPQRST", // hashed "password"
      name: "John Smith",
      role: "student",
      courses: [1, 2, 3]
    }
  ],
  faculty: [
    {
      id: 1,
      email: "faculty@example.com",
      password: "$2b$10$X7EBGITGHmJYYYZZZ.YYYOj8zxjmvWRFyFABCDEFGHIJKLMNOPQRST", // hashed "password"
      name: "Prof. Robert Johnson",
      role: "faculty",
      courses: [1, 2, 3]
    }
  ],
  admins: [
    {
      id: 1,
      email: "admin@example.com",
      password: "$2b$10$X7EBGITGHmJYYYZZZ.YYYOj8zxjmvWRFyFABCDEFGHIJKLMNOPQRST", // hashed "password"
      name: "Admin User",
      role: "admin"
    }
  ]
};

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  // Get token from Authorization header or cookies
  const authHeader = req.headers['authorization'];
  const tokenFromHeader = authHeader && authHeader.split(' ')[1];
  const tokenFromCookie = req.cookies.token;
  const token = tokenFromHeader || tokenFromCookie;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Login route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate input
    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Email, password, and role are required' });
    }

    // Find user by email (case-insensitive) and role
    let user = null;
    const emailLowerCase = email.toLowerCase();

    if (role === 'student') {
      user = users.students.find(u => u.email.toLowerCase() === emailLowerCase);
    } else if (role === 'faculty') {
      user = users.faculty.find(u => u.email.toLowerCase() === emailLowerCase);
    } else if (role === 'admin') {
      user = users.admins.find(u => u.email.toLowerCase() === emailLowerCase);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // In a real app, you would use bcrypt.compare
    // For this example, we'll simulate password verification
    const passwordMatch = password === 'password'; // Replace with bcrypt.compare in production

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set token as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Return user info and token
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token // Include token in response for API clients
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Logout route
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// Get current user route
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Register route
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check if email already exists (case-insensitive)
    const emailLowerCase = email.toLowerCase();
    const emailExists = 
      users.students.some(u => u.email.toLowerCase() === emailLowerCase) ||
      users.faculty.some(u => u.email.toLowerCase() === emailLowerCase) ||
      users.admins.some(u => u.email.toLowerCase() === emailLowerCase);

    if (emailExists) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // In a real app, you would hash the password with bcrypt
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: Date.now(),
      name,
      email: emailLowerCase, // Store email in lowercase
      password, // This would be hashedPassword in production
      role,
      courses: []
    };

    // Add to appropriate role array
    if (role === 'student') {
      users.students.push(newUser);
    } else if (role === 'faculty') {
      users.faculty.push(newUser);
    } else if (role === 'admin') {
      users.admins.push(newUser);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      userId: newUser.id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Serve the login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Catch-all route to serve the main HTML file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});