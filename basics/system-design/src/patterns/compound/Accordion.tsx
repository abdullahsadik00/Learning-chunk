import React, { createContext, useContext, useState } from 'react';

// --- Contexts ---

interface AccordionContextValue {
  openItems: Set<string>;
  toggle: (id: string) => void;
  multiple: boolean;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordion(): AccordionContextValue {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error('useAccordion must be used within <Accordion>');
  return ctx;
}

interface AccordionItemContextValue {
  id: string;
  isOpen: boolean;
}

const AccordionItemContext = createContext<AccordionItemContextValue | null>(null);

function useAccordionItem(): AccordionItemContextValue {
  const ctx = useContext(AccordionItemContext);
  if (!ctx) throw new Error('useAccordionItem must be used within <AccordionItem>');
  return ctx;
}

// --- Root ---

interface AccordionProps {
  children: React.ReactNode;
  multiple?: boolean;
}

export function Accordion({ children, multiple = false }: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!multiple) next.clear();
        next.add(id);
      }
      return next;
    });
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggle, multiple }}>
      <div style={{ border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden' }}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

// --- Item ---

interface AccordionItemProps {
  id: string;
  children: React.ReactNode;
}

export function AccordionItem({ id, children }: AccordionItemProps) {
  const { openItems } = useAccordion();
  const isOpen = openItems.has(id);

  return (
    <AccordionItemContext.Provider value={{ id, isOpen }}>
      <div style={{ borderBottom: '1px solid #334155' }}>{children}</div>
    </AccordionItemContext.Provider>
  );
}

// --- Trigger ---

interface AccordionTriggerProps {
  children: React.ReactNode;
}

export function AccordionTrigger({ children }: AccordionTriggerProps) {
  const { toggle } = useAccordion();
  const { id, isOpen } = useAccordionItem();

  return (
    <button
      onClick={() => toggle(id)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.875rem 1rem',
        background: 'transparent',
        border: 'none',
        color: '#e2e8f0',
        cursor: 'pointer',
        fontSize: '0.95rem',
        fontWeight: 500,
        textAlign: 'left',
      }}
    >
      {children}
      <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem', color: '#94a3b8' }}>
        {isOpen ? '▼' : '▶'}
      </span>
    </button>
  );
}

// --- Content ---

interface AccordionContentProps {
  children: React.ReactNode;
}

export function AccordionContent({ children }: AccordionContentProps) {
  const { isOpen } = useAccordionItem();
  if (!isOpen) return null;

  return (
    <div
      style={{
        padding: '0 1rem 1rem',
        color: '#94a3b8',
        fontSize: '0.9rem',
        lineHeight: 1.6,
      }}
    >
      {children}
    </div>
  );
}
