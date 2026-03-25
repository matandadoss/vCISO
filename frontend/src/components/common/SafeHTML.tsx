"use client";

import DOMPurify from "isomorphic-dompurify";
import React from "react";

export function SafeHTML({ html, className }: { html: string; className?: string }) {
  // Execute a rigorous multi-pass DOM wipe targeting any potential XSS `<script>`/`onEvent` attributes
  const cleanHTML = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'script', 'iframe', 'form', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onmouseover', 'onmouseout', 'onclick', 'onkeydown'],
  });

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: cleanHTML }} 
    />
  );
}
