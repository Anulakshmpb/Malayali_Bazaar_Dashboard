import React, { useState } from "react";
// import { useToast } from "../ToastContext/ToastContext";
// import { doc, setDoc, getDoc } from "firebase/firestore";
// import { db } from "../../../Config/Config";
import { Save, Plus, X, Globe, Mail, Phone, MapPin, Clock, Link, RefreshCw } from "lucide-react";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
} from "react-icons/fa";

export default function Footer() {
  const [loading, setLoading] = useState(false);

  const [footerData, setFooterData] = useState({
    companyName: "",
    companyDescription: "",
    copyrightText: "",
    socialMedia: {
      facebook: "",
      twitter: "",
      instagram: "",
      linkedin: "",
      youtube: "",
    },
    quickLinks: [],
    contactInfo: {
      email: "",
      phone: "",
      address: "",
      alternate_no: "",
      working_hrs: "",
    },
  });

  const [newQuickLink, setNewQuickLink] = useState({ title: "", url: "" });

  const handleInputChange = (field, value) => {
    setFooterData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSocialMediaChange = (platform, value) => {
    setFooterData((prev) => ({
      ...prev,
      socialMedia: { ...prev.socialMedia, [platform]: value },
    }));
  };

  const handleContactInfoChange = (field, value) => {
    setFooterData((prev) => ({
      ...prev,
      contactInfo: { ...prev.contactInfo, [field]: value },
    }));
  };

  const addQuickLink = () => {
    if (newQuickLink.title.trim() && newQuickLink.url.trim()) {
      setFooterData((prev) => ({
        ...prev,
        quickLinks: [...prev.quickLinks, { ...newQuickLink }],
      }));
      setNewQuickLink({ title: "", url: "" });
    }
  };

  const removeQuickLink = (index) => {
    setFooterData((prev) => ({
      ...prev,
      quickLinks: prev.quickLinks.filter((_, i) => i !== index),
    }));
  };

  const inputClass =
    "w-full border border-tertiary/60 rounded-xl px-4 py-3 text-sm bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-colors placeholder:text-secondary/50 font-medium text-gray-900";

  const socialInputClass =
    "w-full border border-tertiary/60 rounded-lg px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors placeholder:text-secondary/50 font-medium text-gray-900";

  return (
    <div className="min-h-screen bg-white pb-12 page-container">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-secondary text-transparent bg-clip-text">
              Footer Management
            </h1>
            <p className="text-secondary/80 mt-1 text-sm font-medium">
              Manage footer content, links, and social media
            </p>
          </div>
        </div>

        <form>
          <div className="space-y-5">

            {/* Company Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-tertiary/40 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Globe className="w-4 h-4 text-primary" />
                </span>
                Company Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Company Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={footerData.companyName}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                    placeholder="Your Company Name"
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Company Description
                  </label>
                  <textarea
                    value={footerData.companyDescription}
                    onChange={(e) => handleInputChange("companyDescription", e.target.value)}
                    placeholder="Brief description about your company"
                    rows="3"
                    className={`${inputClass} resize-none`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Copyright Text <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={footerData.copyrightText}
                    onChange={(e) => handleInputChange("copyrightText", e.target.value)}
                    placeholder="© 2024 Company Name. All rights reserved."
                    required
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-tertiary/40 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Phone className="w-4 h-4 text-emerald-600" />
                </span>
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-secondary/50" /> Email
                  </label>
                  <input
                    type="email"
                    value={footerData.contactInfo.email}
                    onChange={(e) => handleContactInfoChange("email", e.target.value)}
                    placeholder="contact@company.com"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-secondary/50" /> Phone
                  </label>
                  <input
                    type="tel"
                    value={footerData.contactInfo.phone}
                    onChange={(e) => handleContactInfoChange("phone", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-secondary/50" /> Alternate Phone No
                  </label>
                  <input
                    type="tel"
                    value={footerData.contactInfo.alternate_no}
                    onChange={(e) => handleContactInfoChange("alternate_no", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-secondary/50" /> Working Hours
                  </label>
                  <input
                    type="text"
                    value={footerData.contactInfo.working_hrs}
                    onChange={(e) => handleContactInfoChange("working_hrs", e.target.value)}
                    placeholder="MON-FRI 9.00-5.00"
                    className={inputClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-secondary/50" /> Address
                  </label>
                  <textarea
                    value={footerData.contactInfo.address}
                    onChange={(e) => handleContactInfoChange("address", e.target.value)}
                    placeholder="123 Main St, City, State, ZIP"
                    rows="2"
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="bg-white rounded-2xl shadow-sm border border-tertiary/40 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
                  <Globe className="w-4 h-4 text-sky-600" />
                </span>
                Social Media Links
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50/60 border border-blue-100 p-4 rounded-xl">
                  <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FaFacebookF className="text-blue-600 w-4 h-4" /> Facebook
                  </label>
                  <input
                    type="url"
                    value={footerData.socialMedia.facebook}
                    onChange={(e) => handleSocialMediaChange("facebook", e.target.value)}
                    placeholder="https://facebook.com/yourpage"
                    className={socialInputClass}
                  />
                </div>
                <div className="bg-sky-50/60 border border-sky-100 p-4 rounded-xl">
                  <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FaTwitter className="text-sky-500 w-4 h-4" /> Twitter
                  </label>
                  <input
                    type="url"
                    value={footerData.socialMedia.twitter}
                    onChange={(e) => handleSocialMediaChange("twitter", e.target.value)}
                    placeholder="https://twitter.com/yourhandle"
                    className={socialInputClass}
                  />
                </div>
                <div className="bg-pink-50/60 border border-pink-100 p-4 rounded-xl">
                  <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FaInstagram className="text-pink-500 w-4 h-4" /> Instagram
                  </label>
                  <input
                    type="url"
                    value={footerData.socialMedia.instagram}
                    onChange={(e) => handleSocialMediaChange("instagram", e.target.value)}
                    placeholder="https://instagram.com/yourprofile"
                    className={socialInputClass}
                  />
                </div>
                <div className="bg-blue-50/60 border border-blue-100 p-4 rounded-xl">
                  <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FaLinkedinIn className="text-blue-700 w-4 h-4" /> LinkedIn
                  </label>
                  <input
                    type="url"
                    value={footerData.socialMedia.linkedin}
                    onChange={(e) => handleSocialMediaChange("linkedin", e.target.value)}
                    placeholder="https://linkedin.com/company/yourcompany"
                    className={socialInputClass}
                  />
                </div>
                <div className="bg-red-50/60 border border-red-100 p-4 rounded-xl md:col-span-2">
                  <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FaYoutube className="text-red-600 w-4 h-4" /> YouTube
                  </label>
                  <input
                    type="url"
                    value={footerData.socialMedia.youtube}
                    onChange={(e) => handleSocialMediaChange("youtube", e.target.value)}
                    placeholder="https://youtube.com/c/yourchannel"
                    className={socialInputClass}
                  />
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl shadow-sm border border-tertiary/40 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                  <Link className="w-4 h-4 text-violet-600" />
                </span>
                Quick Links
              </h2>

              {/* Add Link Row */}
              <div className="bg-slate-50/70 border border-tertiary/40 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newQuickLink.title}
                    onChange={(e) => setNewQuickLink({ ...newQuickLink, title: e.target.value })}
                    placeholder="Link Title (e.g., Privacy Policy)"
                    className="border border-tertiary/60 rounded-lg px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors placeholder:text-secondary/50 font-medium text-gray-900"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newQuickLink.url}
                      onChange={(e) => setNewQuickLink({ ...newQuickLink, url: e.target.value })}
                      placeholder="URL (e.g., /privacy)"
                      className="flex-1 border border-tertiary/60 rounded-lg px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors placeholder:text-secondary/50 font-medium text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={addQuickLink}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-secondary transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/20 active:scale-95"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Links List */}
              {footerData.quickLinks.length > 0 ? (
                <div className="space-y-2">
                  {footerData.quickLinks.map((link, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-slate-50 border border-tertiary/40 p-3.5 rounded-xl group hover:border-tertiary/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                          <Link className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div>
                          <span className="block text-sm font-bold text-gray-900">{link.title}</span>
                          <span className="text-xs text-secondary/70 font-medium">{link.url}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQuickLink(index)}
                        className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200/60 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-secondary/50">
                  <div className="text-4xl mb-3">🔗</div>
                  <p className="text-sm font-medium">No quick links added yet</p>
                  <p className="text-xs mt-1">Use the form above to add navigation links</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl border border-tertiary/60 bg-white px-5 py-2.5 text-sm font-bold text-gray-900 shadow-sm hover:bg-slate-50 transition-colors focus:outline-none"
              >
                <RefreshCw className="w-4 h-4 text-secondary" /> Reset
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-8 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-secondary transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <><Save className="w-4 h-4" /> Save Changes</>
                )}
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}