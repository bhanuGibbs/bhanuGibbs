import dayjs from 'dayjs';

export const defaultValues = {
  company: {
    name: '',
    address: '',
    country: '',
    state: '',
    city: '',
    pincode: '',
    gstin: '',
    phone: '',
    email: '',
    website: '',
  },
  customer: {
    name: '',
    companyName: '',
    address: '',
    country: '',
    state: '',
    city: '',
    pincode: '',
    gstNumber: '',
    phone: '',
    email: '',
  },
  quotation: {
    quotationNumber: '',
    quotationDate: dayjs().format('YYYY-MM-DD'),
    validUntil: dayjs().add(15, 'day').format('YYYY-MM-DD'),
    currency: 'INR',
    terms: 'Payment due within 15 days from the date of invoice. Goods once sold will not be exchanged. Any dispute shall be resolved in the courts of Bengaluru.',
  },
  items: [],
  shipping: 0,
};
