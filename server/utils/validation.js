const validator = require('validator');
const sanitize = require('sanitize-html');

class Validation {
  static sanitizeString(input) {
    if (!input) return '';
    return sanitize(input, {
      allowedTags: [],
      allowedAttributes: {},
      disallowedTagsMode: 'discard'
    });
  }

  static validateEmail(email) {
    if (!email) return false;
    return validator.isEmail(email) && email.length <= 254;
  }

  static validatePassword(password) {
    if (!password) return false;
    return validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    });
  }

  static validatePhone(phone) {
    if (!phone) return false;
    const cleaned = phone.replace(/[^0-9+\-() ]/g, '');
    return validator.isMobilePhone(cleaned, 'any') || 
           validator.isLength(cleaned, { min: 10, max: 15 });
  }

  static validateName(name) {
    if (!name) return false;
    const cleaned = name.replace(/[<>&"']/g, '');
    return cleaned.length >= 2 && cleaned.length <= 50;
  }

  static validateVehicleNumber(vehicleNumber) {
    if (!vehicleNumber) return false;
    const cleaned = vehicleNumber.trim().toUpperCase();
    return cleaned.length >= 4 && cleaned.length <= 20;
  }

  static validateDate(date) {
    if (!date) return false;
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  }

  static validateObjectId(id) {
    if (!id) return false;
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  static sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}

module.exports = Validation;
