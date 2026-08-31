import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦' },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso', flag: '🇲🇽' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal', flag: '🇸🇦' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', flag: '🇹🇷' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble', flag: '🇷🇺' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', flag: '🇰🇷' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', flag: '🇸🇪' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', flag: '🇳🇴' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone', flag: '🇩🇰' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', flag: '🇭🇰' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', flag: '🇵🇱' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', flag: '🇹🇭' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', flag: '🇮🇩' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', flag: '🇭🇺' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', flag: '🇨🇿' },
  { code: 'ILS', symbol: '₪', name: 'Israeli New Shekel', flag: '🇮🇱' },
  { code: 'CLP', symbol: '$', name: 'Chilean Peso', flag: '🇨🇱' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', flag: '🇵🇭' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', flag: '🇲🇾' },
  { code: 'COP', symbol: '$', name: 'Colombian Peso', flag: '🇨🇴' },
  { code: 'TWD', symbol: 'NT$', name: 'New Taiwan Dollar', flag: '🇹🇼' },
  { code: 'ARS', symbol: '$', name: 'Argentine Peso', flag: '🇦🇷' },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar', flag: '🇰🇼' },
  { code: 'IQD', symbol: 'ع.د', name: 'Iraqi Dinar', flag: '🇮🇶' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', flag: '🇪🇬' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', flag: '🇵🇰' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', flag: '🇧🇩' },
  { code: 'DZD', symbol: 'د.ج', name: 'Algerian Dinar', flag: '🇩🇿' },
  { code: 'MAD', symbol: 'د.م.', name: 'Moroccan Dirham', flag: '🇲🇦' },
  { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal', flag: '🇶🇦' },
  { code: 'OMR', symbol: 'ر.ع.', name: 'Omani Rial', flag: '🇴🇲' },
  { code: 'BHD', symbol: 'ب.د', name: 'Bahraini Dinar', flag: '🇧🇭' },
  { code: 'JOD', symbol: 'د.ا', name: 'Jordanian Dinar', flag: '🇯🇴' },
  { code: 'LBP', symbol: 'ل.ل', name: 'Lebanese Pound', flag: '🇱🇧' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', flag: '🇰🇪' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', flag: '🇬🇭' },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', flag: '🇹🇿' },
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', flag: '🇺🇬' },
  { code: 'XAF', symbol: 'FCFA', name: 'CFA Franc BEAC', flag: '🇨🇲' },
  { code: 'XOF', symbol: 'CFA', name: 'CFA Franc BCEAO', flag: '🇸🇳' },
  { code: 'ZMW', symbol: 'ZK', name: 'Zambian Kwacha', flag: '🇿🇲' },
  { code: 'AFN', symbol: '؋', name: 'Afghan Afghani', flag: '🇦🇫' },
  { code: 'ALL', symbol: 'L', name: 'Albanian Lek', flag: '🇦🇱' },
  { code: 'AMD', symbol: '֏', name: 'Armenian Dram', flag: '🇦🇲' },
  { code: 'ANG', symbol: 'ƒ', name: 'Netherlands Antillean Guilder', flag: '🇨🇼' },
  { code: 'AOA', symbol: 'Kz', name: 'Angolan Kwanza', flag: '🇦🇴' },
  { code: 'AWG', symbol: 'ƒ', name: 'Aruban Florin', flag: '🇦🇼' },
  { code: 'AZN', symbol: '₼', name: 'Azerbaijani Manat', flag: '🇦🇿' },
  { code: 'BAM', symbol: 'KM', name: 'Bosnia-Herzegovina Convertible Mark', flag: '🇧🇦' },
  { code: 'BBD', symbol: '$', name: 'Barbadian Dollar', flag: '🇧🇧' },
  { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev', flag: '🇧🇬' },
  { code: 'BIF', symbol: 'FBu', name: 'Burundian Franc', flag: '🇧🇮' },
  { code: 'BMD', symbol: '$', name: 'Bermudan Dollar', flag: '🇧🇲' },
  { code: 'BND', symbol: '$', name: 'Brunei Dollar', flag: '🇧🇳' },
  { code: 'BOB', symbol: 'Bs.', name: 'Bolivian Boliviano', flag: '🇧🇴' },
  { code: 'BSD', symbol: '$', name: 'Bahamian Dollar', flag: '🇧🇸' },
  { code: 'BTN', symbol: 'Nu.', name: 'Bhutanese Ngultrum', flag: '🇧🇹' },
  { code: 'BWP', symbol: 'P', name: 'Botswanan Pula', flag: '🇧🇼' },
  { code: 'BYN', symbol: 'Br', name: 'Belarusian Ruble', flag: '🇧🇾' },
  { code: 'BZD', symbol: 'BZ$', name: 'Belize Dollar', flag: '🇧🇿' },
  { code: 'CDF', symbol: 'FC', name: 'Congolese Franc', flag: '🇨🇩' },
  { code: 'CRC', symbol: '₡', name: 'Costa Rican Colón', flag: '🇨🇷' },
  { code: 'CUP', symbol: '₱', name: 'Cuban Peso', flag: '🇨🇺' },
  { code: 'CVE', symbol: '$', name: 'Cape Verdean Escudo', flag: '🇨🇻' },
  { code: 'DJF', symbol: 'Fdj', name: 'Djiboutian Franc', flag: '🇩🇯' },
  { code: 'DOP', symbol: 'RD$', name: 'Dominican Peso', flag: '🇩🇴' },
  { code: 'ERN', symbol: 'Nfk', name: 'Eritrean Nakfa', flag: '🇪🇷' },
  { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr', flag: '🇪🇹' },
  { code: 'FJD', symbol: '$', name: 'Fijian Dollar', flag: '🇫🇯' },
  { code: 'GEL', symbol: '₾', name: 'Georgian Lari', flag: '🇬🇪' },
  { code: 'GNF', symbol: 'FG', name: 'Guinean Franc', flag: '🇬🇳' },
  { code: 'GTQ', symbol: 'Q', name: 'Guatemalan Quetzal', flag: '🇬🇹' },
  { code: 'GYD', symbol: '$', name: 'Guyanaese Dollar', flag: '🇬🇾' },
  { code: 'HNL', symbol: 'L', name: 'Honduran Lempira', flag: '🇭🇳' },
  { code: 'HTG', symbol: 'G', name: 'Haitian Gourde', flag: '🇭🇹' },
  { code: 'ISK', symbol: 'kr', name: 'Icelandic Króna', flag: '🇮🇸' },
  { code: 'JMD', symbol: 'J$', name: 'Jamaican Dollar', flag: '🇯🇲' },
  { code: 'KGS', symbol: 'лв', name: 'Kyrgystani Som', flag: '🇰🇬' },
  { code: 'KHR', symbol: '៛', name: 'Cambodian Riel', flag: '🇰🇭' },
  { code: 'KMF', symbol: 'CF', name: 'Comorian Franc', flag: '🇰🇲' },
  { code: 'KYD', symbol: '$', name: 'Cayman Islands Dollar', flag: '🇰🇾' },
  { code: 'KZT', symbol: '₸', name: 'Kazakhstani Tenge', flag: '🇰🇿' },
  { code: 'LAK', symbol: '₭', name: 'Laotian Kip', flag: '🇱🇦' },
  { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee', flag: '🇱🇰' },
  { code: 'LRD', symbol: '$', name: 'Liberian Dollar', flag: '🇱🇷' },
  { code: 'LSL', symbol: 'L', name: 'Lesotho Loti', flag: '🇱🇸' },
  { code: 'LYD', symbol: 'ل.د', name: 'Libyan Dinar', flag: '🇱🇾' },
  { code: 'MDL', symbol: 'L', name: 'Moldovan Leu', flag: '🇲🇩' },
  { code: 'MGA', symbol: 'Ar', name: 'Malagasy Ariary', flag: '🇲🇬' },
  { code: 'MKD', symbol: 'ден', name: 'Macedonian Denar', flag: '🇲🇰' },
  { code: 'MMK', symbol: 'K', name: 'Myanmar Kyat', flag: '🇲🇲' },
  { code: 'MNT', symbol: '₮', name: 'Mongolian Tugrik', flag: '🇲🇳' },
  { code: 'MOP', symbol: 'MOP$', name: 'Macanese Pataca', flag: '🇲🇴' },
  { code: 'MRU', symbol: 'UM', name: 'Mauritanian Ouguiya', flag: '🇲🇷' },
  { code: 'MUR', symbol: '₨', name: 'Mauritian Rupee', flag: '🇲🇺' },
  { code: 'MVR', symbol: 'Rf', name: 'Maldivian Rufiyaa', flag: '🇲🇻' },
  { code: 'MWK', symbol: 'MK', name: 'Malawian Kwacha', flag: '🇲🇼' },
  { code: 'MZN', symbol: 'MT', name: 'Mozambican Metical', flag: '🇲🇿' },
  { code: 'NAD', symbol: '$', name: 'Namibian Dollar', flag: '🇳🇦' },
  { code: 'NIO', symbol: 'C$', name: 'Nicaraguan Córdoba', flag: '🇳🇮' },
  { code: 'NPR', symbol: '₨', name: 'Nepalese Rupee', flag: '🇳🇵' },
  { code: 'PAB', symbol: 'B/.', name: 'Panamanian Balboa', flag: '🇵🇦' },
  { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol', flag: '🇵🇪' },
  { code: 'PGK', symbol: 'K', name: 'Papua New Guinean Kina', flag: '🇵🇬' },
  { code: 'PYG', symbol: '₲', name: 'Paraguayan Guarani', flag: '🇵🇾' },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu', flag: '🇷🇴' },
  { code: 'RSD', symbol: 'дин.', name: 'Serbian Dinar', flag: '🇷🇸' },
  { code: 'RWF', symbol: 'FRw', name: 'Rwandan Franc', flag: '🇷🇼' },
  { code: 'SBD', symbol: '$', name: 'Solomon Islands Dollar', flag: '🇸🇧' },
  { code: 'SCR', symbol: '₨', name: 'Seychellois Rupee', flag: '🇸🇨' },
  { code: 'SDG', symbol: 'ج.س.', name: 'Sudanese Pound', flag: '🇸🇩' },
  { code: 'SHP', symbol: '£', name: 'Saint Helena Pound', flag: '🇸🇭' },
  { code: 'SLE', symbol: 'Le', name: 'Sierra Leonean Leone', flag: '🇸🇱' },
  { code: 'SOS', symbol: 'Sh', name: 'Somali Shilling', flag: '🇸🇴' },
  { code: 'SRD', symbol: '$', name: 'Surinamese Dollar', flag: '🇸🇷' },
  { code: 'STN', symbol: 'Db', name: 'São Tomé and Príncipe Dobra', flag: '🇸🇹' },
  { code: 'SYP', symbol: '£', name: 'Syrian Pound', flag: '🇸🇾' },
  { code: 'SZL', symbol: 'L', name: 'Swazi Lilangeni', flag: '🇸🇿' },
  { code: 'TJS', symbol: 'ЅМ', name: 'Tajikistani Somoni', flag: '🇹🇯' },
  { code: 'TMT', symbol: 'm', name: 'Turkmenistani Manat', flag: '🇹🇲' },
  { code: 'TND', symbol: 'د.ت', name: 'Tunisian Dinar', flag: '🇹🇳' },
  { code: 'TOP', symbol: 'T$', name: 'Tongan Paʻanga', flag: '🇹🇴' },
  { code: 'TTD', symbol: 'TT$', name: 'Trinidad and Tobago Dollar', flag: '🇹🇹' },
  { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia', flag: '🇺🇦' },
  { code: 'UYU', symbol: '$U', name: 'Uruguayan Peso', flag: '🇺🇾' },
  { code: 'UZS', symbol: 'soʻm', name: 'Uzbekistan Som', flag: '🇺🇿' },
  { code: 'VES', symbol: 'Bs.S.', name: 'Venezuelan Bolívar', flag: '🇻🇪' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', flag: '🇻🇳' },
  { code: 'VUV', symbol: 'VT', name: 'Vanuatu Vatu', flag: '🇻🇺' },
  { code: 'WST', symbol: 'WS$', name: 'Samoan Tala', flag: '🇼🇸' },
  { code: 'XCD', symbol: '$', name: 'East Caribbean Dollar', flag: '🇦🇬' },
  { code: 'YER', symbol: '﷼', name: 'Yemeni Rial', flag: '🇾🇪' },
  { code: 'ZWL', symbol: 'Z$', name: 'Zimbabwean Dollar', flag: '🇿🇼' }
].sort((a, b) => a.code.localeCompare(b.code));

interface CurrencySelectProps {
  value: string;
  onChange: (val: string) => void;
}

export function CurrencySelect({ value, onChange }: CurrencySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCurrency = CURRENCIES.find(c => c.code === value) || CURRENCIES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = CURRENCIES.filter(c => 
    c.code.toLowerCase().includes(search.toLowerCase()) || 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      {/* Trigger Button */}
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '100%', cursor: 'pointer', background: 'white', 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{selectedCurrency.flag}</span>
          <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{selectedCurrency.code}</span>
          <span style={{ fontSize: 14, color: 'var(--text-4)' }}>({selectedCurrency.symbol})</span>
        </div>
        <ChevronDown size={16} color="var(--text-4)" />
      </button>

      {/* Dropdown Popup */}
      {isOpen && (
        <div 
          style={{ 
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 9999, 
            background: 'white', borderRadius: 12, 
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            border: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column'
          }}
        >
          {/* Search Input */}
          <div style={{ padding: 12, borderBottom: '1px solid var(--border)', background: '#F9FAFB', display: 'flex', alignItems: 'center', gap: 8, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
            <Search size={16} color="var(--text-4)" />
            <input 
              autoFocus
              type="text" 
              placeholder="Search currency..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: 14 }}
            />
          </div>

          {/* List */}
          <div style={{ maxHeight: 240, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-4)', fontSize: 14 }}>No currencies found.</div>
            ) : (
              filtered.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    onChange(c.code);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: 12, textAlign: 'left',
                    border: 'none',
                    background: value === c.code ? 'var(--primary-light, #F3E8FD)' : 'transparent',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (value !== c.code) e.currentTarget.style.background = '#F3F4F6';
                  }}
                  onMouseLeave={(e) => {
                    if (value !== c.code) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ fontSize: 20, minWidth: 24, textAlign: 'center' }}>{c.flag}</span>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: 14 }}>{c.code}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-4)' }}>{c.symbol}</span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{c.name}</span>
                  </div>
                  {value === c.code && <Check size={16} color="var(--primary, #9334E6)" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
