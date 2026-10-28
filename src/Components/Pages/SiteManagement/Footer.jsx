
import React, { useCallback, useEffect, useRef, useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import {
  Save,
  Plus,
  X,
  Globe,
  Mail,
  Phone,
  MapPin,
  Clock,
  Link as LinkIcon,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaYoutube,
} from "react-icons/fa";
import { app } from "../../Config/Firebase";


const initialFooterData = {
  companyName: "",
  companyDescription: "",
  copyrightText: "",
  logo: "",
  socialMedia: {
    facebook: "",
    twitter: "",
    instagram: "",
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
};


const normalizeFooter = (data = {}) => {
  const social = Array.isArray(data.socialMedia)
    ? data.socialMedia[0] || {}
    : data.socialMedia || {};

  return {
    companyName: data.companyName || "",
    companyDescription: data.companyDescription || "",
    copyrightText: data.copyrightText || "",
    logo: data.logo || "",

    socialMedia: {
      facebook: social.facebook || "",
      twitter: social.twitter || "",
      instagram: social.instagram || "",
      youtube: social.youtube || "",
    },

    quickLinks: Array.isArray(data.quickLinks)
      ? data.quickLinks.map((item) => ({
          title: item.title || "",
          url: item.url || "",
        }))
      : [],

    contactInfo: {
      email: data.contactInfo?.email || "",
      phone: data.contactInfo?.phone || "",
      address: data.contactInfo?.address || "",
      alternate_no: data.contactInfo?.alternate_no || "",
      working_hrs: data.contactInfo?.working_hrs || "",
    },
  };
};

export default function Footer() {
  const functions = getFunctions(app, "europe-west1");
  const storage = getStorage(app);

  const logoInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [footerExists, setFooterExists] = useState(false);

  const [footerData, setFooterData] = useState({
    ...initialFooterData,
  });

  const [savedData, setSavedData] = useState({
    ...initialFooterData,
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  const [newQuickLink, setNewQuickLink] = useState({
    title: "",
    url: "",
  });

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const inputClass =
    "w-full border border-tertiary/60 rounded-xl px-4 py-3 text-sm bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-colors placeholder:text-secondary/50 font-medium text-gray-900";

  const socialInputClass =
    "w-full border border-tertiary/60 rounded-lg px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors placeholder:text-secondary/50 font-medium text-gray-900";

  const callWebsiteManagement = useCallback(
    async (action, fields = {}) => {
      const manageWebsite = httpsCallable(
        functions,
        "manageWebsiteManagement"
      );

      const response = await manageWebsite({
        type: "footer",
        action,
        fields,
      });

      const result = response.data;

      if (!result?.success) {
        throw new Error(
          result?.message || "Footer operation failed."
        );
      }

      return result;
    },
    [functions]
  );

  const loadFooter = useCallback(async () => {
    setFetching(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await callWebsiteManagement("list");

      const record = result.data;

      if (record && typeof record === "object") {
        const normalized = normalizeFooter(record);

        setFooterExists(true);
        setFooterData(normalized);
        setSavedData(normalized);
        setLogoPreview(normalized.logo);
      } else {
        setFooterExists(false);
        setFooterData({ ...initialFooterData });
        setSavedData({ ...initialFooterData });
        setLogoPreview("");
      }
    } catch (error) {
      console.error("Error loading footer:", error);

      setMessage({
        type: "error",
        text:
          error.message ||
          "Unable to load footer settings. Please try again.",
      });
    } finally {
      setFetching(false);
    }
  }, [callWebsiteManagement]);

  useEffect(() => {
    loadFooter();
  }, [loadFooter]);

  const handleInputChange = (field, value) => {
    setFooterData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSocialMediaChange = (platform, value) => {
    setFooterData((prev) => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value,
      },
    }));
  };

  const handleContactInfoChange = (field, value) => {
    setFooterData((prev) => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [field]: value,
      },
    }));
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({
        type: "error",
        text: "Please select a valid image file.",
      });

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({
        type: "error",
        text: "Logo size must be 5 MB or less.",
      });

      event.target.value = "";
      return;
    }
    if (logoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreview);
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setMessage({ type: "", text: "" });
  };

  const uploadLogo = async (file) => {
    const extension =
      file.name.split(".").pop()?.toLowerCase() || "png";

    const safeExtension = /^[a-z0-9]+$/.test(extension)
      ? extension
      : "png";

    const uniqueName =
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${safeExtension}`;

    const logoRef = ref(storage, `footer/logos/${uniqueName}`);

    await uploadBytes(logoRef, file, {
      contentType: file.type,
    });

    return getDownloadURL(logoRef);
  };

  // ===================================================
  // QUICK LINKS
  // ===================================================

  const addQuickLink = () => {
    const title = newQuickLink.title.trim();
    const url = newQuickLink.url.trim();

    if (!title || !url) {
      setMessage({
        type: "error",
        text: "Please enter both a quick link title and URL.",
      });
      return;
    }

    setFooterData((prev) => ({
      ...prev,
      quickLinks: [...prev.quickLinks, { title, url }],
    }));

    setNewQuickLink({ title: "", url: "" });
    setMessage({ type: "", text: "" });
  };

  const removeQuickLink = (index) => {
    setFooterData((prev) => ({
      ...prev,
      quickLinks: prev.quickLinks.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const handleReset = () => {
    if (logoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreview);
    }

    const normalized = normalizeFooter(savedData);

    setFooterData(normalized);
    setLogoPreview(normalized.logo);
    setLogoFile(null);
    setNewQuickLink({ title: "", url: "" });
    setMessage({ type: "", text: "" });

    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      let logoUrl = footerData.logo || "";
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile);
      }

      const fields = {
        companyName: footerData.companyName.trim(),
        companyDescription: footerData.companyDescription,
        copyrightText: footerData.copyrightText,
        logo: logoUrl,

        socialMedia: [
          {
            facebook: footerData.socialMedia.facebook,
            twitter: footerData.socialMedia.twitter,
            instagram: footerData.socialMedia.instagram,
            youtube: footerData.socialMedia.youtube,
          },
        ],

        quickLinks: footerData.quickLinks.map((item) => ({
          title: item.title,
          url: item.url,
        })),

        contactInfo: {
          email: footerData.contactInfo.email,
          phone: footerData.contactInfo.phone,
          address: footerData.contactInfo.address,
          alternate_no: footerData.contactInfo.alternate_no,
          working_hrs: footerData.contactInfo.working_hrs,
        },
      };

      const action = footerExists ? "update" : "add";

      const result = await callWebsiteManagement(
        action,
        fields
      );

      const normalized = normalizeFooter({
        ...fields,
        logo: logoUrl,
      });

      setFooterExists(true);
      setFooterData(normalized);
      setSavedData(normalized);
      setLogoPreview(logoUrl);
      setLogoFile(null);

      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }

      setMessage({
        type: "success",
        text: result.message || "Footer settings saved successfully.",
      });
    } catch (error) {
      console.error("Error saving footer:", error);

      setMessage({
        type: "error",
        text:
          error.message ||
          "Unable to save footer settings. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-secondary">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">
            Loading footer settings...
          </span>
        </div>
      </div>
    );
  }


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

          <button
            type="button"
            onClick={loadFooter}
            disabled={loading || fetching}
            className="flex items-center justify-center gap-2 rounded-xl border border-tertiary/60 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {message.text && (
          <div
            role="alert"
            className={`rounded-xl border px-4 py-3 text-sm font-medium ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
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
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={footerData.companyName}
                    onChange={(e) =>
                      handleInputChange("companyName", e.target.value)
                    }
                    placeholder="Your Company Name"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Company Description
                  </label>
                  <textarea
                    value={footerData.companyDescription}
                    onChange={(e) =>
                      handleInputChange(
                        "companyDescription",
                        e.target.value
                      )
                    }
                    placeholder="Brief description about your company"
                    rows={3}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Copyright Text
                  </label>
                  <input
                    type="text"
                    value={footerData.copyrightText}
                    onChange={(e) =>
                      handleInputChange(
                        "copyrightText",
                        e.target.value
                      )
                    }
                    placeholder="© 2026 Company Name. All rights reserved."
                    className={inputClass}
                  />
                </div>

                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Company Logo
                  </label>

                  <div className="rounded-xl border border-dashed border-tertiary/70 bg-slate-50 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-tertiary/50 bg-white">
                        {logoPreview ? (
                          <img
                            src={logoPreview}
                            alt="Company logo preview"
                            className="h-full w-full object-contain p-2"
                          />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-secondary/40" />
                        )}
                      </div>

                      <div className="flex-1">
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white`}
                        />

                        <p className="mt-2 text-xs text-secondary/70">
                          Select an image up to 5 MB. The image uploads
                          to Firebase Storage when you save the footer.
                        </p>

                        {logoFile && (
                          <button
                            type="button"
                            onClick={() => {
                              if (logoPreview.startsWith("blob:")) {
                                URL.revokeObjectURL(logoPreview);
                              }

                              setLogoFile(null);
                              setLogoPreview(footerData.logo || "");

                              if (logoInputRef.current) {
                                logoInputRef.current.value = "";
                              }
                            }}
                            className="mt-2 text-xs font-semibold text-rose-600 hover:text-rose-700"
                          >
                            Cancel selected logo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
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
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    <Mail className="inline w-3.5 h-3.5 mr-1 text-secondary/50" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={footerData.contactInfo.email}
                    onChange={(e) =>
                      handleContactInfoChange("email", e.target.value)
                    }
                    placeholder="contact@company.com"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    <Phone className="inline w-3.5 h-3.5 mr-1 text-secondary/50" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={footerData.contactInfo.phone}
                    onChange={(e) =>
                      handleContactInfoChange("phone", e.target.value)
                    }
                    placeholder="+49 123 456789"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Alternate Phone No
                  </label>
                  <input
                    type="tel"
                    value={footerData.contactInfo.alternate_no}
                    onChange={(e) =>
                      handleContactInfoChange(
                        "alternate_no",
                        e.target.value
                      )
                    }
                    placeholder="Alternate phone number"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    <Clock className="inline w-3.5 h-3.5 mr-1 text-secondary/50" />
                    Working Hours
                  </label>
                  <input
                    type="text"
                    value={footerData.contactInfo.working_hrs}
                    onChange={(e) =>
                      handleContactInfoChange(
                        "working_hrs",
                        e.target.value
                      )
                    }
                    placeholder="MON-FRI 9.00-17.00"
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    <MapPin className="inline w-3.5 h-3.5 mr-1 text-secondary/50" />
                    Address
                  </label>
                  <textarea
                    value={footerData.contactInfo.address}
                    onChange={(e) =>
                      handleContactInfoChange("address", e.target.value)
                    }
                    placeholder="Company address"
                    rows={2}
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
                {[
                  {
                    key: "facebook",
                    label: "Facebook",
                    icon: <FaFacebookF className="text-blue-600 w-4 h-4" />,
                    placeholder: "https://facebook.com/yourpage",
                    bg: "bg-blue-50/60 border-blue-100",
                  },
                  {
                    key: "twitter",
                    label: "Twitter",
                    icon: <FaTwitter className="text-sky-500 w-4 h-4" />,
                    placeholder: "https://twitter.com/yourhandle",
                    bg: "bg-sky-50/60 border-sky-100",
                  },
                  {
                    key: "instagram",
                    label: "Instagram",
                    icon: <FaInstagram className="text-pink-500 w-4 h-4" />,
                    placeholder: "https://instagram.com/yourprofile",
                    bg: "bg-pink-50/60 border-pink-100",
                  },
                  {
                    key: "youtube",
                    label: "YouTube",
                    icon: <FaYoutube className="text-red-600 w-4 h-4" />,
                    placeholder: "https://youtube.com/yourchannel",
                    bg: "bg-red-50/60 border-red-100",
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className={`${item.bg} border p-4 rounded-xl`}
                  >
                    <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      {item.icon}
                      {item.label}
                    </label>

                    <input
                      type="url"
                      value={footerData.socialMedia[item.key]}
                      onChange={(e) =>
                        handleSocialMediaChange(item.key, e.target.value)
                      }
                      placeholder={item.placeholder}
                      className={socialInputClass}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl shadow-sm border border-tertiary/40 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                  <LinkIcon className="w-4 h-4 text-violet-600" />
                </span>
                Quick Links
              </h2>

              <div className="bg-slate-50/70 border border-tertiary/40 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newQuickLink.title}
                    onChange={(e) =>
                      setNewQuickLink((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Link Title (e.g., Privacy Policy)"
                    className={inputClass}
                  />

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newQuickLink.url}
                      onChange={(e) =>
                        setNewQuickLink((prev) => ({
                          ...prev,
                          url: e.target.value,
                        }))
                      }
                      placeholder="URL (e.g., /privacy)"
                      className="flex-1 min-w-0 border border-tertiary/60 rounded-lg px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />

                    <button
                      type="button"
                      onClick={addQuickLink}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-secondary transition-all shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {footerData.quickLinks.length > 0 ? (
                <div className="space-y-2">
                  {footerData.quickLinks.map((item, index) => (
                    <div
                      key={`${item.title}-${index}`}
                      className="flex items-center justify-between gap-3 bg-slate-50 border border-tertiary/40 p-3.5 rounded-xl group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                          <LinkIcon className="w-3.5 h-3.5 text-primary" />
                        </div>

                        <div className="min-w-0">
                          <span className="block text-sm font-bold text-gray-900">
                            {item.title}
                          </span>
                          <span className="block text-xs text-secondary/70 font-medium break-all">
                            {item.url}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeQuickLink(index)}
                        aria-label={`Remove ${item.title}`}
                        className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200/60 shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-secondary/50">
                  <div className="text-4xl mb-3">🔗</div>
                  <p className="text-sm font-medium">
                    No quick links added yet
                  </p>
                  <p className="text-xs mt-1">
                    Use the form above to add navigation links
                  </p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl border border-tertiary/60 bg-white px-5 py-2.5 text-sm font-bold text-gray-900 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4 text-secondary" />
                Reset
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-8 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-secondary transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
