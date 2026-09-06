import { Check, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import s from "./pricing-card.module.css";

export interface PricingCardProps {
  name: string;
  note: string;
  price: string | React.ReactNode;
  min: string;
  features: string[];
  tone?: "plain" | "featured" | "dark";
  
  // For marketing page
  cta?: string;
  href?: string;
  
  // For interactive selection (e.g., registration)
  selectable?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export default function PricingCard({
  name,
  note,
  price,
  min,
  features,
  tone = "plain",
  cta,
  href,
  selectable,
  selected,
  onClick
}: PricingCardProps) {
  const isDark = tone === "dark";
  const isFeatured = tone === "featured";
  
  const content = (
    <>
      <div className={s.planTop}>
        {isFeatured && <span><Sparkles size={10} /> Most popular</span>}
        <h2>
          {name}
        </h2>
        <p>{note}</p>
        <div className={s.price}>{price}</div>
        <small>{min}</small>
      </div>
      <ul>
        {features.map((f, i) => (
          <li key={i}>
            <Check size={14} />
            {f}
          </li>
        ))}
      </ul>
      
      {selectable ? (
        <button 
          type="button" 
          className={s.ctaBtn} 
          onClick={(e) => { e.stopPropagation(); onClick?.(); }}
        >
          {selected ? (
            <><CheckCircle2 size={14} /> Selected</>
          ) : (
            cta || "Select plan"
          )}
        </button>
      ) : (
        cta && href && <Link href={href} className={s.ctaBtn}>{cta}</Link>
      )}
    </>
  );

  const className = `${s.plan} ${s[tone]} ${selected ? s.selected : ""}`;

  return (
    <div 
      className={className} 
      onClick={selectable ? onClick : undefined}
      style={{ cursor: selectable ? "pointer" : "default" }}
    >
      {content}
    </div>
  );
}
