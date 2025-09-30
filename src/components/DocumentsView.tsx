import React from 'react';
import { Upload, FileText, Home, AlertCircle, User, Download, Eye, ExternalLink } from 'lucide-react';

// UI Components interfaces
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline';
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}

interface SelectItemProps {
  children: React.ReactNode;
  value: string;
}

// UI Components
const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => (
  <div className={`border p-4 rounded ${className}`} {...props}>{children}</div>
);

const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`mb-4 ${className}`} {...props}>{children}</div>
);

const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className = '', ...props }) => (
  <h2 className={`text-xl font-bold ${className}`} {...props}>{children}</h2>
);

const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ children, className = '', ...props }) => (
  <p className={`text-gray-600 ${className}`} {...props}>{children}</p>
);

const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={className} {...props}>{children}</div>
);

const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  className = '', 
  disabled = false, 
  variant = 'default',
  ...props 
}) => {
  const baseClasses = "px-4 py-2 rounded transition-colors";
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
  };
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Input: React.FC<InputProps> = ({ className = '', ...props }) => (
  <input {...props} className={`border p-2 rounded w-full ${className}`} />
);

const Label: React.FC<LabelProps> = ({ children, className = '', ...props }) => (
  <label {...props} className={`block text-sm font-medium mb-1 ${className}`}>{children}</label>
);

const Select: React.FC<SelectProps> = ({ children, value, onValueChange, className = '', ...props }) => (
  <select 
    value={value} 
    onChange={(e) => onValueChange && onValueChange(e.target.value)}
    className={`border p-2 rounded w-full ${className}`}
    {...props}
  >
    {children}
  </select>
);

const SelectItem: React.FC<SelectItemProps> = ({ children, value }) => (
  <option value={value}>{children}</option>
);

// Data interfaces
interface Unit {
  id: string;
  investorId: string;
  name: string;
  unitNumber: string;
  project: string;
  type: string;
  area: string;
  currentValue: number;
  purchaseValue: number;
  monthlyRental: number;
  occupancyStatus: 'Occupied' | 'Vacant';
  location: string;
}

interface Document {
  id: string;
  investorId: string;
  name: string;
  type: string;
  category?: string;
  unitId?: string | null;
  uploadDate: string;
  status: 'Processing' | 'Processed' | 'Error';
  extractedData?: any;
  fileUrl?: string;
  fileData?: string;
  fileSize?: number;
  fileType?: string;
  googleDrive?: {
    fileId?: string;
    fileName?: string;
    webViewLink?: string;
    webContentLink?: string;
    size?: string;
    mimeType?: string;
  };
}

// DocumentsView Props Interface
interface DocumentsViewProps {
  documentCategory: string;
  setDocumentCategory: (value: string) => void;
  selectedUnitForDoc: string;
  setSelectedUnitForDoc: (value: string) => void;
  showAddUnitForm: boolean;
  setShowAddUnitForm: (value: boolean) => void;
  documentType: string;
  setDocumentType: (value: string) => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingDocument: boolean;
  units: Unit[];
  newUnitForm: {
    name: string;
    unitNumber: string;
    project: string;
    type: string;
    area: string;
  };
  setNewUnitForm: React.Dispatch<React.SetStateAction<{
    name: string;
    unitNumber: string;
    project: string;
    type: string;
    area: string;
  }>>;
  createNewUnit: () => void;
  documents: Document[];
  expandedFolders: Set<string>;
  setExpandedFolders: React.Dispatch<React.SetStateAction<Set<string>>>;
  toggleFolder: (folderName: string) => void;
}

