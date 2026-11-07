import { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { submitContactForm } from '../integration/backend/contact';

const ContactForm = () => {
  const [form, setForm] = useState({ name: '', email: '', mobile: '', message: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Enter a valid email';
    }
    if (!form.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^\+?[0-9]{6,15}$/.test(form.mobile.trim())) {
      newErrors.mobile = 'Enter a valid mobile number';
    }
    if (!form.message.trim()) newErrors.message = 'Message is required';
    else if (form.message.trim().length < 10) newErrors.message = 'Message must be at least 10 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await submitContactForm({
        name: form.name.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        message: form.message.trim(),
      });
      toast.success('Thank you! We will get back to you soon.');
      setForm({ name: '', email: '', mobile: '', message: '' });
      setErrors({});
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
      {/* Contact Form */}
      <div className="lg:col-span-3">
        <h3 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          Send us a message
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          Have a question or want a demo? Fill out the form and we will respond within 24 hours.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
          <div>
            <label htmlFor="contact-name" className="block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              id="contact-name"
              type="text"
              value={form.name}
              onChange={handleChange('name')}
              placeholder="Your full name"
              className={`mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm outline-none transition focus:bg-white ${
                errors.name
                  ? 'border-rose-300 focus:border-rose-500'
                  : 'border-slate-200 focus:border-emerald-500'
              }`}
            />
            {errors.name && <p className="mt-1.5 text-xs text-rose-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="contact-email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="contact-email"
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              placeholder="you@example.com"
              className={`mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm outline-none transition focus:bg-white ${
                errors.email
                  ? 'border-rose-300 focus:border-rose-500'
                  : 'border-slate-200 focus:border-emerald-500'
              }`}
            />
            {errors.email && <p className="mt-1.5 text-xs text-rose-600">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="contact-mobile" className="block text-sm font-medium text-slate-700">
              Mobile Number
            </label>
            <input
              id="contact-mobile"
              type="tel"
              value={form.mobile}
              onChange={handleChange('mobile')}
              placeholder="+91 1234567890"
              className={`mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm outline-none transition focus:bg-white ${
                errors.mobile
                  ? 'border-rose-300 focus:border-rose-500'
                  : 'border-slate-200 focus:border-emerald-500'
              }`}
            />
            {errors.mobile && <p className="mt-1.5 text-xs text-rose-600">{errors.mobile}</p>}
          </div>

          <div>
            <label htmlFor="contact-message" className="block text-sm font-medium text-slate-700">
              Message
            </label>
            <textarea
              id="contact-message"
              rows={5}
              value={form.message}
              onChange={handleChange('message')}
              placeholder="Tell us how we can help..."
              className={`mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm outline-none transition focus:bg-white resize-none ${
                errors.message
                  ? 'border-rose-300 focus:border-rose-500'
                  : 'border-slate-200 focus:border-emerald-500'
              }`}
            />
            {errors.message && <p className="mt-1.5 text-xs text-rose-600">{errors.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Send size={16} />
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>

      {/* Static Contact Details */}
      <div className="lg:col-span-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">
            Contact details
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Reach us directly through any of these channels.
          </p>

          <div className="mt-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Email</p>
                <a href="mailto:hello@keelbill.com" className="text-sm text-emerald-700 hover:text-emerald-800">
                  keelbillsol@gmail.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Phone size={18} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Phone</p>
                <a href="tel:+911234567890" className="text-sm text-emerald-700 hover:text-emerald-800">
                  +91 7893599474
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Office</p>
                <p className="text-sm text-slate-600">
                  Vizianagaram Andhrapradesh<br />India
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactForm;
