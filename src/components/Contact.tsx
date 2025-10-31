import { Mail, Phone, Building2, Send } from 'lucide-react';
import { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    phone: '',
    message: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: '', email: '', organization: '', phone: '', message: '' });
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section id="contact" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Request a Demo
          </h2>
          <p className="text-xl text-[#c9d1d9] max-w-2xl mx-auto">
            See ExamGuard in action. Fill out the form below and our team will reach out to schedule a personalized demonstration.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 sm:p-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-white font-medium mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/50 transition-all"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-white font-medium mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/50 transition-all"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="organization" className="block text-white font-medium mb-2">
                    Organization *
                  </label>
                  <input
                    type="text"
                    id="organization"
                    name="organization"
                    required
                    value={formData.organization}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/50 transition-all"
                    placeholder="University or Institution"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-white font-medium mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/50 transition-all"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-white font-medium mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/50 transition-all resize-none"
                    placeholder="Tell us about your requirements..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#3b82f6] text-white px-8 py-4 rounded-full hover:bg-[#2563eb] transition-all duration-300 transform hover:scale-105 font-semibold text-lg flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/50"
                >
                  <span>{isSubmitted ? 'Request Sent!' : 'Submit Request'}</span>
                  <Send className={`w-5 h-5 ${isSubmitted ? 'animate-pulse' : ''}`} />
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[#3b82f6]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-[#3b82f6]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">Email Us</h3>
                  <p className="text-[#c9d1d9]">sales@examguard.com</p>
                  <p className="text-[#c9d1d9]">support@examguard.com</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[#3b82f6]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-[#3b82f6]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">Call Us</h3>
                  <p className="text-[#c9d1d9]">+1 (800) 555-0123</p>
                  <p className="text-[#c9d1d9] text-sm">Mon-Fri, 9AM-6PM EST</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[#3b82f6]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-[#3b82f6]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">Visit Us</h3>
                  <p className="text-[#c9d1d9]">123 Education Avenue</p>
                  <p className="text-[#c9d1d9]">San Francisco, CA 94105</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#3b82f6]/20 to-[#2563eb]/20 border border-[#3b82f6]/30 rounded-2xl p-8">
              <h3 className="text-white font-bold text-2xl mb-3">Why Choose ExamGuard?</h3>
              <ul className="space-y-3 text-[#c9d1d9]">
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Trusted by 500+ educational institutions</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full mt-2 flex-shrink-0"></div>
                  <span>24/7 customer support and monitoring</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full mt-2 flex-shrink-0"></div>
                  <span>GDPR and FERPA compliant</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Easy integration with existing LMS</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