const DocumentsView: React.FC<DocumentsViewProps> = ({
  documentCategory,
  setDocumentCategory,
  selectedUnitForDoc,
  setSelectedUnitForDoc,
  showAddUnitForm,
  setShowAddUnitForm,
  documentType,
  setDocumentType,
  handleFileUpload,
  uploadingDocument,
  units,
  newUnitForm,
  setNewUnitForm,
  createNewUnit,
  documents,
  expandedFolders,
  setExpandedFolders,
  toggleFolder
}) => {

  // Enhanced file viewing function
  const handleViewFile = async (doc: Document) => {
    console.log('Attempting to view file:', doc.name);
    console.log('File data available:', !!doc.fileData);
    console.log('File URL available:', !!doc.fileUrl);
    console.log('Google Drive info:', doc.googleDrive);

    // Priority 1: Try Google Drive link first
    if (doc.googleDrive && doc.googleDrive.webViewLink) {
      console.log('Opening Google Drive link');
      window.open(doc.googleDrive.webViewLink, '_blank');
      return;
    }

    // Priority 2: Try base64 file data
    if (doc.fileData && typeof doc.fileData === 'string') {
      try {
        console.log('Using base64 file data');
        
        // Ensure proper base64 format
        let fileDataToUse = doc.fileData;
        if (!fileDataToUse.startsWith('data:')) {
          // If it doesn't start with data:, assume it's raw base64 and add proper header
          const mimeType = doc.fileType || 'application/octet-stream';
          fileDataToUse = `data:${mimeType};base64,${fileDataToUse}`;
        }
        
        const newWindow = window.open('', '_blank');
        if (!newWindow) {
          alert('Popup blocked. Please allow popups for this site.');
          return;
        }

        // Handle PDF files
        if (fileDataToUse.includes('pdf') || doc.fileType?.includes('pdf') || doc.name.toLowerCase().endsWith('.pdf')) {
          newWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${doc.name || 'Document'}</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body { 
                    margin: 0; 
                    padding: 0; 
                    background: #2c3e50; 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
                    overflow: hidden;
                  }
                  .header {
                    background: rgba(0,0,0,0.9);
                    color: white;
                    padding: 12px 20px;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 1000;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                  }
                  .header h3 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                    max-width: 300px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                  }
                  .controls {
                    display: flex;
                    gap: 8px;
                  }
                  .controls button {
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    transition: background-color 0.2s;
                  }
                  .controls button:hover {
                    background: #0056b3;
                  }
                  .controls button.danger {
                    background: #dc3545;
                  }
                  .controls button.danger:hover {
                    background: #c82333;
                  }
                  .pdf-container {
                    margin-top: 60px;
                    width: 100vw;
                    height: calc(100vh - 60px);
                    position: relative;
                  }
                  embed, iframe {
                    width: 100%;
                    height: 100%;
                    border: none;
                    background: white;
                  }
                  .fallback {
                    padding: 40px 20px;
                    color: white;
                    text-align: center;
                    background: #34495e;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                  }
                  .download-link {
                    color: #007bff;
                    text-decoration: none;
                    padding: 12px 24px;
                    background: white;
                    border-radius: 8px;
                    display: inline-block;
                    margin: 20px;
                    font-weight: 600;
                    transition: transform 0.2s;
                  }
                  .download-link:hover {
                    transform: translateY(-1px);
                  }
                  .loading {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: white;
                    font-size: 18px;
                  }
                </style>
              </head>
              <body>
                <div class="header">
                  <h3>📄 ${doc.name || 'Document'}</h3>
                  <div class="controls">
                    <button onclick="downloadFile()" title="Download PDF">📥 Download</button>
                    <button onclick="window.print()" title="Print PDF">🖨️ Print</button>
                    <button onclick="window.close()" class="danger" title="Close">✕ Close</button>
                  </div>
                </div>
                <div class="pdf-container">
                  <div class="loading" id="loading">Loading PDF...</div>
                  <embed src="${fileDataToUse}" type="application/pdf" onload="document.getElementById('loading').style.display='none'" />
                  <div class="fallback" id="fallback" style="display: none;">
                    <h2>📄 PDF Viewer Not Available</h2>
                    <p>Your browser doesn't support inline PDF viewing.</p>
                    <a href="${fileDataToUse}" download="${doc.name}" class="download-link">📥 Download PDF</a>
                  </div>
                </div>
                
                <script>
                  function downloadFile() {
                    const link = document.createElement('a');
                    link.href = '${fileDataToUse}';
                    link.download = '${doc.name || 'document.pdf'}';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                  
                  // Check if PDF loaded successfully
                  setTimeout(() => {
                    const embed = document.querySelector('embed');
                    const loading = document.getElementById('loading');
                    const fallback = document.getElementById('fallback');
                    
                    if (!embed || embed.offsetHeight === 0) {
                      loading.style.display = 'none';
                      fallback.style.display = 'flex';
                      embed.style.display = 'none';
                    } else {
                      loading.style.display = 'none';
                    }
                  }, 3000);

                  // Handle keyboard shortcuts
                  document.addEventListener('keydown', function(e) {
                    if (e.ctrlKey || e.metaKey) {
                      switch(e.key) {
                        case 's':
                          e.preventDefault();
                          downloadFile();
                          break;
                        case 'p':
                          e.preventDefault();
                          window.print();
                          break;
                        case 'w':
                          e.preventDefault();
                          window.close();
                          break;
                      }
                    }
                    if (e.key === 'Escape') {
                      window.close();
                    }
                  });
                </script>
              </body>
            </html>
          `);
        } 
        // Handle image files
        else if (fileDataToUse.includes('image') || doc.fileType?.includes('image') || 
                 /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(doc.name)) {
          newWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${doc.name || 'Document'}</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body { 
                    margin: 0; 
                    padding: 0; 
                    background: #f8f9fa; 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
                    overflow: auto;
                  }
                  .header {
                    background: rgba(0,0,0,0.9);
                    color: white;
                    padding: 12px 20px;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 1000;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                  }
                  .header h3 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                    max-width: 300px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                  }
                  .controls {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                  }
                  .controls button {
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    transition: background-color 0.2s;
                    white-space: nowrap;
                  }
                  .controls button:hover {
                    background: #0056b3;
                  }
                  .controls button.danger {
                    background: #dc3545;
                  }
                  .controls button.danger:hover {
                    background: #c82333;
                  }
                  .image-container {
                    margin-top: 80px;
                    padding: 20px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: calc(100vh - 120px);
                    position: relative;
                  }
                  .document-image {
                    max-width: 90vw;
                    max-height: 80vh;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                    border-radius: 8px;
                    cursor: zoom-in;
                    transition: all 0.3s ease;
                    background: white;
                    border: 1px solid #e9ecef;
                  }
                  .document-image.zoomed {
                    cursor: zoom-out;
                    transform-origin: center;
                    max-width: none;
                    max-height: none;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                  }
                  .zoom-info {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: rgba(0,0,0,0.8);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: 600;
                    backdrop-filter: blur(10px);
                  }
                  .image-info {
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    background: rgba(0,0,0,0.8);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    backdrop-filter: blur(10px);
                  }
                  .loading {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(0,0,0,0.8);
                    color: white;
                    padding: 20px;
                    border-radius: 8px;
                    font-size: 16px;
                  }
                </style>
              </head>
              <body>
                <div class="header">
                  <h3>🖼️ ${doc.name || 'Document'}</h3>
                  <div class="controls">
                    <button onclick="fitToScreen()" title="Fit to screen">📐 Fit</button>
                    <button onclick="actualSize()" title="Actual size">🔍 100%</button>
                    <button onclick="zoomIn()" title="Zoom in">🔍+ Zoom In</button>
                    <button onclick="zoomOut()" title="Zoom out">🔍- Zoom Out</button>
                    <button onclick="downloadFile()" title="Download image">📥 Download</button>
                    <button onclick="window.close()" class="danger" title="Close">✕ Close</button>
                  </div>
                </div>
                <div class="image-container">
                  <div class="loading" id="loading">Loading image...</div>
                  <img id="documentImage" class="document-image" src="${fileDataToUse}" alt="${doc.name || 'Document'}" 
                       onload="handleImageLoad()" 
                       onerror="handleImageError()" 
                       style="display: none;" />
                </div>
                <div class="zoom-info" id="zoomInfo">100%</div>
                <div class="image-info" id="imageInfo"></div>
                
                <script>
                  let currentZoom = 1;
                  const img = document.getElementById('documentImage');
                  const zoomInfo = document.getElementById('zoomInfo');
                  const imageInfo = document.getElementById('imageInfo');
                  const loading = document.getElementById('loading');
                  
                  function handleImageLoad() {
                    loading.style.display = 'none';
                    img.style.display = 'block';
                    updateImageInfo();
                    fitToScreen();
                  }
                  
                  function handleImageError() {
                    loading.innerHTML = '❌ Failed to load image';
                    console.error('Image failed to load');
                  }
                  
                  function updateImageInfo() {
                    const size = '${doc.fileSize ? (doc.fileSize / 1024 / 1024).toFixed(1) + ' MB' : 'Unknown size'}';
                    imageInfo.textContent = \`\${img.naturalWidth}×\${img.naturalHeight} • \${size}\`;
                  }
                  
                  function updateZoomInfo() {
                    zoomInfo.textContent = Math.round(currentZoom * 100) + '%';
                  }
                  
                  function fitToScreen() {
                    img.style.maxWidth = '90vw';
                    img.style.maxHeight = '80vh';
                    img.style.width = 'auto';
                    img.style.height = 'auto';
                    img.style.transform = 'scale(1)';
                    img.style.position = 'static';
                    img.classList.remove('zoomed');
                    currentZoom = 1;
                    updateZoomInfo();
                  }
                  
                  function actualSize() {
                    img.style.maxWidth = 'none';
                    img.style.maxHeight = 'none';
                    img.style.width = 'auto';
                    img.style.height = 'auto';
                    img.style.transform = 'scale(1) translate(-50%, -50%)';
                    img.style.position = 'absolute';
                    img.classList.add('zoomed');
                    currentZoom = 1;
                    updateZoomInfo();
                  }
                  
                  function zoomIn() {
                    currentZoom += 0.25;
                    img.style.transform = \`scale(\${currentZoom}) translate(-50%, -50%)\`;
                    img.style.position = 'absolute';
                    img.style.maxWidth = 'none';
                    img.style.maxHeight = 'none';
                    img.classList.add('zoomed');
                    updateZoomInfo();
                  }
                  
                  function zoomOut() {
                    currentZoom = Math.max(0.25, currentZoom - 0.25);
                    if (currentZoom <= 1) {
                      fitToScreen();
                    } else {
                      img.style.transform = \`scale(\${currentZoom}) translate(-50%, -50%)\`;
                      img.style.position = 'absolute';
                      img.classList.add('zoomed');
                    }
                    updateZoomInfo();
                  }
                  
                  function downloadFile() {
                    const link = document.createElement('a');
                    link.href = '${fileDataToUse}';
                    link.download = '${doc.name || 'image'}';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                  
                  // Add click to zoom functionality
                  img.addEventListener('click', function() {
                    if (img.classList.contains('zoomed')) {
                      fitToScreen();
                    } else {
                      actualSize();
                    }
                  });

                  // Handle keyboard shortcuts
                  document.addEventListener('keydown', function(e) {
                    if (e.ctrlKey || e.metaKey) {
                      switch(e.key) {
                        case 's':
                          e.preventDefault();
                          downloadFile();
                          break;
                        case '=':
                        case '+':
                          e.preventDefault();
                          zoomIn();
                          break;
                        case '-':
                          e.preventDefault();
                          zoomOut();
                          break;
                        case '0':
                          e.preventDefault();
                          fitToScreen();
                          break;
                      }
                    }
                    if (e.key === 'Escape') {
                      window.close();
                    }
                  });
                </script>
              </body>
            </html>
          `);
        }
        // Handle other file types
        else {
          newWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${doc.name || 'Document'}</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body { 
                    margin: 0; 
                    padding: 20px; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  }
                  .container {
                    max-width: 500px;
                    margin: 0 auto;
                    padding: 40px;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    text-align: center;
                  }
                  .file-icon {
                    font-size: 80px;
                    margin-bottom: 20px;
                    opacity: 0.8;
                  }
                  .file-name {
                    font-size: 20px;
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 10px;
                    word-break: break-word;
                  }
                  .file-info {
                    color: #666;
                    margin-bottom: 30px;
                    font-size: 14px;
                  }
                  .actions {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                    flex-wrap: wrap;
                  }
                  .download-btn, .close-btn {
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 600;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;
                    border: none;
                  }
                  .download-btn {
                    background: #007bff;
                    color: white;
                  }
                  .download-btn:hover {
                    background: #0056b3;
                    transform: translateY(-1px);
                  }
                  .close-btn {
                    background: #6c757d;
                    color: white;
                  }
                  .close-btn:hover {
                    background: #545b62;
                    transform: translateY(-1px);
                  }
                  .preview-note {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    padding: 16px;
                    margin: 20px 0;
                    color: #6c757d;
                    font-size: 14px;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="file-icon">📄</div>
                  <div class="file-name">${doc.name || 'Document'}</div>
                  <div class="file-info">
                    Type: ${doc.fileType || 'Unknown'}<br>
                    ${doc.fileSize ? `Size: ${(doc.fileSize / 1024 / 1024).toFixed(1)} MB` : ''}
                  </div>
                  <div class="preview-note">
                    This file type cannot be previewed in the browser.<br>
                    Click download to save and open with an appropriate application.
                  </div>
                  <div class="actions">
                    <a href="${fileDataToUse}" download="${doc.name}" class="download-btn">
                      📥 Download File
                    </a>
                    <button onclick="window.close()" class="close-btn">
                      ✕ Close
                    </button>
                  </div>
                </div>
                
                <script>
                  // Handle keyboard shortcuts
                  document.addEventListener('keydown', function(e) {
                    if (e.ctrlKey || e.metaKey) {
                      if (e.key === 's') {
                        e.preventDefault();
                        document.querySelector('.download-btn').click();
                      }
                    }
                    if (e.key === 'Escape') {
                      window.close();
                    }
                  });
                </script>
              </body>
            </html>
          `);
        }
        
        newWindow.document.close();
        
      } catch (error) {
        console.error('Error opening file with base64:', error);
        alert('Error opening file. The file data might be corrupted. Please try re-uploading the document.');
      }
      return;
    }

    // Priority 3: Try local file URL
    if (doc.fileUrl) {
      console.log('Using local file URL');
      window.open(doc.fileUrl, '_blank');
      return;
    }

    // No file data available
    console.error('No file data available for viewing');
    alert('File not available for viewing. Please re-upload the document.');
  };

  // Download file function
  const handleDownloadFile = (doc: Document) => {
    if (doc.googleDrive && doc.googleDrive.webContentLink) {
      window.open(doc.googleDrive.webContentLink, '_blank');
    } else if (doc.fileData) {
      const link = document.createElement('a');
      link.href = doc.fileData;
      link.download = doc.name || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (doc.fileUrl) {
      window.open(doc.fileUrl, '_blank');
    } else {
      alert('File not available for download. Please re-upload the document.');
    }
  };

  const groupedDocuments = () => {
  const groups: { [key: string]: Document[] } = {};
  
  documents.forEach(doc => {
    // Personal Documents
    if (doc.category === 'Personal Documents') {
      if (!groups['Personal Documents']) groups['Personal Documents'] = [];
      groups['Personal Documents'].push(doc);
    } 
    // Documents with unitId (primary check)
    else if (doc.unitId) {
      const unit = units.find(u => u.id === doc.unitId);
      const unitName = unit ? `${unit.name} (${unit.unitNumber})` : `Unit ${doc.unitId}`;
      if (!groups[unitName]) groups[unitName] = [];
      groups[unitName].push(doc);
    } 
    // Documents where category matches a unit name (secondary check)
    else if (doc.category && doc.category !== 'Other Documents') {
      const matchingUnit = units.find(u => doc.category === u.name);
      if (matchingUnit) {
        const unitName = `${matchingUnit.name} (${matchingUnit.unitNumber})`;
        if (!groups[unitName]) groups[unitName] = [];
        groups[unitName].push(doc);
      } else {
        if (!groups['Other Documents']) groups['Other Documents'] = [];
        groups['Other Documents'].push(doc);
      }
    } 
    // Everything else goes to Other Documents
    else {
      if (!groups['Other Documents']) groups['Other Documents'] = [];
      groups['Other Documents'].push(doc);
    }
  });
  
  return groups;
};
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Document
          </CardTitle>
          <CardDescription>Upload documents organized by category with automatic type detection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="document-category">Document Category</Label>
              <Select value={documentCategory} onValueChange={setDocumentCategory}>
                <SelectItem value="Personal Documents">Personal Documents</SelectItem>
                <SelectItem value="Units">Unit Documents</SelectItem>
              </Select>
            </div>

            {documentCategory === 'Units' && (
              <div>
                <Label htmlFor="unit-select">Select Unit</Label>
                <div className="flex gap-2">
                  <Select 
                    value={selectedUnitForDoc} 
                    onValueChange={setSelectedUnitForDoc}
                    className="flex-1"
                  >
                    <SelectItem value="">Choose unit</SelectItem>
                    {units.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name} ({unit.unitNumber})
                      </SelectItem>
                    ))}
                  </Select>
                  <Button
                    onClick={() => setShowAddUnitForm(true)}
                    variant="outline"
                    className="whitespace-nowrap"
                  >
                    Add Unit
                  </Button>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="document-type">Document Type</Label>
              <Input
                id="document-type"
                list="document-suggestions"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                placeholder={documentCategory === 'Personal Documents' ? 'e.g., Passport, Visa, Emirates ID' : 'e.g., OTP Document, Payment Proof'}
                autoComplete="off"
              />
              <datalist id="document-suggestions">
                {documentCategory === 'Personal Documents' ? (
                  <>
                    <option value="Passport" />
                    <option value="Visa" />
                    <option value="Emirates ID" />
                    <option value="Salary Certificate" />
                    <option value="Bank Statement" />
                    <option value="Brochure" />
                    <option value="ID Document" />
                  </>
                ) : (
                  <>
                    <option value="OTP Document" />
                    <option value="SOA Document" />
                    <option value="Payment Proof" />
                    <option value="Purchase Contract" />
                    <option value="Lease Agreement" />
                    <option value="Brochure" />
                    <option value="Floor Plan" />
                  </>
                )}
              </datalist>
            </div>
          </div>

          <div>
            <Label htmlFor="document-file">Choose File</Label>
            <Input
              id="document-file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              disabled={uploadingDocument || (documentCategory === 'Units' && !selectedUnitForDoc)}
            />
            {documentCategory === 'Units' && !selectedUnitForDoc && (
              <p className="text-sm text-orange-600 mt-1">Please select a unit first or add a new unit</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Unit Form */}
      {showAddUnitForm && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle className="text-blue-900">Add New Unit</CardTitle>
            <CardDescription>Create a new unit to organize your documents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unit-name">Unit Name *</Label>
                <Input
                  id="unit-name"
                  value={newUnitForm.name}
                  onChange={(e) => setNewUnitForm(prev => ({...prev, name: e.target.value}))}
                  placeholder="e.g., Apartment 2A"
                />
              </div>
              <div>
                <Label htmlFor="unit-number">Unit Number *</Label>
                <Input
                  id="unit-number"
                  value={newUnitForm.unitNumber}
                  onChange={(e) => setNewUnitForm(prev => ({...prev, unitNumber: e.target.value}))}
                  placeholder="e.g., A-201"
                />
              </div>
              <div>
                <Label htmlFor="project-name">Project Name *</Label>
                <Input
                  id="project-name"
                  value={newUnitForm.project}
                  onChange={(e) => setNewUnitForm(prev => ({...prev, project: e.target.value}))}
                  placeholder="e.g., Marina Heights"
                />
              </div>
              <div>
                <Label htmlFor="unit-type">Unit Type</Label>
                <Select 
                  value={newUnitForm.type} 
                  onValueChange={(value) => setNewUnitForm(prev => ({...prev, type: value}))}
                >
                  <SelectItem value="Studio">Studio</SelectItem>
                  <SelectItem value="1 Bedroom">1 Bedroom</SelectItem>
                  <SelectItem value="2 Bedroom">2 Bedroom</SelectItem>
                  <SelectItem value="3 Bedroom">3 Bedroom</SelectItem>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={createNewUnit} className="bg-blue-600 hover:bg-blue-700">
                Create Unit
              </Button>
              <Button 
                onClick={() => {
                  setShowAddUnitForm(false);
                  setNewUnitForm({ name: '', unitNumber: '', project: '', type: '', area: '' });
                }} 
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Library */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-900">Document Library</CardTitle>
              <CardDescription>Your documents organized by category</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setExpandedFolders(new Set(Object.keys(groupedDocuments())))}
                className="text-xs"
              >
                Expand All
              </Button>
              <Button
                variant="outline"
                onClick={() => setExpandedFolders(new Set())}
                className="text-xs"
              >
                Collapse All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {Object.keys(groupedDocuments()).length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedDocuments()).map(([categoryName, categoryDocs]) => (
                <div key={categoryName} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className="bg-gray-50 px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleFolder(categoryName)}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-3">
                        <div className={`transform transition-transform duration-200 ${expandedFolders.has(categoryName) ? 'rotate-90' : 'rotate-0'}`}>
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        {categoryName === 'Personal Documents' ? (
                          <User className="h-5 w-5 text-blue-600" />
                        ) : categoryName === 'Other Documents' ? (
                          <FileText className="h-5 w-5 text-gray-600" />
                        ) : (
                          <Home className="h-5 w-5 text-green-600" />
                        )}
                        <span className="flex items-center gap-2">
                          {categoryName}
                          <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                            {categoryDocs.length}
                          </span>
                        </span>
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="hidden sm:inline">
                          {expandedFolders.has(categoryName) ? 'Click to collapse' : 'Click to expand'}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${expandedFolders.has(categoryName) ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      </div>
                    </div>
                  </div>
                  
                  {expandedFolders.has(categoryName) && (
                    <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                      {categoryDocs.map(doc => (
                        <div key={doc.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-gray-600" />
                              <div>
                                <p className="font-medium text-gray-900">{doc.name}</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(doc.uploadDate).toLocaleDateString()}
                                  {doc.fileSize && ` • ${(doc.fileSize / 1024 / 1024).toFixed(1)} MB`}
                                  {doc.googleDrive?.fileId && ' • 📁 Google Drive'}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleViewFile(doc)}
                                variant="outline"
                                className="text-xs flex items-center gap-1"
                                title="View file"
                              >
                                <Eye className="h-3 w-3" />
                                View
                              </Button>
                              <Button
                                onClick={() => handleDownloadFile(doc)}
                                variant="outline"
                                className="text-xs flex items-center gap-1"
                                title="Download file"
                              >
                                <Download className="h-3 w-3" />
                                Download
                              </Button>
                              {doc.googleDrive?.webViewLink && (
                                <Button
                                  onClick={() => window.open(doc.googleDrive?.webViewLink, '_blank')}
                                  variant="outline"
                                  className="text-xs flex items-center gap-1"
                                  title="Open in Google Drive"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Drive
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Document Type Badge */}
                          <div className="mb-3">
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    doc.type === 'Brochure' ? 'bg-purple-100 text-purple-800' :
    doc.type === 'OTP Document' ? 'bg-green-100 text-green-800' :
    doc.type === 'SOA Document' ? 'bg-orange-100 text-orange-800' :
    doc.type === 'Passport' ? 'bg-blue-100 text-blue-800' :
    doc.type === 'Visa' ? 'bg-indigo-100 text-indigo-800' :
    'bg-gray-100 text-gray-800'
  }`}>
    {doc.type}
  </span>
</div>

                          {/* File details display */}
                          {doc.extractedData && doc.status === 'Processed' && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-gray-900">📄 Extracted Information</h4>
                                <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
                                  AI Processed
                                </span>
                              </div>
                              
                              <div className="text-xs space-y-1">
                                {(doc.type === 'Passport' || (doc.extractedData.type && doc.extractedData.type === 'Passport')) && (
                                  <div className="flex flex-wrap gap-4">
                                    {doc.extractedData.fullName && (
                                      <span><strong>Name:</strong> {doc.extractedData.fullName}</span>
                                    )}
                                    {doc.extractedData.passportNumber && (
                                      <span><strong>Passport:</strong> {doc.extractedData.passportNumber}</span>
                                    )}
                                    {doc.extractedData.nationality && (
                                      <span><strong>Nationality:</strong> {doc.extractedData.nationality}</span>
                                    )}
                                    {doc.extractedData.expiryDate && (
                                      <span><strong>Expires:</strong> {doc.extractedData.expiryDate}</span>
                                    )}
                                  </div>
                                )}

                                {(doc.type === 'Visa' || (doc.extractedData.type && doc.extractedData.type === 'Visa')) && (
                                  <div className="flex flex-wrap gap-4">
                                    {doc.extractedData.fullName && (
                                      <span><strong>Name:</strong> {doc.extractedData.fullName}</span>
                                    )}
                                    {doc.extractedData.idNumber && (
                                      <span><strong>ID:</strong> {doc.extractedData.idNumber}</span>
                                    )}
                                    {doc.extractedData.visaType && (
                                      <span><strong>Type:</strong> {doc.extractedData.visaType}</span>
                                    )}
                                    {doc.extractedData.expiryDate && (
                                      <span><strong>Expires:</strong> {doc.extractedData.expiryDate}</span>
                                    )}
                                  </div>
                                )}

                                {(doc.type === 'OTP Document' || (doc.extractedData.type && doc.extractedData.type === 'OTP')) && (
  <div>
    <div className="flex flex-wrap gap-4 mb-2">
      {(doc.extractedData.investorName || doc.extractedData.investor || doc.extractedData.fullName) && (
        <span><strong>Owner:</strong> {doc.extractedData.investorName || doc.extractedData.investor || doc.extractedData.fullName}</span>
      )}
      {(doc.extractedData.developer || doc.extractedData.project) && (
        <span><strong>Project:</strong> {doc.extractedData.developer || doc.extractedData.project}</span>
      )}
      {(doc.extractedData.unitDetails || doc.extractedData.unitNumber) && (
        <span><strong>Unit:</strong> {doc.extractedData.unitDetails || doc.extractedData.unitNumber}</span>
      )}
    </div>
    <div className="flex flex-wrap gap-4">
      {(doc.extractedData.sqft || doc.extractedData.area) && (
        <span><strong>Area:</strong> {doc.extractedData.sqft || doc.extractedData.area}</span>
      )}
      {(doc.extractedData.amount || doc.extractedData.purchaseAmount) && (
        <span><strong>Price:</strong> ${((doc.extractedData.amount || doc.extractedData.purchaseAmount || 0)).toLocaleString()}</span>
      )}
    </div>
    <div className="mt-2 text-green-600 flex items-center gap-1">
      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
      <span>✓ Property added to portfolio</span>
    </div>
  </div>
)}

                                {(doc.type === 'SOA Document' || (doc.extractedData.type && doc.extractedData.type === 'SOA')) && (
                                  <div>
                                    <div className="flex flex-wrap gap-4">
                                      {(doc.extractedData.unitDetails || doc.extractedData.unitNumber) && (
                                        <span><strong>Unit:</strong> {doc.extractedData.unitDetails || doc.extractedData.unitNumber}</span>
                                      )}
                                      {(doc.extractedData.developer || doc.extractedData.project) && (
                                        <span><strong>Project:</strong> {doc.extractedData.developer || doc.extractedData.project}</span>
                                      )}
                                    </div>
                                    <div className="mt-2 text-orange-600 flex items-center gap-1">
                                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                                      <span>Document organized (no portfolio impact)</span>
                                    </div>
                                  </div>
                                )}

                                {(doc.type === 'Brochure' || doc.type === 'Other') && (
                                  <div className="text-gray-600">
                                    <span>Document stored and ready for viewing</span>
                                  </div>
                                )}

                                {!['Passport', 'Visa', 'OTP Document', 'SOA Document', 'Brochure', 'Other'].includes(doc.type) && 
                                 !(doc.extractedData.type && ['Passport', 'Visa', 'OTP', 'SOA'].includes(doc.extractedData.type)) && (
                                  <div className="flex flex-wrap gap-4">
                                    {Object.entries(doc.extractedData)
                                      .filter(([key]) => !['documentId', 'dateUploaded', 'type'].includes(key))
                                      .slice(0, 4)
                                      .map(([key, value]) => (
                                        <span key={key}>
                                          <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {
                                            typeof value === 'object' ? JSON.stringify(value) : String(value).substring(0, 50) + (String(value).length > 50 ? '...' : '')
                                          }
                                        </span>
                                      ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {doc.status === 'Error' && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                              <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                Processing Error
                              </h4>
                              <p className="text-sm text-red-700">
                                Document uploaded but automatic processing failed. The file has been saved and you can view it manually.
                              </p>
                            </div>
                          )}

                          {doc.status === 'Processing' && (
                            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                                <span className="text-sm text-yellow-800">Processing with AI...</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentsView;