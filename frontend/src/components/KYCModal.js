import React, { useState } from 'react';
import { XMarkIcon, DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const KYCModal = ({ isOpen, onClose, onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    phoneNumber: '',
    country: '',
    address: '',
    documents: {}
  });
  const [uploading, setUploading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (documentType, file) => {
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append(documentType, file);

      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/auth/kyc/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataUpload
      });

      if (response.ok) {
        setFormData(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            [documentType]: file.name
          }
        }));
        toast.success(`${documentType} uploaded successfully`);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast.error(`Failed to upload ${documentType}`);
    } finally {
      setUploading(false);
    }
  };

  const submitKYC = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          profile: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            dateOfBirth: formData.dateOfBirth,
            phoneNumber: formData.phoneNumber,
            country: formData.country,
            address: formData.address
          }
        })
      });

      if (response.ok) {
        toast.success('KYC submitted successfully! Approval typically takes 24-48 hours.');
        onComplete?.();
        onClose();
      } else {
        throw new Error('KYC submission failed');
      }
    } catch (error) {
      toast.error('Failed to submit KYC information');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">KYC Verification</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <div className={`w-16 h-1 ${step >= 3 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
            </div>
          </div>

          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="input-field"
                />
                <input
                  type="date"
                  placeholder="Date of Birth"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="input-field"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className="input-field"
                />
                <select
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="input-field"
                >
                  <option value="">Select Country</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="UK">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                </select>
                <input
                  type="text"
                  placeholder="Full Address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="input-field col-span-2"
                />
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!formData.firstName || !formData.lastName || !formData.dateOfBirth}
                className="btn-primary w-full mt-6 disabled:opacity-50"
              >
                Continue to Documents
              </button>
            </div>
          )}

          {/* Step 2: Document Upload */}
          {step === 2 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Identity Documents</h3>
              <div className="space-y-4">
                {[
                  { key: 'passport', label: 'Passport or Government ID', required: true },
                  { key: 'utility_bill', label: 'Proof of Address (Utility Bill)', required: true },
                  { key: 'drivers_license', label: 'Driver\'s License (Optional)', required: false }
                ].map((doc) => (
                  <div key={doc.key} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-medium text-gray-900">{doc.label}</label>
                      {doc.required && <span className="text-red-500 text-sm">Required</span>}
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            handleFileUpload(doc.key, e.target.files[0]);
                          }
                        }}
                        className="flex-1"
                        disabled={uploading}
                      />
                      {formData.documents[doc.key] && (
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex space-x-4 mt-6">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!formData.documents.passport || !formData.documents.utility_bill}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  Continue to Review
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review and Submit */}
          {step === 3 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Review Information</h3>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium mb-2">Personal Details</h4>
                <p>{formData.firstName} {formData.lastName}</p>
                <p>{formData.dateOfBirth}</p>
                <p>{formData.phoneNumber}</p>
                <p>{formData.address}, {formData.country}</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium mb-2">Documents Uploaded</h4>
                {Object.keys(formData.documents).map(docType => (
                  <div key={docType} className="flex items-center space-x-2">
                    <DocumentTextIcon className="w-4 h-4 text-green-600" />
                    <span className="capitalize">{docType.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-900 mb-2">Verification Levels</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Basic</strong>: Up to $10,000 per transaction</li>
                  <li>• <strong>Intermediate</strong>: Up to $50,000 per transaction</li>
                  <li>• <strong>Advanced</strong>: Up to $1,000,000 per transaction</li>
                </ul>
              </div>

              <div className="flex space-x-4">
                <button onClick={() => setStep(2)} className="btn-secondary flex-1">
                  Back
                </button>
                <button onClick={submitKYC} className="btn-primary flex-1">
                  Submit for Verification
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KYCModal;
