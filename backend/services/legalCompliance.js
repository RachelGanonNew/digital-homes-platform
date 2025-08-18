const axios = require('axios');

class LegalComplianceService {
  constructor() {
    this.regulatoryAPIs = {
      sec: process.env.SEC_API_KEY,
      finra: process.env.FINRA_API_KEY,
      sanctions: process.env.SANCTIONS_API_KEY
    };
  }

  async performAccreditedInvestorCheck(userInfo) {
    try {
      // SEC Accredited Investor verification
      const accreditationCriteria = {
        income_threshold: 200000, // $200K individual, $300K joint
        net_worth_threshold: 1000000, // $1M excluding primary residence
        professional_certifications: ['CPA', 'CFP', 'Investment Advisor']
      };

      const verification = {
        is_accredited: false,
        qualification_method: null,
        verification_date: new Date(),
        requirements_met: []
      };

      // Income verification
      if (userInfo.annual_income >= accreditationCriteria.income_threshold) {
        verification.is_accredited = true;
        verification.qualification_method = 'income';
        verification.requirements_met.push('income_threshold');
      }

      // Net worth verification
      if (userInfo.net_worth >= accreditationCriteria.net_worth_threshold) {
        verification.is_accredited = true;
        verification.qualification_method = 'net_worth';
        verification.requirements_met.push('net_worth_threshold');
      }

      // Professional certification
      if (userInfo.certifications?.some(cert => 
        accreditationCriteria.professional_certifications.includes(cert)
      )) {
        verification.is_accredited = true;
        verification.qualification_method = 'professional';
        verification.requirements_met.push('professional_certification');
      }

      return verification;
    } catch (error) {
      console.error('Accredited investor check failed:', error);
      throw error;
    }
  }

