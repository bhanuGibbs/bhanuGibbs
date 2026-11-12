import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { id: 'features', label: 'Features' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'industries', label: 'Industries' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'contact', label: 'Contact' },
];

const LandingNavbar = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);

      // Determine active section
      const sections = navLinks.map((link) => document.getElementById(link.id)).filter(Boolean);
      const scrollPos = window.scrollY + 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPos) {
          setActiveSection(navLinks[i].id);
          break;
        }
      }
      if (scrollPos < 100) setActiveSection('');
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      element.scrollIntoView({ behavior });
    }
  };

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-card-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
        {/* Logo */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2.5"
          aria-label="Go to top"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1E3A5F]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 17V3H17V17H7Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 21H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 9H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 13H13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-[#1E3A5F]">KeelBill</span>
        </button>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className={`relative text-sm font-medium transition ${
                activeSection === link.id
                  ? 'text-[#FF6B35]'
                  : 'text-[#2D3748]/70 hover:text-[#1E3A5F]'
              }`}
            >
              {link.label}
              {activeSection === link.id && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-[#FF6B35]" />
              )}
            </button>
          ))}
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-[#2D3748]/70 transition hover:text-[#1E3A5F]"
          >
            Login
          </button>
          <button
            onClick={() => scrollTo('contact')}
            className="inline-flex items-center rounded-xl bg-[#FF6B35] px-5 py-2.5 text-sm font-semibold text-white shadow-cta transition hover:bg-[#e55a28] hover:shadow-cta-hover active:translate-y-px"
          >
            Book Demo
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl text-[#1E3A5F] transition hover:bg-[#1E3A5F]/5 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-[#1E3A5F]/5 bg-white px-5 py-4 sm:px-8 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="rounded-xl px-4 py-3 text-left text-sm font-medium text-[#2D3748] transition hover:bg-[#1E3A5F]/5"
              >
                {link.label}
              </button>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/login');
                }}
                className="w-full rounded-xl border border-[#1E3A5F]/15 px-5 py-3 text-sm font-semibold text-[#1E3A5F] transition hover:bg-[#1E3A5F]/5"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  scrollTo('contact');
                }}
                className="w-full rounded-xl bg-[#FF6B35] px-5 py-3 text-sm font-semibold text-white shadow-cta transition hover:bg-[#e55a28]"
              >
                Book Demo
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default LandingNavbar;
