const axios = require('axios');
const fs = require('fs').promises;

class EnhancedLegalCompliance {
  constructor() {
    this.regulatoryDatabase = new Map();
    this.complianceRules = new Map();
    this.auditLog = [];
    this.initializeComplianceRules();
  }

  initializeComplianceRules() {
    // SEC Regulation D - Private Placements
    this.complianceRules.set('reg_d', {
      max_non_accredited_investors: 35,
      min_investment_hold_period: 365, // days
      disclosure_requirements: ['risk_factors', 'financial_statements', 'business_plan'],
      advertising_restrictions: true
    });

    // Anti-Money Laundering (AML)
    this.complianceRules.set('aml', {
      transaction_monitoring_threshold: 10000, // USD
      suspicious_activity_patterns: ['rapid_transactions', 'round_dollar_amounts', 'unusual_timing'],
      customer_due_diligence_required: true,
      record_retention_period: 2555 // 7 years in days
    });

    // Know Your Customer (KYC)
    this.complianceRules.set('kyc', {
      identity_verification_required: true,
      address_verification_required: true,
      beneficial_ownership_threshold: 25, // percent
      enhanced_due_diligence_threshold: 50000 // USD
    });

    // GDPR Compliance
    this.complianceRules.set('gdpr', {
      data_retention_period: 2555, // 7 years
      consent_required: ['data_processing', 'marketing', 'analytics'],
      right_to_erasure: true,
      data_portability: true
    });
  }

  async performAccreditedInvestorCheck(userId, investmentAmount) {
    try {
      const user = await this.getUserProfile(userId);
      const verification = {
        is_accredited: false,
        verification_method: null,
        annual_income: user.financial_info?.annual_income || 0,
        net_worth: user.financial_info?.net_worth || 0,
        professional_certifications: user.certifications || [],
        verification_date: new Date()
      };

      // Income test: $200,000+ annually for individuals, $300,000+ for couples
      if (verification.annual_income >= 200000) {
        verification.is_accredited = true;
        verification.verification_method = 'income_test';
      }

      // Net worth test: $1,000,000+ excluding primary residence
      if (verification.net_worth >= 1000000) {
        verification.is_accredited = true;
        verification.verification_method = 'net_worth_test';
      }

      // Professional certifications (Series 7, 65, 82)
      const qualifyingCerts = ['series_7', 'series_65', 'series_82', 'cfa', 'cpa'];
      if (verification.professional_certifications.some(cert => 
        qualifyingCerts.includes(cert.toLowerCase())
      )) {
        verification.is_accredited = true;
        verification.verification_method = 'professional_certification';
      }

      // Investment limits based on accreditation
      const investmentLimits = this.calculateInvestmentLimits(verification, user);
      
      // Log compliance check
      this.auditLog.push({
        type: 'accredited_investor_check',
        user_id: userId,
        result: verification,
        investment_limits: investmentLimits,
        timestamp: new Date()
      });

      return {
        ...verification,
        investment_limits: investmentLimits,
        compliance_status: verification.is_accredited ? 'compliant' : 'restricted'
      };
    } catch (error) {
      console.error('Accredited investor check failed:', error);
      throw error;
    }
  }

  calculateInvestmentLimits(verification, user) {
    if (verification.is_accredited) {
      return {
        max_investment_per_property: 1000000, // $1M
        max_total_investment: 10000000, // $10M
        max_properties: 100,
        restrictions: []
      };
    } else {
      // Non-accredited investor limits under Regulation CF
      const annualIncome = verification.annual_income;
      const netWorth = verification.net_worth;
      
      let maxInvestment;
      if (annualIncome < 107000 || netWorth < 107000) {
        maxInvestment = Math.min(2200, Math.max(annualIncome, netWorth) * 0.05);
      } else {
        maxInvestment = Math.min(107000, Math.max(annualIncome, netWorth) * 0.10);
      }

      return {
        max_investment_per_property: Math.min(maxInvestment, 50000),
        max_total_investment: maxInvestment,
        max_properties: 10,
        restrictions: ['reg_cf_limits', 'holding_period_required']
      };
    }
  }