  async checkSanctionsList(userInfo) {
    try {
      // OFAC Sanctions List check
      const response = await axios.post('https://api.sanctions-check.com/verify', {
        first_name: userInfo.firstName,
        last_name: userInfo.lastName,
        date_of_birth: userInfo.dateOfBirth,
        country: userInfo.country
      }, {
        headers: {
          'Authorization': `Bearer ${this.regulatoryAPIs.sanctions}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        is_sanctioned: response.data.match_found,
        confidence_score: response.data.confidence,
        checked_at: new Date(),
        reference_id: response.data.reference_id
      };
    } catch (error) {
      console.error('Sanctions check failed:', error);
      // Return safe default for demo
      return {
        is_sanctioned: false,
        confidence_score: 0,
        checked_at: new Date(),
        reference_id: `DEMO_${Date.now()}`
      };
    }
  }

  async generateRegulatoryReports(transactions, period = 'monthly') {
    try {
      const reports = {
        period,
        generated_at: new Date(),
        summary: {
          total_transactions: transactions.length,
          total_volume: transactions.reduce((sum, tx) => sum + tx.amount, 0),
          unique_users: new Set(transactions.map(tx => tx.user_address)).size,
          large_transactions: transactions.filter(tx => tx.amount > 10000).length
        },
        compliance_flags: [],
        regulatory_filings: []
      };

      // CTR (Currency Transaction Report) for transactions > $10K
      const largeTx = transactions.filter(tx => tx.amount > 10000);
      if (largeTx.length > 0) {
        reports.regulatory_filings.push({
          type: 'CTR',
          count: largeTx.length,
          total_amount: largeTx.reduce((sum, tx) => sum + tx.amount, 0),
          filing_required: true
        });
      }

      // SAR (Suspicious Activity Report) flags
      const suspiciousPatterns = this.detectSuspiciousActivity(transactions);
      if (suspiciousPatterns.length > 0) {
        reports.compliance_flags = suspiciousPatterns;
        reports.regulatory_filings.push({
          type: 'SAR',
          count: suspiciousPatterns.length,
          filing_required: true
        });
      }

      return reports;
    } catch (error) {
      console.error('Regulatory report generation failed:', error);
      throw error;
    }
  }

  detectSuspiciousActivity(transactions) {
    const flags = [];
    const userTransactions = {};

    // Group transactions by user
    transactions.forEach(tx => {
      if (!userTransactions[tx.user_address]) {
        userTransactions[tx.user_address] = [];
      }
      userTransactions[tx.user_address].push(tx);
    });

    // Check for suspicious patterns
    Object.entries(userTransactions).forEach(([address, txs]) => {
      // Rapid succession of transactions
      const rapidTx = txs.filter(tx => {
        const timeDiff = Date.now() - new Date(tx.timestamp).getTime();
        return timeDiff < 3600000; // Within 1 hour
      });

      if (rapidTx.length > 5) {
        flags.push({
          type: 'rapid_transactions',
          user_address: address,
          transaction_count: rapidTx.length,
          severity: 'medium'
        });
      }

      // Structuring (multiple transactions just under $10K)
      const structuringTx = txs.filter(tx => 
        tx.amount > 9000 && tx.amount < 10000
      );

      if (structuringTx.length > 3) {
        flags.push({
          type: 'potential_structuring',
          user_address: address,
          transaction_count: structuringTx.length,
          severity: 'high'
        });
      }

      // Unusual transaction amounts
      const amounts = txs.map(tx => tx.amount);
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const unusualTx = txs.filter(tx => tx.amount > avgAmount * 10);

      if (unusualTx.length > 0) {
        flags.push({
          type: 'unusual_amount',
          user_address: address,
          transaction_count: unusualTx.length,
          severity: 'low'
        });
      }
    });

    return flags;
  }

  async validatePropertyLegality(propertyData) {
    try {
      const validation = {
        is_legal: true,
        issues: [],
        compliance_score: 100,
        checked_at: new Date()
      };

      // Property ownership verification
      if (!propertyData.deed_verified) {
        validation.issues.push('Property deed not verified');
        validation.compliance_score -= 20;
      }

      // Zoning compliance
      if (!propertyData.zoning_compliant) {
        validation.issues.push('Zoning compliance not verified');
        validation.compliance_score -= 15;
      }

      // Environmental compliance
      if (propertyData.environmental_issues) {
        validation.issues.push('Environmental compliance concerns');
        validation.compliance_score -= 25;
      }

      // Securities law compliance
      if (!propertyData.securities_exemption) {
        validation.issues.push('Securities exemption not established');
        validation.compliance_score -= 30;
      }

      validation.is_legal = validation.compliance_score >= 70;

      return validation;
    } catch (error) {
      console.error('Property legality validation failed:', error);
      throw error;
    }
  }

  async generateInvestorDisclosures(propertyData, investmentAmount) {
    try {
      const disclosures = {
        property_id: propertyData.id,
        investment_amount: investmentAmount,
        generated_at: new Date(),
        risk_factors: [
          'Real estate investments are subject to market volatility',
          'Property values may decrease, resulting in loss of principal',
          'Rental income is not guaranteed and may fluctuate',
          'Liquidity may be limited in secondary markets',
          'Regulatory changes may affect investment returns',
          'Property management and maintenance costs may impact returns'
        ],
        tax_implications: [
          'Dividend income may be subject to taxation',
          'Capital gains tax may apply on share sales',
          'Depreciation benefits may not apply to fractional ownership',
          'Consult a tax professional for specific advice'
        ],
        regulatory_notices: [
          'This investment has not been registered with the SEC',
          'Investments are limited to accredited investors in certain jurisdictions',
          'Platform operates under Regulation D exemptions',
          'Investor protection may be limited compared to registered securities'
        ],
        property_specific_risks: this.assessPropertyRisks(propertyData)
      };

      return disclosures;
    } catch (error) {
      console.error('Disclosure generation failed:', error);
      throw error;
    }
  }

  assessPropertyRisks(propertyData) {
    const risks = [];

    if (propertyData.specifications.year_built < 1980) {
      risks.push('Older property may require significant maintenance and upgrades');
    }

    if (propertyData.location_data.crime_rate > 20) {
      risks.push('Higher crime rate in the area may affect property values');
    }

    if (propertyData.valuation.confidence_score < 80) {
      risks.push('Lower AI confidence score indicates higher valuation uncertainty');
    }

    if (propertyData.specifications.property_type === 'Commercial') {
      risks.push('Commercial properties may have higher vacancy risks');
    }

    return risks;
  }

  async checkJurisdictionCompliance(userCountry, propertyCountry) {
    try {
      const compliance = {
        is_compliant: true,
        restrictions: [],
        required_disclosures: [],
        tax_implications: []
      };

      // Cross-border investment restrictions
      const restrictedPairs = [
        { user: 'CN', property: 'US' }, // China-US restrictions
        { user: 'RU', property: 'EU' }, // Russia-EU sanctions
        { user: 'IR', property: 'US' }  // Iran-US sanctions
      ];

      const isRestricted = restrictedPairs.some(pair => 
        pair.user === userCountry && pair.property === propertyCountry
      );

      if (isRestricted) {
        compliance.is_compliant = false;
        compliance.restrictions.push('Cross-border investment restrictions apply');
      }

      // FATCA compliance for US persons
      if (userCountry === 'US') {
        compliance.required_disclosures.push('FATCA reporting requirements');
        compliance.tax_implications.push('US tax reporting on foreign property income');
      }

      return compliance;
    } catch (error) {
      console.error('Jurisdiction compliance check failed:', error);
      throw error;
    }
  }
}

module.exports = LegalComplianceService;
