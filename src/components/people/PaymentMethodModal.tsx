"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { API_BASE_URL, getAuthHeaders } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import { SearchableSelect, SelectOption } from "@/components/ui/SearchableSelect";
import {
  CreditCard,
  Smartphone,
  Wallet,
  Banknote,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Building,
} from "lucide-react";

export type PaymentMethodType = "Direct Deposit" | "Mobile Money" | "PayPal / Digital Wallet" | "Cash / Cheque";

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employeeId: string;
  employeeName: string;
  initialData?: {
    paymentMethod?: string;
    bankName?: string;
    bankRoutingNumber?: string;
    bankAccountNumber?: string;
    mobileMoneyProvider?: string;
    mobileMoneyPhone?: string;
    walletEmail?: string;
  };
}

const PAYMENT_METHOD_OPTIONS: SelectOption[] = [
  {
    value: "Direct Deposit",
    label: "Direct Deposit (Bank Account)",
    description: "Domestic or international corporate bank transfer",
  },
  {
    value: "Mobile Money",
    label: "Mobile Money (MTN / Airtel / M-Pesa)",
    description: "Direct instant mobile telecom disbursement",
  },
  {
    value: "PayPal / Digital Wallet",
    label: "PayPal / Digital Wallet",
    description: "Disbursement to registered wallet or PayPal email",
  },
  {
    value: "Cash / Cheque",
    label: "Cash / Cheque",
    description: "Physical disbursement with receipt signing",
  },
];

const MOBILE_MONEY_PROVIDERS: SelectOption[] = [
  { value: "MTN Mobile Money", label: "MTN Mobile Money (MoMo)" },
  { value: "Airtel Money", label: "Airtel Money" },
  { value: "M-Pesa", label: "M-Pesa (Safaricom / Vodacom)" },
  { value: "Orange Money", label: "Orange Money" },
  { value: "Wave", label: "Wave Mobile Money" },
];

