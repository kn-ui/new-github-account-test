import React, { useState } from 'react';
import { ArrowLeft, Calendar, FileText, Upload, Download } from 'lucide-react';

interface AssignmentDetailProps {
  onBack: () => void;
}

const AssignmentDetail: React.FC<AssignmentDetailProps> = ({ onBack }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Algebra Problem Set 1</h1>
          <p className="text-gray-600">Mathematics 101 • Dr. Smith</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assignment Description */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Assignment Description</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Write a paper analyzing one major doctrine from Systematic Theology (e.g., the Trinity, 
              Salvation, Christology, or Eschatology). Explain the biblical foundation, historical development, 
              and contemporary relevance of the doctrine. Support your work with scripture references, 
              theological sources, and clear reasoning.
            </p>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Requirements:</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  Choose one doctrine from the provided list or as approved by the instructor.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  Write 1,500–2,000 words (approx. 5–7 pages).
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  Clearly connect biblical passages to theological conclusions.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  Submit as a PDF file
                </li>
              </ul>
            </div>

            <div className="mt-6 space-y-4">
              <h3 className="font-semibold text-gray-800">Grading Criteria:</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                  Correct solutions (60%)
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                  Work shown (25%)
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                  Clear explanations (15%)
                </li>
              </ul>
            </div>
          </div>

          {/* Submit Assignment */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Submit Assignment</h2>
            
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Upload size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Drop your file here or click to browse</p>
              
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Choose File
              </label>
              
              {selectedFile && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Selected: {selectedFile.name}
                  </p>
                </div>
              )}
            </div>
            
            <button className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Submit Assignment
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Due Date */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={20} className="text-blue-600" />
              <h3 className="font-semibold text-gray-800">Due Date</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">2025-01-20</p>
            <p className="text-sm text-red-600 font-medium">Past due</p>
          </div>

          {/* Assignment Info */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Assignment Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Points</span>
                <span className="font-medium">100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Attempts</span>
                <span className="font-medium">2/3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Format</span>
                <span className="font-medium">PDF, DOC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="font-medium text-red-600">Not Submitted</span>
              </div>
            </div>
          </div>

          {/* Resources */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Resources</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                <FileText size={16} className="text-blue-600" />
                <span className="text-sm text-gray-700">Problem Set Worksheet</span>
                <Download size={14} className="text-gray-400 ml-auto" />
              </button>
              <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                <FileText size={16} className="text-blue-600" />
                <span className="text-sm text-gray-700">Reference</span>
                <Download size={14} className="text-gray-400 ml-auto" />
              </button>
              <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                <FileText size={16} className="text-blue-600" />
                <span className="text-sm text-gray-700">Example Solutions</span>
                <Download size={14} className="text-gray-400 ml-auto" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetail;