import React from "react";
import PolicyDocumentEditor from "../../Shared/ui/PolicyDocumentEditor";

const ShippingPolicy = () => (
  <PolicyDocumentEditor
    type="shipping"
    title="Shipping Policy"
    subtitle="Manage dispatch timelines, delivery zones, shipping charges, and support contacts."
    documentLabel="Shipping Policy"
  />
);

export default ShippingPolicy;
