import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export const Breadcrumb: React.FC<{ items: BreadcrumbItem[] }> = ({ items }) => (
  <nav
    aria-label="breadcrumb"
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.35rem',
      flexWrap: 'wrap',
      fontSize: '0.8rem',
      marginBottom: '0.5rem',
    }}
  >
    {items.map((item, idx) => {
      const isLast = idx === items.length - 1;
      return (
        <React.Fragment key={idx}>
          {idx > 0 && <ChevronRight size={13} style={{ opacity: 0.5, flexShrink: 0, color: 'var(--text-2)' }} />}
          {item.to && !isLast ? (
            <Link to={item.to} className="breadcrumb-link" style={{ color: 'var(--text-1)', fontWeight: 500 }}>
              {item.label}
            </Link>
          ) : (
            <span style={{ color: isLast ? 'var(--text-0)' : 'var(--text-1)', fontWeight: isLast ? 600 : 500 }}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      );
    })}
  </nav>
);
