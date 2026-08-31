export interface PayrollConfig {
  standardMonthlyHours: number; // usually 173.33 (52 weeks * 40 hours / 12 months)
  overtimeMultiplier: number;   // usually 1.5
}

export interface TaxResult {
  taxableIncome: number;
  paye: number;
  nssfEmployee: number;
  nssfEmployer: number;
  lst: number;
  netPay: number;
  totalEmployerCost: number;
}

export interface PayrollInput {
  baseSalary: number;
  allowances: number;
  bonuses: number;
  absentHours: number;
  overtimeHours: number;
}

export interface TaxEngine {
  countryCode: string;
  currency: string;
  config: PayrollConfig;
  calculate(input: PayrollInput): TaxResult & { hourlyRate: number; adjustedGross: number; absentDeduction: number; overtimePay: number };
}

// Uganda Tax Engine Implementation
export const UgandaTaxEngine: TaxEngine = {
  countryCode: 'UG',
  currency: 'UGX',
  config: {
    standardMonthlyHours: 173.33,
    overtimeMultiplier: 1.5,
  },
  
  calculate(input: PayrollInput) {
    const { baseSalary, allowances, bonuses, absentHours, overtimeHours } = input;
    
    // 1. Calculate Hourly Rate
    const hourlyRate = baseSalary / this.config.standardMonthlyHours;
    
    // 2. Calculate Hours Adjustments
    const absentDeduction = absentHours * hourlyRate;
    const overtimePay = overtimeHours * hourlyRate * this.config.overtimeMultiplier;
    
    // 3. Adjusted Gross Income
    const adjustedGross = baseSalary - absentDeduction + overtimePay + allowances + bonuses;
    
    // 4. NSSF Calculation (5% Employee, 10% Employer)
    // In Uganda, NSSF is typically calculated on the gross pay (Basic + Allowances). 
    const nssfEmployee = adjustedGross * 0.05;
    const nssfEmployer = adjustedGross * 0.10;
    
    // 5. Taxable Income (Gross - NSSF Employee)
    const taxableIncome = adjustedGross - nssfEmployee;
    
    // 6. PAYE Calculation (Uganda Brackets 2024/2025)
    let paye = 0;
    
    if (taxableIncome > 235000 && taxableIncome <= 335000) {
      paye = (taxableIncome - 235000) * 0.10;
    } else if (taxableIncome > 335000 && taxableIncome <= 410000) {
      paye = 10000 + (taxableIncome - 335000) * 0.20;
    } else if (taxableIncome > 410000) {
      paye = 25000 + (taxableIncome - 410000) * 0.30;
    }
    
    // Solidarity Tax (High Income Bracket) - Extra 10% on excess over 10M
    if (taxableIncome > 10000000) {
      paye += (taxableIncome - 10000000) * 0.10;
    }
    
    // 7. LST (Local Service Tax) - Simplified Mock Bracket
    // Normally deducted in July-Oct. We apply a generic flat bracket for demonstration.
    let lst = 0;
    if (adjustedGross > 100000 && adjustedGross <= 200000) lst = 5000;
    else if (adjustedGross > 200000 && adjustedGross <= 300000) lst = 10000;
    else if (adjustedGross > 300000 && adjustedGross <= 400000) lst = 20000;
    else if (adjustedGross > 400000 && adjustedGross <= 500000) lst = 30000;
    else if (adjustedGross > 500000 && adjustedGross <= 600000) lst = 40000;
    else if (adjustedGross > 600000 && adjustedGross <= 700000) lst = 50000;
    else if (adjustedGross > 700000 && adjustedGross <= 800000) lst = 60000;
    else if (adjustedGross > 800000 && adjustedGross <= 900000) lst = 70000;
    else if (adjustedGross > 900000 && adjustedGross <= 1000000) lst = 80000;
    else if (adjustedGross > 1000000) lst = 100000;
    
    // 8. Net Pay
    const netPay = adjustedGross - nssfEmployee - paye - lst;
    
    // 9. Total Cost to Employer
    const totalEmployerCost = adjustedGross + nssfEmployer;
    
    return {
      hourlyRate,
      absentDeduction,
      overtimePay,
      adjustedGross,
      taxableIncome,
      paye,
      nssfEmployee,
      nssfEmployer,
      lst,
      netPay,
      totalEmployerCost
    };
  }
};

// Formatter Utility
export const formatCurrency = (amount: number, currencyCode: string = 'UGX') => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};