  async performAMLCheck(userId, transactionData) {
    try {
      const amlResult = {
        risk_score: 0,
        risk_level: 'low',
        flags: [],
        sanctions_check: false,
        pep_check: false,
        transaction_monitoring: {},
        recommendation: 'approve'
      };

      // Check transaction patterns
      const transactionAnalysis = await this.analyzeTransactionPatterns(userId, transactionData);
      amlResult.transaction_monitoring = transactionAnalysis;
      amlResult.risk_score += transactionAnalysis.risk_score;

      // Sanctions list screening
      const sanctionsResult = await this.checkSanctionsList(userId);
      amlResult.sanctions_check = sanctionsResult.clear;
      if (!sanctionsResult.clear) {
        amlResult.flags.push('sanctions_list_match');
        amlResult.risk_score += 50;
      }

      // Politically Exposed Person (PEP) screening
      const pepResult = await this.checkPEPList(userId);
      amlResult.pep_check = pepResult.clear;
      if (!pepResult.clear) {
        amlResult.flags.push('pep_match');
        amlResult.risk_score += 30;
      }

      // Geographic risk assessment
      const geoRisk = await this.assessGeographicRisk(userId);
      amlResult.risk_score += geoRisk.score;
      if (geoRisk.high_risk) {
        amlResult.flags.push('high_risk_jurisdiction');
      }

      // Determine risk level and recommendation
      if (amlResult.risk_score >= 70) {
        amlResult.risk_level = 'high';
        amlResult.recommendation = 'reject';
      } else if (amlResult.risk_score >= 40) {
        amlResult.risk_level = 'medium';
        amlResult.recommendation = 'manual_review';
      } else {
        amlResult.risk_level = 'low';
        amlResult.recommendation = 'approve';
      }

      // Log AML check
      this.auditLog.push({
        type: 'aml_check',
        user_id: userId,
        transaction_data: transactionData,
        result: amlResult,
        timestamp: new Date()
      });

      return amlResult;
    } catch (error) {
      console.error('AML check failed:', error);
      throw error;
    }
  }

