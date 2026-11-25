import React from "react";
import PolicyDocumentEditor from "../../Shared/ui/PolicyDocumentEditor";

const TermsCondition = () => (
  <PolicyDocumentEditor
    type="terms"
    title="Terms & Conditions"
    subtitle="Manage store terms, order conditions, liability disclosures, and legal contact details."
    documentLabel="Terms & Conditions"
  />
);

export default TermsCondition;
