import React, { useState, useEffect } from "react";
// import { useToast } from "../ToastContext/ToastContext";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../../Config/Config";
import {
  Save,
  Plus,
  X,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Globe,
} from "lucide-react";

export default function Footer() {
//   const { showSuccess, showError, showInfo } = useToast();
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
      alternate_no:"",
      working_hrs:"",
    },
  });

  const [newQuickLink, setNewQuickLink] = useState({ title: "", url: "" });

  useEffect(() => {
    fetchFooterData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFooterData = async () => {
    try {
      const docRef = doc(db, "website-management", "footer");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFooterData({
          companyName: data.companyName || "",
          companyDescription: data.companyDescription || "",
          copyrightText: data.copyrightText || "",
          socialMedia: data.socialMedia || {
            facebook: "",
            twitter: "",
            instagram: "",
            linkedin: "",
            youtube: "",
          },
          quickLinks: data.quickLinks || [],
          contactInfo: data.contactInfo || { email: "", phone: "", address: "",alternate_no:"",working_hrs:"" },
        });
      }
    } catch (error) {
      alert("Failed to load footer data");
      console.error(error);
    }
  };

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

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(
        doc(db, "website-management", "footer"),
        { ...footerData, updatedAt: new Date() },
        { merge: true }
      );
      alert("Footer updated successfully");
    } catch (error) {
     alert("Failed to update footer");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    fetchFooterData();
    alert("Form reset to saved values");
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="mb-6">
        <h4 className="text-2xl font-bold text-black flex items-center gap-2">
          <Globe size={20} className="text-black" /> Footer Management
        </h4>
        <p className="text-gray-600 mt-2">Manage footer content, links, and social media</p>
        {/* <div className="w-24 h-1 bg-gray-300 rounded mt-2"></div> */}
      </div>

      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <form onSubmit={handleSave}>
          <div className="p-6 space-y-6">
            {/* Company Information */}
            <div className="border-b pb-6">
              <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Globe size={20} className="text-black" /> Company Information
              </h5>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={footerData.companyName}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                    placeholder="Your Company Name"
                    required
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Company Description
                  </label>
                  <textarea
                    value={footerData.companyDescription}
                    onChange={(e) => handleInputChange("companyDescription", e.target.value)}
                    placeholder="Brief description about your company"
                    rows="3"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Copyright Text <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={footerData.copyrightText}
                    onChange={(e) => handleInputChange("copyrightText", e.target.value)}
                    placeholder="© 2024 Company Name. All rights reserved."
                    required
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-b pb-6">
              <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Globe size={18} className="text-black" /> Contact Information
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    value={footerData.contactInfo.email}
                    onChange={(e) => handleContactInfoChange("email", e.target.value)}
                    placeholder="contact@company.com"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Phone</label>
                  <input
                    type="tel"
                    value={footerData.contactInfo.phone}
                    onChange={(e) => handleContactInfoChange("phone", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Alternate Phone No</label>
                  <input
                    type="tel"
                    value={footerData.contactInfo.alternate_no}
                    onChange={(e) => handleContactInfoChange("alternate_no", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Working Hours</label>
                  <input
                  type="text"
                    value={footerData.contactInfo.working_hrs}
                    onChange={(e) => handleContactInfoChange("working_hrs", e.target.value)}
                    placeholder="MON-FRI 9.00-5.00 "
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-semibold mb-2">Address</label>
                  <textarea
                  type="text"
                    value={footerData.contactInfo.address}
                    onChange={(e) => handleContactInfoChange("address", e.target.value)}
                    placeholder="123 Main St, City, State, ZIP"
                    rows="2"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="border-b pb-6">
              <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Globe size={18} className="text-black" /> Social Media Links
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <label className=" text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Facebook size={18} className="text-blue-600" /> Facebook
                  </label>
                  <input
                    type="url"
                    value={footerData.socialMedia.facebook}
                    onChange={(e) => handleSocialMediaChange("facebook", e.target.value)}
                    placeholder="https://facebook.com/yourpage"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="bg-sky-50 p-4 rounded-lg">
                  <label className=" text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Twitter size={18} className="text-sky-500" /> Twitter
                  </label>
                  <input
                    type="url"
                    value={footerData.socialMedia.twitter}
                    onChange={(e) => handleSocialMediaChange("twitter", e.target.value)}
                    placeholder="https://twitter.com/yourhandle"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div className="bg-pink-50 p-4 rounded-lg">
                  <label className=" text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Instagram size={18} className="text-sky-500" /> Instagram
                  </label>
                  <input
                    type="url"
                    value={footerData.socialMedia.instagram}
                    onChange={(e) => handleSocialMediaChange("instagram", e.target.value)}
                    placeholder="https://instagram.com/yourprofile"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:text-sky-500"
                  />
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <label className=" text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Linkedin size={18} className="text-blue-700" /> LinkedIn
                  </label>
                  <input
                    type="url"
                    value={footerData.socialMedia.linkedin}
                    onChange={(e) => handleSocialMediaChange("linkedin", e.target.value)}
                    placeholder="https://linkedin.com/company/yourcompany"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-700"
                  />
                </div>
                <div className="bg-red-50 p-4 rounded-lg md:col-span-2">
                  <label className=" text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Youtube size={18} className="text-red-600" /> YouTube
                  </label>
                  <input
                    type="url"
                    value={footerData.socialMedia.youtube}
                    onChange={(e) => handleSocialMediaChange("youtube", e.target.value)}
                    placeholder="https://youtube.com/c/yourchannel"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Globe size={18} className="text-black" /> Quick Links
              </h5>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newQuickLink.title}
                    onChange={(e) => setNewQuickLink({ ...newQuickLink, title: e.target.value })}
                    placeholder="Link Title (e.g., Privacy Policy)"
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newQuickLink.url}
                      onChange={(e) => setNewQuickLink({ ...newQuickLink, url: e.target.value })}
                      placeholder="URL (e.g., /privacy)"
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      type="button"
                      onClick={addQuickLink}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Plus size={18} /> Add
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {footerData.quickLinks.map((link, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white border p-3 rounded-lg group hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <span className="font-medium text-gray-800">{link.title}</span>
                      <span className="text-gray-500 text-sm ml-2">→ {link.url}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeQuickLink(index)}
                      className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
              </div>
              {footerData.quickLinks.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">🔗</div>
                  <p>No quick links added yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2"
            >
              ↺ Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2"><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg> Saving...</span>
              ) : (
                <><Save size={20} /> Save Changes</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}