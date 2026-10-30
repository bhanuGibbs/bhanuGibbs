export const digitsOnly = (value, maxLength) => value.replace(/\D/g, '').slice(0, maxLength);
export const PHONE_NUMBER_REGEX = /^\d{10}$/;
export const PINCODE_REGEX = /^\d{6}$/;
