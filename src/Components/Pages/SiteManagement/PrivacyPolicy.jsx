import React from "react";
import PolicyDocumentEditor from "../../Shared/ui/PolicyDocumentEditor";

const PrivacyPolicy = () => (
  <PolicyDocumentEditor
    type="privacy"
    title="Privacy Policy"
    subtitle="Manage customer privacy disclosures, data handling sections, and contact information."
    documentLabel="Privacy Policy"
  />
);

export default PrivacyPolicy;