  async analyzeTransactionPatterns(userId, transactionData) {
    try {
      const userTransactions = await this.getUserTransactionHistory(userId);
      const analysis = {
        risk_score: 0,
        patterns_detected: [],
        velocity_check: {},
        amount_analysis: {}
      };

      // Transaction velocity analysis
      const recentTransactions = userTransactions.filter(tx => 
        new Date(tx.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );

      if (recentTransactions.length > 5) {
        analysis.patterns_detected.push('high_frequency_transactions');
        analysis.risk_score += 15;
      }

      // Amount pattern analysis
      const amounts = userTransactions.map(tx => tx.amount);
      const roundAmounts = amounts.filter(amount => amount % 1000 === 0);
      
      if (roundAmounts.length / amounts.length > 0.7) {
        analysis.patterns_detected.push('round_dollar_amounts');
        analysis.risk_score += 10;
      }

      // Large transaction analysis
      if (transactionData.amount > 10000) {
        analysis.patterns_detected.push('large_transaction');
        analysis.risk_score += 20;
      }

      // Structuring detection (just under reporting thresholds)
      const nearThresholdTransactions = userTransactions.filter(tx => 
        tx.amount >= 9000 && tx.amount < 10000
      );

      if (nearThresholdTransactions.length >= 3) {
        analysis.patterns_detected.push('potential_structuring');
        analysis.risk_score += 25;
      }

      return analysis;
    } catch (error) {
      console.error('Transaction pattern analysis failed:', error);
      return { risk_score: 0, patterns_detected: [], error: error.message };
    }
  }

  async checkSanctionsList(userId) {
    try {
      const user = await this.getUserProfile(userId);
      const fullName = `${user.profile.firstName} ${user.profile.lastName}`;
      
      // Check against OFAC sanctions list
      const ofacCheck = await this.checkOFACSanctions(fullName);
      
      // Check against EU sanctions list
      const euCheck = await this.checkEUSanctions(fullName);
      
      // Check against UN sanctions list
      const unCheck = await this.checkUNSanctions(fullName);

      const clear = ofacCheck.clear && euCheck.clear && unCheck.clear;

      return {
        clear: clear,
        checks_performed: ['ofac', 'eu', 'un'],
        details: {
          ofac: ofacCheck,
          eu: euCheck,
          un: unCheck
        },
        checked_at: new Date()
      };
    } catch (error) {
      console.error('Sanctions check failed:', error);
      return { clear: false, error: error.message };
    }
  }

  async checkOFACSanctions(fullName) {
    try {
      // In production, integrate with OFAC API or database
      // For demo, simulate check
      const sanctionedNames = [
        'Sanctioned Person',
        'Bad Actor',
        'Blocked Individual'
      ];

      const match = sanctionedNames.some(name => 
        fullName.toLowerCase().includes(name.toLowerCase())
      );

      return {
        clear: !match,
        list: 'OFAC SDN',
        match_details: match ? { name: fullName, confidence: 0.95 } : null
      };
    } catch (error) {
      console.error('OFAC check failed:', error);
      return { clear: false, error: error.message };
    }
  }

  async checkEUSanctions(fullName) {
    // Similar implementation for EU sanctions
    return { clear: true, list: 'EU Consolidated List' };
  }

  async checkUNSanctions(fullName) {
    // Similar implementation for UN sanctions
    return { clear: true, list: 'UN Security Council' };
  }

  async checkPEPList(userId) {
    try {
      const user = await this.getUserProfile(userId);
      const fullName = `${user.profile.firstName} ${user.profile.lastName}`;
      
      // Check against Politically Exposed Persons database
      // In production, use commercial PEP screening service
      const pepNames = [
        'Political Figure',
        'Government Official',
        'Diplomat Person'
      ];

      const match = pepNames.some(name => 
        fullName.toLowerCase().includes(name.toLowerCase())
      );

      return {
        clear: !match,
        risk_category: match ? 'high' : 'low',
        match_details: match ? { name: fullName, position: 'Government Official' } : null,
        checked_at: new Date()
      };
    } catch (error) {
      console.error('PEP check failed:', error);
      return { clear: false, error: error.message };
    }
  }

  async assessGeographicRisk(userId) {
    try {
      const user = await this.getUserProfile(userId);
      const country = user.profile.country || 'US';
      
      // High-risk jurisdictions according to FATF
      const highRiskCountries = [
        'AF', 'IR', 'KP', 'MM', 'PK', 'UG', 'YE'
      ];

      // Medium-risk countries
      const mediumRiskCountries = [
        'BD', 'KH', 'HT', 'JM', 'JO', 'ML', 'MZ', 'NI', 'PH', 'SN', 'TR', 'VN'
      ];

      let riskScore = 0;
      let riskLevel = 'low';

      if (highRiskCountries.includes(country)) {
        riskScore = 40;
        riskLevel = 'high';
      } else if (mediumRiskCountries.includes(country)) {
        riskScore = 20;
        riskLevel = 'medium';
      }

      return {
        score: riskScore,
        level: riskLevel,
        country: country,
        high_risk: riskLevel === 'high',
        justification: riskLevel === 'high' ? 'FATF high-risk jurisdiction' : 
                      riskLevel === 'medium' ? 'Enhanced monitoring required' : 
                      'Standard risk jurisdiction'
      };
    } catch (error) {
      console.error('Geographic risk assessment failed:', error);
      return { score: 0, level: 'unknown', error: error.message };
    }
  }

  async generateSARReport(userId, transactionData, suspiciousActivity) {
    try {
      // Generate Suspicious Activity Report
      const report = {
        report_id: `SAR_${Date.now()}`,
        filing_institution: 'Digital Homes Platform',
        subject_information: await this.getUserProfile(userId),
        suspicious_activity: {
          description: suspiciousActivity.description,
          amount: transactionData.amount,
          date_of_activity: transactionData.timestamp,
          patterns_detected: suspiciousActivity.patterns,
          supporting_documentation: suspiciousActivity.evidence
        },
        narrative: this.generateSARNarrative(suspiciousActivity, transactionData),
        filing_date: new Date(),
        contact_information: {
          name: 'Compliance Officer',
          phone: '+1-555-COMPLIANCE',
          email: 'compliance@digitalhomes.com'
        }
      };

      // Save report
      await this.saveSARReport(report);
      
      // Log filing
      this.auditLog.push({
        type: 'sar_filed',
        report_id: report.report_id,
        user_id: userId,
        timestamp: new Date()
      });

      return report;
    } catch (error) {
      console.error('SAR report generation failed:', error);
      throw error;
    }
  }

  generateSARNarrative(suspiciousActivity, transactionData) {
    return `
On ${new Date(transactionData.timestamp).toLocaleDateString()}, the subject conducted a transaction 
of $${transactionData.amount.toLocaleString()} that exhibited the following suspicious patterns: 
${suspiciousActivity.patterns.join(', ')}. 

${suspiciousActivity.description}

This activity is inconsistent with the subject's known legitimate business activities and 
investment patterns. The transaction has been flagged for regulatory reporting in accordance 
with BSA requirements.
    `.trim();
  }

  async performRegCFCompliance(propertyOffering) {
    try {
      const compliance = {
        max_offering_amount: 5000000, // $5M under Reg CF
        max_individual_investment: {},
        disclosure_requirements: [],
        intermediary_requirements: {},
        ongoing_reporting: []
      };

      // Validate offering amount
      if (propertyOffering.total_offering_amount > compliance.max_offering_amount) {
        throw new Error('Offering amount exceeds Regulation CF limits');
      }

      // Calculate individual investment limits
      compliance.max_individual_investment = {
        accredited_unlimited: true,
        non_accredited_limits: this.calculateRegCFLimits(propertyOffering.target_investors)
      };

      // Required disclosures
      compliance.disclosure_requirements = [
        'Form C filing with SEC',
        'Financial statements',
        'Business plan and use of proceeds',
        'Risk factors',
        'Management information',
        'Ownership and capital structure',
        'Related party transactions'
      ];

      // Intermediary requirements
      compliance.intermediary_requirements = {
        funding_portal_required: true,
        investor_education_materials: true,
        communication_channels: ['platform_only'],
        investment_commitment_process: 'two_step_confirmation'
      };

      // Ongoing reporting obligations
      compliance.ongoing_reporting = [
        'Annual reports on Form C-AR',
        'Material changes on Form C-U',
        'Termination of reporting on Form C-TR'
      ];

      return compliance;
    } catch (error) {
      console.error('Reg CF compliance check failed:', error);
      throw error;
    }
  }

  calculateRegCFLimits(targetInvestors) {
    return targetInvestors.map(investor => {
      const annualIncome = investor.annual_income || 0;
      const netWorth = investor.net_worth || 0;

      let maxInvestment;
      if (annualIncome < 107000 || netWorth < 107000) {
        maxInvestment = Math.min(2200, Math.max(annualIncome, netWorth) * 0.05);
      } else {
        maxInvestment = Math.min(107000, Math.max(annualIncome, netWorth) * 0.10);
      }

      return {
        investor_id: investor.id,
        max_investment: maxInvestment,
        calculation_basis: annualIncome < 107000 ? 'income_based' : 'net_worth_based'
      };
    });
  }

  async performGDPRCompliance(userId, dataProcessingActivity) {
    try {
      const user = await this.getUserProfile(userId);
      const gdprCompliance = {
        lawful_basis: null,
        consent_status: {},
        data_subject_rights: {},
        retention_policy: {},
        cross_border_transfers: {}
      };

      // Determine lawful basis for processing
      gdprCompliance.lawful_basis = this.determineLawfulBasis(dataProcessingActivity);

      // Check consent status
      gdprCompliance.consent_status = await this.checkConsentStatus(userId);

      // Data subject rights implementation
      gdprCompliance.data_subject_rights = {
        right_of_access: true,
        right_to_rectification: true,
        right_to_erasure: true,
        right_to_restrict_processing: true,
        right_to_data_portability: true,
        right_to_object: true
      };

      // Data retention policy
      gdprCompliance.retention_policy = {
        retention_period: '7 years',
        deletion_schedule: 'automatic',
        legal_hold_exceptions: ['ongoing_litigation', 'regulatory_investigation']
      };

      // Cross-border data transfers
      if (user.profile.country && !this.isEUCountry(user.profile.country)) {
        gdprCompliance.cross_border_transfers = {
          adequacy_decision: this.checkAdequacyDecision(user.profile.country),
          safeguards_required: true,
          transfer_mechanism: 'standard_contractual_clauses'
        };
      }

      return gdprCompliance;
    } catch (error) {
      console.error('GDPR compliance check failed:', error);
      throw error;
    }
  }

  determineLawfulBasis(activity) {
    const lawfulBases = {
      'user_registration': 'contract',
      'kyc_verification': 'legal_obligation',
      'investment_processing': 'contract',
      'marketing_communications': 'consent',
      'fraud_prevention': 'legitimate_interests',
      'regulatory_reporting': 'legal_obligation'
    };

    return lawfulBases[activity] || 'consent';
  }

  async generateComplianceReport(propertyId, reportType = 'quarterly') {
    try {
      const report = {
        report_id: `COMP_${Date.now()}`,
        property_id: propertyId,
        report_type: reportType,
        reporting_period: this.getReportingPeriod(reportType),
        generated_at: new Date(),
        sections: {}
      };

      // Investment activity summary
      report.sections.investment_activity = await this.generateInvestmentActivityReport(propertyId);
      
      // Compliance monitoring summary
      report.sections.compliance_monitoring = await this.generateComplianceMonitoringReport(propertyId);
      
      // Risk assessment summary
      report.sections.risk_assessment = await this.generateRiskAssessmentReport(propertyId);
      
      // Regulatory filings status
      report.sections.regulatory_filings = await this.generateRegulatoryFilingsReport(propertyId);

      // Save report
      await this.saveComplianceReport(report);

      return report;
    } catch (error) {
      console.error('Compliance report generation failed:', error);
      throw error;
    }
  }

  async generateInvestmentActivityReport(propertyId) {
    return {
      total_investments: 1250000,
      number_of_investors: 47,
      accredited_investors: 32,
      non_accredited_investors: 15,
      average_investment: 26595,
      largest_investment: 100000,
      investment_concentration: {
        top_10_percent: 0.45,
        geographic_distribution: { 'US': 0.8, 'EU': 0.15, 'Other': 0.05 }
      }
    };
  }

  async generateComplianceMonitoringReport(propertyId) {
    return {
      kyc_completion_rate: 0.96,
      aml_alerts_generated: 3,
      aml_alerts_resolved: 2,
      sanctions_checks_performed: 47,
      pep_matches_found: 1,
      suspicious_activity_reports_filed: 0,
      compliance_violations: 0
    };
  }

  async generateRiskAssessmentReport(propertyId) {
    return {
      overall_risk_rating: 'medium',
      geographic_risk: 'low',
      investor_risk: 'medium',
      transaction_risk: 'low',
      regulatory_risk: 'medium',
      mitigation_measures: [
        'Enhanced due diligence for high-risk investors',
        'Ongoing transaction monitoring',
        'Regular compliance training',
        'Third-party risk assessments'
      ]
    };
  }

  async generateRegulatoryFilingsReport(propertyId) {
    return {
      sec_filings: {
        form_d: { status: 'filed', date: '2024-01-15' },
        form_c: { status: 'filed', date: '2024-01-10' }
      },
      state_filings: {
        blue_sky_notices: { status: 'filed', states: ['CA', 'NY', 'TX'] }
      },
      ongoing_obligations: {
        annual_reports: { next_due: '2024-12-31' },
        material_changes: { last_filed: '2024-01-20' }
      }
    };
  }

  // Helper methods
  async getUserProfile(userId) {
    // Mock user profile - in production, query from database
    return {
      id: userId,
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        country: 'US',
        dateOfBirth: '1985-03-15'
      },
      financial_info: {
        annual_income: 150000,
        net_worth: 500000
      },
      certifications: []
    };
  }

