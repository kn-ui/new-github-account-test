import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, User, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useI18n } from '@/contexts/I18nContext';
import SiteFooter from '../SiteFooter';

export default function ContactPage() {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contactInfo = [
    {
      icon: Phone,
      title: t('contact.cards.phone.title'),
      details: ['+251-11-278-4646', '+251-975726868'],
      description: t('contact.cards.phone.description')
    },
    {
      icon: Mail,
      title: t('contact.cards.email.title'),
      details: ['dhsraguelabssedu21@gmail.com'],
      description: t('contact.cards.email.description')
    },
    {
      icon: MapPin,
      title: t('contact.cards.address.title'),
      details: ['Merkato St.Raguel Church Anqtse birhan Sunday school, Woreda 8', 'Addis Ababa, Ethiopia'],
      description: t('contact.cards.address.description')
    },
    {
      icon: Clock,
      title: t('contact.cards.officeHours.title'),
      details: ['Monday - Friday: 8:00 AM - 5:00 PM', 'Saturday: 9:00 AM - 1:00 PM'],
      description: t('contact.cards.officeHours.description')
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // try {
    //   const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/email/contact`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(formData),
    //   });
    //   if (!response.ok) throw new Error(`HTTP ${response.status}`);
    //   const result = await response.json();
    //   result.success ? toast.success('Message sent!') : toast.error(result.message || 'Failed to send');
    // } catch (error) {
    //   console.error('Failed to send message:', error);
    //   toast.error('Failed to send message. Please try again.');
    // } finally {
    //   setIsSubmitting(false);
    // }
    console.log('Contact form submission attempted (email sending disabled). Data:', formData);
    toast.success('Message sent! (Simulation)');
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-600 to-[#13A0E2]">
      {/* Hero Section */}
      <div className="relative text-white">
        <img src="/assets/background-img.png" alt="background" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">{t('contact.hero.title')}</h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90">{t('contact.hero.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Contact Information Cards */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactInfo.map((info, index) => (
              <div key={index} className="text-center group hover:transform hover:scale-105 transition-all duration-300">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <info.icon className="h-8 w-8 text-blue-700" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{info.title}</h3>
                <div className="space-y-1 mb-2">
                  {info.details.map((detail, detailIndex) => (
                    <p key={detailIndex} className="text-gray-700 font-medium">{detail}</p>
                  ))}
                </div>
                <p className="text-sm text-gray-500">{info.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form and Map */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('contact.form.title')}</h2>
                <p className="text-gray-600">{t('contact.form.subtitle')}</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">{t('contact.form.labels.name')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-5 w-5 text-gray-400" /></div>
                    <input type="text" id="name" name="name" required value={formData.name} onChange={handleInputChange} className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder={t('contact.form.placeholders.name')} />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">{t('contact.form.labels.email')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400" /></div>
                    <input type="email" id="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder={t('contact.form.placeholders.email')} />
                  </div>
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">{t('contact.form.labels.subject')}</label>
                  <input type="text" id="subject" name="subject" required value={formData.subject} onChange={handleInputChange} className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder={t('contact.form.placeholders.subject')} />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">{t('contact.form.labels.message')}</label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none"><MessageSquare className="h-5 w-5 text-gray-400" /></div>
                    <textarea id="message" name="message" required rows={6} value={formData.message} onChange={handleInputChange} className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" placeholder={t('contact.form.placeholders.message')} />
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Send className="h-5 w-5" />
                  <span>{isSubmitting ? t('contact.form.sending') : t('contact.form.submit')}</span>
                </button>
              </form>
            </div>

            {/* Map and Additional Info */}
            <div className="space-y-8">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="h-64 bg-gray-200 flex items-center justify-center">
                  <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3940.335716797473!2d38.737273474775584!3d9.033108288925106!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b85fe8f43d46f%3A0xc0fc09305d08f9c2!2sSt%20Raguel%20church%20school!5e0!3m2!1sen!2set!4v1760704991147!5m2!1sen!2set" className='w-full h-full' loading="lazy"></iframe>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('contact.visit.title')}</h3>
                  <p className="text-gray-600 mb-4">{t('contact.visit.body')}</p>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>{t('contact.visit.address')}</strong>Merkato St.Raguel Church Anqtse birhan Sunday school,Woreda 8</p>
                    <p><strong>{t('contact.visit.city')}</strong> Addis Ababa, Ethiopia</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">{t('contact.quick.title')}</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">{t('contact.quick.emergency.title')}</p>
                      <p className="text-sm text-blue-700">+251-11-278-4646</p>
                    </div>
                  </div>
                  
                </div>
              </div>

            
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}