export function PaymentMethodModal({
  isOpen,
  onClose,
  onSuccess,
  employeeId,
  employeeName,
  initialData,
}: PaymentMethodModalProps) {
  const { getToken } = useAuth();
  const [method, setMethod] = useState<PaymentMethodType>(
    (initialData?.paymentMethod as PaymentMethodType) || "Direct Deposit"
  );

  // Bank fields
  const [bankName, setBankName] = useState(initialData?.bankName || "");
  const [bankAccountNumber, setBankAccountNumber] = useState(initialData?.bankAccountNumber || "");
  const [bankRoutingNumber, setBankRoutingNumber] = useState(initialData?.bankRoutingNumber || "");

  // Mobile Money fields
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState(
    initialData?.mobileMoneyProvider || "MTN Mobile Money"
  );
  const [mobileMoneyPhone, setMobileMoneyPhone] = useState(initialData?.mobileMoneyPhone || "");

  // Wallet fields
  const [walletEmail, setWalletEmail] = useState(initialData?.walletEmail || "");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setMethod((initialData.paymentMethod as PaymentMethodType) || "Direct Deposit");
      setBankName(initialData.bankName || "");
      setBankAccountNumber(initialData.bankAccountNumber || "");
      setBankRoutingNumber(initialData.bankRoutingNumber || "");
      setMobileMoneyProvider(initialData.mobileMoneyProvider || "MTN Mobile Money");
      setMobileMoneyPhone(initialData.mobileMoneyPhone || "");
      setWalletEmail(initialData.walletEmail || "");
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = await getToken();
      const headers = getAuthHeaders(token);

      const payload: Record<string, any> = {
        paymentMethod: method,
      };

      if (method === "Direct Deposit") {
        if (!bankName.trim() || !bankAccountNumber.trim()) {
          toast.error("Validation error", "Please enter Bank Name and Account Number.");
          setIsSubmitting(false);
          return;
        }
        payload.bankName = bankName.trim();
        payload.bankAccountNumber = bankAccountNumber.trim();
        payload.bankRoutingNumber = bankRoutingNumber.trim();
      } else if (method === "Mobile Money") {
        if (!mobileMoneyPhone.trim()) {
          toast.error("Validation error", "Please enter the registered mobile money phone number.");
          setIsSubmitting(false);
          return;
        }
        payload.mobileMoneyProvider = mobileMoneyProvider;
        payload.mobileMoneyPhone = mobileMoneyPhone.trim();
      } else if (method === "PayPal / Digital Wallet") {
        if (!walletEmail.trim()) {
          toast.error("Validation error", "Please enter the wallet or PayPal email address.");
          setIsSubmitting(false);
          return;
        }
        payload.walletEmail = walletEmail.trim();
      }

      const res = await fetch(`${API_BASE_URL}/api/v1/employees/${employeeId}/profile`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || errJson.title || "Failed to update payment method");
      }

      toast.success("Payment method updated", `Disbursement channel configured for ${employeeName}.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to update payment method", err);
      toast.error("Save error", err.message || "Could not save payment method.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Disbursement & Payment Method"
      subtitle={`Configure payout channel for ${employeeName}`}
      width={580}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Method Picker */}
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-1)", marginBottom: 8 }}>
            Payment Method
          </label>
          <SearchableSelect
            options={PAYMENT_METHOD_OPTIONS}
            value={method}
            onChange={(val) => setMethod(val as PaymentMethodType)}
            placeholder="Select disbursement method"
          />
        </div>

        {/* Dynamic Fields */}
        {method === "Direct Deposit" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, background: "#F8FAFC", padding: 16, borderRadius: 10, border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)", fontWeight: 700, fontSize: 13 }}>
              <Building size={16} /> Direct Deposit Banking Details
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
                Bank Name <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Stanbic Bank, Chase, Standard Chartered"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                required
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
                  Account Number / IBAN <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 9030018471234"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
                  Routing / Swift Code
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. SBICUGKX"
                  value={bankRoutingNumber}
                  onChange={(e) => setBankRoutingNumber(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
                />
              </div>
            </div>
          </div>
        )}

        {method === "Mobile Money" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, background: "#F8FAFC", padding: 16, borderRadius: 10, border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)", fontWeight: 700, fontSize: 13 }}>
              <Smartphone size={16} /> Mobile Money Account
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
                Provider / Telecom Network <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <SearchableSelect
                options={MOBILE_MONEY_PROVIDERS}
                value={mobileMoneyProvider}
                onChange={(val) => setMobileMoneyProvider(val)}
                placeholder="Select telecom network"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
                Registered Mobile Money Phone Number <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                type="tel"
                className="input-field"
                placeholder="e.g. +256 772 123456 or 0772123456"
                value={mobileMoneyPhone}
                onChange={(e) => setMobileMoneyPhone(e.target.value)}
                required
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
              />
              <span style={{ fontSize: 11, color: "var(--text-4)", marginTop: 4, display: "block" }}>
                Ensure this SIM is KYC verified and registered under the employee&apos;s name.
              </span>
            </div>
          </div>
        )}

        {method === "PayPal / Digital Wallet" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, background: "#F8FAFC", padding: 16, borderRadius: 10, border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)", fontWeight: 700, fontSize: 13 }}>
              <Wallet size={16} /> Digital Wallet Account
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
                Wallet / PayPal Email Address <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="e.g. employee.wallet@gmail.com"
                value={walletEmail}
                onChange={(e) => setWalletEmail(e.target.value)}
                required
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
              />
            </div>
          </div>
        )}

        {method === "Cash / Cheque" && (
          <div style={{ background: "#F8FAFC", padding: 16, borderRadius: 10, border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
              <Banknote size={16} /> Cash / Cheque Disbursement
            </div>
            <p style={{ fontSize: 12.5, color: "var(--text-3)", margin: 0, lineHeight: 1.6 }}>
              Payments will be prepared as physical currency or printed corporate cheque at the regional branch. A signed physical voucher will be required upon disbursement.
            </p>
          </div>
        )}

        {/* Security Notice */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#166534", background: "#F0FDF4", padding: "10px 14px", borderRadius: 8, border: "1px solid #BBF7D0" }}>
          <ShieldCheck size={16} />
          <span>Disbursement info is encrypted and strictly restricted to authorized payroll disbursement officers.</span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
          <button
            type="button"
            className="btn-neutral"
            onClick={onClose}
            disabled={isSubmitting}
            style={{ padding: "9px 18px", borderRadius: 8, fontSize: 13 }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
            <span>Save Disbursement Details</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
