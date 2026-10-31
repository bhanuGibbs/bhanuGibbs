// --- Character filtering helpers ---

export const digitsOnly = (value, maxLength) => value.replace(/\D/g, '').slice(0, maxLength);

export const decimalOnly = (value, maxLength) => {
    // Allow only digits and a single decimal point
    let cleaned = value.replace(/[^\d.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
        cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    return cleaned.slice(0, maxLength || 20);
};

export const percentOnly = (value) => {
    // Allow only digits and a single decimal point, max 100
    let cleaned = value.replace(/[^\d.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
        cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    const num = parseFloat(cleaned);
    if (!isNaN(num) && num > 100) {
        cleaned = '100';
    }
    return cleaned;
};

// --- Text field helpers ---

export const textOnly = (value) => {
    // Allow alphabetic characters, spaces, hyphens, apostrophes, commas, periods
    return value.replace(/[^A-Za-z\s\-'.,]/g, '');
};

export const nameOnly = (value) => {
    // Allow alphabetic characters, spaces, hyphens, apostrophes, periods, commas
    return value.replace(/[^A-Za-z\s\-'.,]/g, '');
};

export const addressOnly = (value) => {
    // Allow alphabetic characters, digits, spaces, common address punctuation
    return value.replace(/[^A-Za-z0-9\s\-'.,#/]/g, '');
};

// --- Validation regex patterns ---

export const PHONE_NUMBER_REGEX = /^\d{10}$/;
export const PINCODE_REGEX = /^\d{6}$/;
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const URL_REGEX = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
export const HSN_CODE_REGEX = /^\d{4,8}$/;
export const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
export const NAME_REGEX = /^[A-Za-z][A-Za-z\s'.-]*$/;

// --- Validation functions ---

export const isValidEmail = (value) => EMAIL_REGEX.test(value);

export const isValidUrl = (value) => {
    if (!value || !value.trim()) return true; // optional field
    return URL_REGEX.test(value.trim());
};

export const isValidGstin = (value) => {
    if (!value || !value.trim()) return true; // optional field
    return GSTIN_REGEX.test(value.trim());
};

export const isValidPhone = (value) => {
    if (!value || !value.trim()) return true; // optional field
    return PHONE_NUMBER_REGEX.test(value.trim());
};

export const isValidPincode = (value) => {
    if (!value || !value.trim()) return true; // optional field
    return PINCODE_REGEX.test(value.trim());
};

export const isValidHsnCode = (value) => {
    if (!value || !value.trim()) return true; // optional field
    return HSN_CODE_REGEX.test(value.trim());
};

export const isValidUsername = (value) => {
    if (!value || !value.trim()) return true; // optional field
    return USERNAME_REGEX.test(value.trim());
};

// --- Password validation ---

export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':",.<>?\/\\|]).{8,}$/;

export const isValidPassword = (value) => {
    if (!value) return false;
    return PASSWORD_REGEX.test(value);
};

export const getPasswordError = (value) => {
    if (!value || value.length < 8) {
        return "Password must be at least 8 characters.";
    }
    const checks = [
        { test: /[A-Z]/.test(value), label: "uppercase letter" },
        { test: /[a-z]/.test(value), label: "lowercase letter" },
        { test: /\d/.test(value), label: "number" },
        { test: /[!@#$%^&*()_+\-=\[\]{};':",.<>?\/\\|]/.test(value), label: "special character" },
    ];
    const missing = checks.filter((c) => !c.test).map((c) => c.label);
    if (missing.length > 0) {
        return `Password must contain: ${missing.join(", ")}.`;
    }
    return "";
};

// --- Paste prevention handler ---

export const preventPaste = (event) => {
    event.preventDefault();
    return false;
};