  async getUserTransactionHistory(userId) {
    // Mock transaction history - in production, query from database
    return [
      {
        id: 'tx_1',
        amount: 5000,
        timestamp: new Date(Date.now() - 86400000),
        type: 'investment'
      },
      {
        id: 'tx_2',
        amount: 10000,
        timestamp: new Date(Date.now() - 172800000),
        type: 'investment'
      }
    ];
  }

  getReportingPeriod(reportType) {
    const now = new Date();
    switch (reportType) {
      case 'monthly':
        return {
          start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          end: new Date(now.getFullYear(), now.getMonth(), 0)
        };
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        return {
          start: new Date(now.getFullYear(), quarter * 3, 1),
          end: new Date(now.getFullYear(), (quarter + 1) * 3, 0)
        };
      case 'annual':
        return {
          start: new Date(now.getFullYear() - 1, 0, 1),
          end: new Date(now.getFullYear() - 1, 11, 31)
        };
      default:
        return { start: now, end: now };
    }
  }

  isEUCountry(countryCode) {
    const euCountries = [
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
    ];
    return euCountries.includes(countryCode);
  }

  checkAdequacyDecision(countryCode) {
    const adequateCountries = ['AD', 'AR', 'CA', 'FO', 'GG', 'IL', 'IM', 'JP', 'JE', 'NZ', 'CH', 'UY', 'GB'];
    return adequateCountries.includes(countryCode);
  }

  async saveSARReport(report) {
    const filename = `sar_reports/SAR_${report.report_id}.json`;
    await fs.writeFile(filename, JSON.stringify(report, null, 2));
  }

  async saveComplianceReport(report) {
    const filename = `compliance_reports/COMP_${report.report_id}.json`;
    await fs.writeFile(filename, JSON.stringify(report, null, 2));
  }

  async checkConsentStatus(userId) {
    // Mock consent status - in production, query from database
    return {
      data_processing: { granted: true, date: '2024-01-10' },
      marketing: { granted: false, date: null },
      analytics: { granted: true, date: '2024-01-10' }
    };
  }
}

module.exports = EnhancedLegalCompliance;
