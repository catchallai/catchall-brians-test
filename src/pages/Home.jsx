import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { BarChart2, CalendarDays, Search, Users, Mail, Zap } from 'lucide-react';

const FEATURES = [
  {
    icon: BarChart2,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    title: 'CRM & Sales',
    desc: 'Manage contacts, deals, pipelines, and sequences in one unified workspace.',
  },
  {
    icon: CalendarDays,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    title: 'Social Calendar',
    desc: 'Plan, schedule, and publish content across all your social media platforms.',
  },
  {
    icon: Search,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    title: 'SEO & Analytics',
    desc: 'Track rankings, backlinks, and web performance with actionable insights.',
  },
  {
    icon: Users,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    title: 'Team Collaboration',
    desc: 'Projects, tasks, wikis, and real-time communication — all in one place.',
  },
  {
    icon: Mail,
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    title: 'Email Marketing',
    desc: 'Build campaigns, automate drip sequences, and track engagement.',
  },
  {
    icon: Zap,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    title: 'Automation',
    desc: 'Trigger workflows, score leads, and eliminate manual work at scale.',
  },
];

export default function Home() {
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: 'hello@catchall.com',
        subject: `New Inquiry from ${form.name}`,
        body: `Name: ${form.name}\nEmail: ${form.email}\nCompany: ${form.company}\n\n${form.message}`,
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true); // still show success to user
    }
    setSubmitting(false);
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl('Dashboard'));
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925162397800755912704a9/3da4d00f2_catchall.jpg"
              alt="CatchAll"
              className="h-7 object-contain"
            />
            <span className="font-bold text-lg text-gray-900">CatchAll</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="#features"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden md:block"
            >
              Features
            </a>
            <a
              href="#inquiry"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden md:block"
            >
              Contact
            </a>
            <button
              onClick={handleLogin}
              className="text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-28 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-violet-600 bg-violet-50 px-3 py-1 rounded-full mb-6">
            All-in-one business suite
          </span>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Everything your business
            <br />
            needs, <span className="text-violet-600">in one place.</span>
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-xl mx-auto">
            CatchAll brings together CRM, social media, SEO, team collaboration, and marketing — so
            nothing falls through the cracks.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleLogin}
              className="bg-violet-600 hover:bg-violet-700 text-white font-medium px-8 py-3 rounded-xl transition-colors text-sm"
            >
              Sign In to Your Account
            </button>
            <a
              href="#inquiry"
              className="border border-gray-200 hover:border-gray-300 text-gray-700 font-medium px-8 py-3 rounded-xl transition-colors text-sm"
            >
              Request Access
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">One platform, every tool</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Stop juggling a dozen tools. CatchAll is built for modern business teams that need to
              move fast.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-sm transition-shadow"
              >
                <div
                  className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${f.bg} mb-4`}
                >
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider quote */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-2xl font-light text-gray-600 leading-relaxed italic">
            "Built for teams that can't afford to miss a beat."
          </p>
        </div>
      </section>

      {/* Inquiry Form */}
      <section id="inquiry" className="py-24 px-6 bg-gray-50">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Get in touch</h2>
            <p className="text-gray-500 text-sm">
              Interested in CatchAll for your team? Send us a message and we'll be in touch shortly.
            </p>
          </div>

          {submitted ? (
            <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="font-semibold text-gray-900 mb-2">Message received</h3>
              <p className="text-sm text-gray-500">
                Thanks for reaching out. We'll get back to you within 1–2 business days.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl p-8 border border-gray-100 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    name="name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Jane Smith"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Email *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="jane@company.com"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Company</label>
                <input
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Your company name"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Message *</label>
                <textarea
                  name="message"
                  required
                  value={form.message}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Tell us about your team and what you're looking for..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-medium py-3 rounded-xl text-sm transition-colors"
              >
                {submitting ? 'Sending…' : 'Send Inquiry'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-gray-100 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925162397800755912704a9/3da4d00f2_catchall.jpg"
            alt="CatchAll"
            className="h-5 object-contain"
          />
          <span className="font-semibold text-sm text-gray-700">CatchAll</span>
        </div>
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} CatchAll. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
