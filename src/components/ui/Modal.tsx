import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string | number;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 520,
}: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: width }}
      >
        <div className="modal-header">
          <div style={{ minWidth: 0, flex: 1, paddingRight: 12 }}>
            <h2 className="modal-title" style={{ margin: 0 }}>
              {title}
            </h2>
            {subtitle && (
              <p
                style={{
                  margin: '4px 0 0 0',
                  fontSize: 12.5,
                  color: 'var(--text-3, #A1A1AA)',
                  lineHeight: 1.4,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            <X size={15} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
