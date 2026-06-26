import { useState } from 'react';
import { IconCaret } from './Icons';

export default function CollapsibleSection({ title, defaultOpen = false, meta, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="collapsible-section">
      <button
        type="button"
        className="collapsible-header"
        onClick={() => setOpen(!open)}
      >
        <span className="collapsible-arrow"><IconCaret open={open} size={12} /></span>
        <span className="collapsible-title">{title}</span>
        {meta && <span className="collapsible-meta">{meta}</span>}
      </button>
      {open && <div className="collapsible-body">{children}</div>}
    </div>
  );
}
