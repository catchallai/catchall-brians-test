// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// URL validation
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Phone validation (basic)
export const isValidPhone = (phone) => {
  const phoneRegex = /^[\d\s\-\+\(\)]{7,20}$/;
  return !phone || phoneRegex.test(phone);
};

// Sanitize HTML/script tags
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
};

// Sanitize object recursively
export const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeInput(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized = {};
  for (const key in obj) {
    sanitized[key] = sanitizeObject(obj[key]);
  }
  return sanitized;
};

// Form validation helper
export const validateForm = (data, rules) => {
  const errors = {};

  for (const field in rules) {
    const value = data[field];
    const fieldRules = rules[field];

    if (fieldRules.required && (!value || value.toString().trim() === '')) {
      errors[field] = fieldRules.message || `${field} is required`;
      continue;
    }

    if (value && fieldRules.email && !isValidEmail(value)) {
      errors[field] = 'Please enter a valid email address';
    }

    if (value && fieldRules.url && !isValidUrl(value)) {
      errors[field] = 'Please enter a valid URL';
    }

    if (value && fieldRules.phone && !isValidPhone(value)) {
      errors[field] = 'Please enter a valid phone number';
    }

    if (value && fieldRules.minLength && value.length < fieldRules.minLength) {
      errors[field] = `Must be at least ${fieldRules.minLength} characters`;
    }

    if (value && fieldRules.maxLength && value.length > fieldRules.maxLength) {
      errors[field] = `Must be less than ${fieldRules.maxLength} characters`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Debounce helper
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Rate limiter for AI features
const rateLimitStore = {};
export const checkRateLimit = (key, maxRequests = 5, windowMs = 60000) => {
  const now = Date.now();
  if (!rateLimitStore[key]) {
    rateLimitStore[key] = [];
  }

  // Clean old entries
  rateLimitStore[key] = rateLimitStore[key].filter((time) => now - time < windowMs);

  if (rateLimitStore[key].length >= maxRequests) {
    return {
      allowed: false,
      remainingTime: Math.ceil((rateLimitStore[key][0] + windowMs - now) / 1000),
    };
  }

  rateLimitStore[key].push(now);
  return { allowed: true, remaining: maxRequests - rateLimitStore[key].length };
};
