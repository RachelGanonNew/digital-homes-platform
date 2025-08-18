const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');

class KYCService {
  constructor() {
    this.storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/kyc');
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      }
    });

    this.upload = multer({
      storage: this.storage,
      limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
        }
      }
    });
  }

  async processKYCDocuments(userId, documents) {
    try {
      const results = {
        identity_verification: null,
        address_verification: null,
        income_verification: null,
        overall_status: 'pending'
      };

      // Process each document type
      for (const [docType, filePath] of Object.entries(documents)) {
        const verification = await this.verifyDocument(docType, filePath);
        results[docType] = verification;
      }

      // Determine overall KYC status
      results.overall_status = this.determineKYCStatus(results);

      // Update user record
      await this.updateUserKYCStatus(userId, results);

      return results;
    } catch (error) {
      console.error('KYC processing failed:', error);
      throw error;
    }
  }

  async verifyDocument(docType, filePath) {
    try {
      // Simulate document verification using AI/OCR service
      const documentData = await this.extractDocumentData(filePath);
      const verification = await this.validateDocumentData(docType, documentData);

      return {
        status: verification.isValid ? 'approved' : 'rejected',
        confidence_score: verification.confidence,
        extracted_data: documentData,
        verification_notes: verification.notes,
        processed_at: new Date()
      };
    } catch (error) {
      console.error(`Document verification failed for ${docType}:`, error);
      return {
        status: 'failed',
        error: error.message,
        processed_at: new Date()
      };
    }
  }

  async extractDocumentData(filePath) {
    try {
      // Simulate OCR/AI document extraction
      // In production, integrate with services like AWS Textract, Google Vision API, or Azure Form Recognizer
      
      const fileExtension = path.extname(filePath).toLowerCase();
      
      if (fileExtension === '.pdf') {
        return await this.extractPDFData(filePath);
      } else {
        return await this.extractImageData(filePath);
      }
    } catch (error) {
      console.error('Document data extraction failed:', error);
      throw error;
    }
  }

  async extractPDFData(filePath) {
    // Mock PDF extraction - in production use pdf-parse or similar
    return {
      document_type: 'government_id',
      full_name: 'John Doe',
      date_of_birth: '1990-01-15',
      document_number: 'DL123456789',
      expiration_date: '2028-01-15',
      address: '123 Main St, City, State 12345',
      extracted_text: 'Mock extracted text from PDF'
    };
  }

  async extractImageData(filePath) {
    // Mock image extraction - in production use Google Vision API or AWS Rekognition
    return {
      document_type: 'government_id',
      full_name: 'Jane Smith',
      date_of_birth: '1985-03-22',
      document_number: 'ID987654321',
      expiration_date: '2027-03-22',
      address: '456 Oak Ave, Town, State 54321',
      confidence_scores: {
        text_detection: 0.95,
        face_match: 0.88,
        document_authenticity: 0.92
      }
    };
  }

  async validateDocumentData(docType, documentData) {
    try {
      let isValid = true;
      let confidence = 0.9;
      let notes = [];

      switch (docType) {
        case 'identity_verification':
          // Validate government ID
          if (!documentData.full_name || !documentData.date_of_birth) {
            isValid = false;
            notes.push('Missing required identity information');
          }

          // Check document expiration
          const expirationDate = new Date(documentData.expiration_date);
          if (expirationDate < new Date()) {
            isValid = false;
            notes.push('Document has expired');
          }

          // Age verification (must be 18+)
          const birthDate = new Date(documentData.date_of_birth);
          const age = Math.floor((new Date() - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
          if (age < 18) {
            isValid = false;
            notes.push('User must be 18 or older');
          }

          break;

        case 'address_verification':
          // Validate proof of address
          if (!documentData.address) {
            isValid = false;
            notes.push('No address found in document');
          }

          // Check document date (must be within 3 months)
          const documentDate = new Date(documentData.document_date || Date.now());
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          
          if (documentDate < threeMonthsAgo) {
            isValid = false;
            notes.push('Document is older than 3 months');
          }

          break;

        case 'income_verification':
          // Validate income documentation
          if (!documentData.annual_income) {
            isValid = false;
            notes.push('Annual income not found');
          }

          // Minimum income requirement for accredited investor status
          if (documentData.annual_income < 200000) {
            notes.push('Income below accredited investor threshold');
            confidence = 0.7;
          }

          break;
      }

      // Additional security checks
      await this.performSecurityChecks(documentData);

      return {
        isValid,
        confidence,
        notes
      };
    } catch (error) {
      console.error('Document validation failed:', error);
      return {
        isValid: false,
        confidence: 0,
        notes: ['Validation process failed']
      };
    }
  }

  async performSecurityChecks(documentData) {
    try {
      // Check against sanctions lists
      const sanctionsCheck = await this.checkSanctionsList(documentData.full_name);
      
      // Verify document authenticity
      const authenticityCheck = await this.verifyDocumentAuthenticity(documentData);
      
      // Cross-reference with external databases
      const crossReference = await this.crossReferenceData(documentData);

      return {
        sanctions_clear: sanctionsCheck.clear,
        document_authentic: authenticityCheck.authentic,
        data_verified: crossReference.verified
      };
    } catch (error) {
      console.error('Security checks failed:', error);
      return {
        sanctions_clear: false,
        document_authentic: false,
        data_verified: false
      };
    }
  }

  async checkSanctionsList(fullName) {
    try {
      // In production, integrate with OFAC, EU sanctions lists, etc.
      // For demo, simulate check
      const sanctionedNames = ['Bad Actor', 'Sanctioned Person'];
      const clear = !sanctionedNames.some(name => 
        fullName.toLowerCase().includes(name.toLowerCase())
      );

      return { clear, checked_at: new Date() };
    } catch (error) {
      console.error('Sanctions check failed:', error);
      return { clear: false, error: error.message };
    }
  }

  async verifyDocumentAuthenticity(documentData) {
    try {
      // Simulate document authenticity verification
      // In production, use specialized document verification services
      const authenticityScore = Math.random() * 0.3 + 0.7; // 70-100%
      
      return {
        authentic: authenticityScore > 0.8,
        confidence: authenticityScore,
        checks_performed: ['format_validation', 'security_features', 'issuer_verification']
      };
    } catch (error) {
      console.error('Document authenticity check failed:', error);
      return { authentic: false, error: error.message };
    }
  }

  async crossReferenceData(documentData) {
    try {
      // Cross-reference with public records, credit bureaus, etc.
      // Simulate verification process
      const verificationScore = Math.random() * 0.4 + 0.6; // 60-100%

      return {
        verified: verificationScore > 0.75,
        confidence: verificationScore,
        sources_checked: ['public_records', 'credit_bureau', 'address_validation']
      };
    } catch (error) {
      console.error('Cross-reference check failed:', error);
      return { verified: false, error: error.message };
    }
  }

  determineKYCStatus(results) {
    const verificationTypes = ['identity_verification', 'address_verification', 'income_verification'];
    
    const approvedCount = verificationTypes.filter(type => 
      results[type] && results[type].status === 'approved'
    ).length;

    if (approvedCount === verificationTypes.length) {
      return 'approved';
    } else if (approvedCount >= 2) {
      return 'partial_approval';
    } else if (verificationTypes.some(type => 
      results[type] && results[type].status === 'rejected'
    )) {
      return 'rejected';
    } else {
      return 'pending';
    }
  }

  async updateUserKYCStatus(userId, kycResults) {
    try {
      // Update user record in database
      // This would connect to your actual database
      console.log(`Updating KYC status for user ${userId}:`, kycResults.overall_status);
      
      return {
        user_id: userId,
        kyc_status: kycResults.overall_status,
        updated_at: new Date()
      };
    } catch (error) {
      console.error('KYC status update failed:', error);
      throw error;
    }
  }

  async getKYCStatus(userId) {
    try {
      // Retrieve KYC status from database
      // Mock response for demonstration
      return {
        user_id: userId,
        kyc_status: 'pending',
        verification_level: 'basic',
        documents_submitted: ['identity_verification'],
        last_updated: new Date(),
        next_steps: ['Submit proof of address', 'Submit income verification']
      };
    } catch (error) {
      console.error('KYC status retrieval failed:', error);
      throw error;
    }
  }

  async generateKYCReport(userId) {
    try {
      const kycStatus = await this.getKYCStatus(userId);
      
      return {
        user_id: userId,
        report_generated_at: new Date(),
        compliance_status: kycStatus.kyc_status,
        verification_details: kycStatus,
        regulatory_notes: this.generateRegulatoryNotes(kycStatus),
        recommendations: this.generateRecommendations(kycStatus)
      };
    } catch (error) {
      console.error('KYC report generation failed:', error);
      throw error;
    }
  }

  generateRegulatoryNotes(kycStatus) {
    const notes = [];
    
    if (kycStatus.kyc_status === 'approved') {
      notes.push('User meets all KYC requirements for platform access');
    }
    
    if (kycStatus.verification_level === 'accredited') {
      notes.push('User qualifies as accredited investor under SEC regulations');
    }
    
    return notes;
  }

  generateRecommendations(kycStatus) {
    const recommendations = [];
    
    if (kycStatus.kyc_status === 'pending') {
      recommendations.push('Complete remaining document submissions');
    }
    
    if (kycStatus.verification_level === 'basic') {
      recommendations.push('Consider upgrading to intermediate verification for higher investment limits');
    }
    
    return recommendations;
  }
}

module.exports = KYCService;
