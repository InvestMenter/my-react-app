import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatbotView from './ChatbotView'; 
import DocumentsView from './DocumentsView';
import { Upload, FileText, Home, CreditCard, TrendingUp, Check, Clock, AlertCircle, User } from 'lucide-react';

// TypeScript interfaces
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

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'visa' | 'legal' | 'sales' | 'other';
  deliveryTime: string;
  features: string[];
  popular?: boolean;
}

interface CartItem {
  serviceId: string;
  quantity: number;
  service: Service;
}

interface Order {
  id: string;
  investorId: string;
  items: CartItem[];
  totalAmount: number;
  paymentMethod: 'bank_transfer';
  status: 'pending_payment' | 'payment_submitted' | 'confirmed' | 'processing' | 'completed';
  bankTransferProof?: string;
  createdAt: string;
  notes?: string;
}

// Simple components
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

// FIXED: Removed auto-select behavior that caused cursor issues
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

// API URLs
const POSSIBLE_API_URLS = [
  'https://cautious-eureka-4jgxv577gr9qh7j5j-3001.app.github.dev/api',
  'http://localhost:3001/api'
];

let workingApiUrl: string | null = null;

const findWorkingApiUrl = async (): Promise<string> => {
  if (workingApiUrl) return workingApiUrl;
  
  for (const url of POSSIBLE_API_URLS) {
    try {
      const response = await fetch(url.replace('/api', ''), {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      if (response.ok) {
        workingApiUrl = url;
        return url;
      }
    } catch (error: any) {
      continue;
    }
  }
  throw new Error('No working API server found');
};

const makeAPIRequest = async (endpoint: string, data: Record<string, any> = {}): Promise<any> => {
  try {
    const apiUrl = await findWorkingApiUrl();
    
    const response = await fetch(`${apiUrl}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Request failed');
    }
    
    return result.data;
  } catch (error: any) {
    console.error('API Error:', error);
    return handleLocalFallback(endpoint, data);
  }
};

const handleLocalFallback = (endpoint: string, data: Record<string, any>): any => {
  console.log('Using local fallback for:', endpoint);
  
  switch (endpoint) {
    case 'createInvestor':
      return { id: Date.now().toString(), ...data.data };
    case 'findInvestorByEmail':
      if (data.email === 'investor1@test.com') {
        return {
          id: 'test-investor-1',
          name: 'Test Investor',
          email: 'investor1@test.com',
          phone: '+1234567890',
          nationality: 'UAE',
          birthDate: '1990-01-01',
          password: 'test123'
        };
      }
      return null;
   case 'createDocument':
    case 'createDocumentWithCategory': // Also add the new document endpoint
    case 'createUnit':
    case 'createUnitWithForceFolder':  // Add this line
    case 'getInvestorData':
      return { id: Date.now().toString(), units: [], documents: [], payments: [] };
    default:
      throw new Error(`Unknown endpoint: ${endpoint}`);
  }
};

// Data type interfaces
interface Investor {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationality?: string;
  birthDate?: string;
  password?: string;
  createdAt?: string;
}

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

interface Payment {
  id: string;
  unitId: string;
  investorId: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  installmentNumber: number;
  totalInstallments: number;
  proofOfPayment?: string;
  paymentDate?: string;
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
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  nationality: string;
  birthDate: string;
  password: string;
  confirmPassword: string;
}

const InvestorPortal: React.FC = () => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentInvestor, setCurrentInvestor] = useState<Investor | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');

  // App state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [units, setUnits] = useState<Unit[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [uploadingDocument, setUploadingDocument] = useState<boolean>(false);
  const [documentType, setDocumentType] = useState<string>('OTP Document');
  const [documentCategory, setDocumentCategory] = useState<string>('Personal Documents');
  const [selectedUnitForDoc, setSelectedUnitForDoc] = useState<string>('');
  const [showAddUnitForm, setShowAddUnitForm] = useState<boolean>(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['Personal Documents']));
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
 
  // Chatbot state
  const [chatMessages, setChatMessages] = useState<Array<{id: string, text: string, isUser: boolean, timestamp: Date}>>([
    {
      id: '1',
      text: "Hello! I'm your Dubai Real Estate AI Assistant. I can help you with questions about Dubai property market, investment opportunities, regulations, and trends. What would you like to know?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const chatInputRef = useRef<HTMLInputElement>(null);

const [cart, setCart] = useState<CartItem[]>([]);
const [orders, setOrders] = useState<Order[]>([]);
const [showCart, setShowCart] = useState<boolean>(false);
const getCartItemCount = () => {
  return cart.reduce((total, item) => total + item.quantity, 0);
};
  
  const [newUnitForm, setNewUnitForm] = useState<{
    name: string;
    unitNumber: string;
    project: string;
    type: string;
    area: string;
  }>({
    name: '',
    unitNumber: '',
    project: '',
    type: '',
    area: ''
  });

  const AVAILABLE_SERVICES: Service[] = [
  {
    id: 'golden-visa',
    name: 'Dubai Golden Visa Assistance',
    description: 'Complete assistance with Dubai Golden Visa application for property investors. Includes document preparation, application submission, and follow-up.',
    price: 5000,
    category: 'visa',
    deliveryTime: '4-6 weeks',
    features: [
      'Full document review and preparation',
      'Application submission to ICA',
      'Follow-up and status tracking',
      'Medical test coordination',
      'Emirates ID assistance',
      'Dedicated case manager'
    ],
    popular: true
  },
  {
    id: 'last-will',
    name: 'Last Will & Testament',
    description: 'Professional drafting of your Last Will and Testament in accordance with UAE law.',
    price: 500,
    category: 'legal',
    deliveryTime: '1-2 weeks',
    features: [
      'Consultation with legal expert',
      'Will drafting by certified lawyer',
      'DIFC Wills registration option',
      'Asset distribution planning',
      'Executor appointment guidance'
    ]
  },
  {
    id: 'poa',
    name: 'Power of Attorney (POA)',
    description: 'Comprehensive Power of Attorney document preparation and notarization.',
    price: 300,
    category: 'legal',
    deliveryTime: '3-5 business days',
    features: [
      'POA document drafting',
      'Notary public services',
      'Translation if needed',
      'Legal consultation',
      'Ministry attestation coordination'
    ]
  },
  {
    id: 'sales-progression',
    name: 'Sales Progression Service',
    description: 'End-to-end property sales management service from listing to closing.',
    price: 0,
    category: 'sales',
    deliveryTime: 'Varies by property',
    features: [
      'Professional property valuation',
      'Marketing and listing',
      'Buyer screening and viewings',
      'Negotiation assistance',
      'Transaction management',
      'Commission: 2% of sale price'
    ]
  }
];

  // FIXED: Portfolio calculations - only count OTP-created units, exclude SOA units
  const otpUnits = units.filter(unit => unit.purchaseValue > 0);
  const totalPortfolioValue = otpUnits.reduce((sum, unit) => sum + unit.currentValue, 0);
  const totalMonthlyRental = units.reduce((sum, unit) => sum + unit.monthlyRental, 0);
  const totalGains = otpUnits.reduce((sum, unit) => sum + (unit.currentValue - unit.purchaseValue), 0);

  useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (showProfileMenu && !target.closest('.relative')) {
      setShowProfileMenu(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [showProfileMenu]);


  const toggleFolder = (folderName: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderName)) {
        newSet.delete(folderName);
      } else {
        newSet.add(folderName);
      }
      return newSet;
    });
  };

  // Load data when authenticated
  const loadInvestorData = useCallback(async () => {
    if (!currentInvestor) return;
    
    try {
      const data = await makeAPIRequest('getInvestorData', { investorId: currentInvestor.id });
      setUnits(data.units || []);
      setDocuments(data.documents || []);
      setPayments(data.payments || []);
    } catch (error) {
      console.error('Failed to load investor data:', error);
      if (currentInvestor.email === 'investor1@test.com') {
        setUnits([
          {
            id: '1',
            investorId: currentInvestor.id,
            name: 'Apartment 2A',
            unitNumber: 'A-201',
            project: 'Marina Heights',
            type: '2 Bedroom',
            area: '1200',
            currentValue: 285000,
            purchaseValue: 250000,
            monthlyRental: 2800,
            occupancyStatus: 'Occupied',
            location: 'Downtown District'
          }
        ]);
        setPayments([
          {
            id: '1',
            unitId: '1',
            investorId: currentInvestor.id,
            amount: 12500,
            dueDate: '2024-02-15',
            status: 'Paid',
            installmentNumber: 1,
            totalInstallments: 20,
            paymentDate: '2024-02-10'
          }
        ]);
      }
    }
  }, [currentInvestor]);

  useEffect(() => {
    if (currentInvestor) {
      loadInvestorData();
    }
  }, [currentInvestor, loadInvestorData]);

 // InvestMenter Logo Component (Updated to match actual logo)
const InvestMenterLogo = ({ size = 'large' }: { size?: 'small' | 'medium' | 'large' }) => {
  const scaleFactors = {
    small: 0.6,
    medium: 0.8, 
    large: 1.0
  };
  
  const scale = scaleFactors[size];
  
  return (
    <div className="flex items-center justify-center">
      <img 
        src="/CY5ov6r-removebg-preview.png"  // Changed from .svg to .jpeg
        alt="InvestMenter Logo"
        width={500 * scale}
        height={300* scale}
        className="mx-auto"
      />
    </div>
  );
};
  // Auth form component
  const AuthForm: React.FC = () => {
    const [formData, setFormData] = useState<FormData>({
      name: '',
      email: '',
      phone: '',
      nationality: '',
      birthDate: '',
      password: '',
      confirmPassword: ''
    });

    const handleInputChange = (field: keyof FormData, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleLogin = async () => {
      setAuthLoading(true);
      setAuthError('');
      
      try {
        const investor = await makeAPIRequest('findInvestorByEmail', { email: formData.email });
        
        if (investor && investor.password === formData.password) {
          setCurrentInvestor(investor);
          setIsAuthenticated(true);
        } else {
          setAuthError('Invalid email or password');
        }
      } catch (error) {
        setAuthError('Login failed. Please try again.');
      }
      
      setAuthLoading(false);
    };

    const handleSignup = async () => {
      if (formData.password !== formData.confirmPassword) {
        setAuthError('Passwords do not match');
        return;
      }
      
      if (!formData.name || !formData.email || !formData.phone || !formData.nationality || !formData.birthDate || !formData.password) {
        setAuthError('Please fill in all fields');
        return;
      }

      setAuthLoading(true);
      setAuthError('');
      
      try {
        const newInvestor: Investor = {
          id: Date.now().toString(),
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          nationality: formData.nationality,
          birthDate: formData.birthDate,
          password: formData.password
        };

        await makeAPIRequest('createInvestor', { data: newInvestor });
        setCurrentInvestor(newInvestor);
        setIsAuthenticated(true);
      } catch (error: any) {
        setAuthError('Signup failed. Please try again.');
      }
      
      setAuthLoading(false);
    };

    const handleUAEPassAuth = async () => {
      setAuthLoading(true);
      setAuthError('');
      
      try {
        // Mock UAE Pass authentication
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const uaePassUser: Investor = {
          id: 'uaepass_' + Date.now().toString(),
          name: 'Ahmed Al Mansouri',
          email: 'ahmed.almansouri@emirates.ae',
          phone: '+971501234567',
          nationality: 'UAE',
          birthDate: '1985-03-15',
          password: ''
        };

        await makeAPIRequest('createInvestor', { data: uaePassUser });
        setCurrentInvestor(uaePassUser);
        setIsAuthenticated(true);
      } catch (error: any) {
        setAuthError('UAE Pass authentication failed. Please try again.');
      }
      
      setAuthLoading(false);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-8">
        <div className="max-w-lg">
          {/* Logo */}
          <div className="mb-8">
            <InvestMenterLogo size="large" />
          </div>
          
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-3" style={{fontFamily: 'Montserrat, sans-serif'}}>
              {authMode === 'login' ? 'Welcome Back' : 'Join InvestMenter'}
            </h1>
            <p className="text-gray-600 text-lg" style={{fontFamily: 'Montserrat, sans-serif'}}>
              {authMode === 'login' 
                ? 'Access your premium investment portfolio' 
                : 'Create your premium investor account'
              }
            </p>
          </div>
  
          
          <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
            {authMode === 'signup' && (
              <div>
                <Label htmlFor="name" className="text-gray-700 text-sm mb-1">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            
            {authMode === 'signup' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nationality" className="text-gray-700 text-sm mb-1">Nationality</Label>
                  <Select value={formData.nationality} onValueChange={(value) => handleInputChange('nationality', value)}>
                    <SelectItem value="">Select nationality</SelectItem>
                    <SelectItem value="Afghanistan">Afghanistan</SelectItem>
<SelectItem value="Albania">Albania</SelectItem>
<SelectItem value="Algeria">Algeria</SelectItem>
<SelectItem value="Andorra">Andorra</SelectItem>
<SelectItem value="Angola">Angola</SelectItem>
<SelectItem value="Antigua and Barbuda">Antigua and Barbuda</SelectItem>
<SelectItem value="Argentina">Argentina</SelectItem>
<SelectItem value="Armenia">Armenia</SelectItem>
<SelectItem value="Australia">Australia</SelectItem>
<SelectItem value="Austria">Austria</SelectItem>
<SelectItem value="Azerbaijan">Azerbaijan</SelectItem>
<SelectItem value="Bahamas">Bahamas</SelectItem>
<SelectItem value="Bahrain">Bahrain</SelectItem>
<SelectItem value="Bangladesh">Bangladesh</SelectItem>
<SelectItem value="Barbados">Barbados</SelectItem>
<SelectItem value="Belarus">Belarus</SelectItem>
<SelectItem value="Belgium">Belgium</SelectItem>
<SelectItem value="Belize">Belize</SelectItem>
<SelectItem value="Benin">Benin</SelectItem>
<SelectItem value="Bhutan">Bhutan</SelectItem>
<SelectItem value="Bolivia">Bolivia</SelectItem>
<SelectItem value="Bosnia and Herzegovina">Bosnia and Herzegovina</SelectItem>
<SelectItem value="Botswana">Botswana</SelectItem>
<SelectItem value="Brazil">Brazil</SelectItem>
<SelectItem value="Brunei">Brunei</SelectItem>
<SelectItem value="Bulgaria">Bulgaria</SelectItem>
<SelectItem value="Burkina Faso">Burkina Faso</SelectItem>
<SelectItem value="Burundi">Burundi</SelectItem>
<SelectItem value="Cabo Verde">Cabo Verde</SelectItem>
<SelectItem value="Cambodia">Cambodia</SelectItem>
<SelectItem value="Cameroon">Cameroon</SelectItem>
<SelectItem value="Canada">Canada</SelectItem>
<SelectItem value="Central African Republic">Central African Republic</SelectItem>
<SelectItem value="Chad">Chad</SelectItem>
<SelectItem value="Chile">Chile</SelectItem>
<SelectItem value="China">China</SelectItem>
<SelectItem value="Colombia">Colombia</SelectItem>
<SelectItem value="Comoros">Comoros</SelectItem>
<SelectItem value="Congo">Congo</SelectItem>
<SelectItem value="Costa Rica">Costa Rica</SelectItem>
<SelectItem value="Croatia">Croatia</SelectItem>
<SelectItem value="Cuba">Cuba</SelectItem>
<SelectItem value="Cyprus">Cyprus</SelectItem>
<SelectItem value="Czech Republic">Czech Republic</SelectItem>
<SelectItem value="Democratic Republic of the Congo">Democratic Republic of the Congo</SelectItem>
<SelectItem value="Denmark">Denmark</SelectItem>
<SelectItem value="Djibouti">Djibouti</SelectItem>
<SelectItem value="Dominica">Dominica</SelectItem>
<SelectItem value="Dominican Republic">Dominican Republic</SelectItem>
<SelectItem value="Ecuador">Ecuador</SelectItem>
<SelectItem value="Egypt">Egypt</SelectItem>
<SelectItem value="El Salvador">El Salvador</SelectItem>
<SelectItem value="Equatorial Guinea">Equatorial Guinea</SelectItem>
<SelectItem value="Eritrea">Eritrea</SelectItem>
<SelectItem value="Estonia">Estonia</SelectItem>
<SelectItem value="Eswatini">Eswatini</SelectItem>
<SelectItem value="Ethiopia">Ethiopia</SelectItem>
<SelectItem value="Fiji">Fiji</SelectItem>
<SelectItem value="Finland">Finland</SelectItem>
<SelectItem value="France">France</SelectItem>
<SelectItem value="Gabon">Gabon</SelectItem>
<SelectItem value="Gambia">Gambia</SelectItem>
<SelectItem value="Georgia">Georgia</SelectItem>
<SelectItem value="Germany">Germany</SelectItem>
<SelectItem value="Ghana">Ghana</SelectItem>
<SelectItem value="Greece">Greece</SelectItem>
<SelectItem value="Grenada">Grenada</SelectItem>
<SelectItem value="Guatemala">Guatemala</SelectItem>
<SelectItem value="Guinea">Guinea</SelectItem>
<SelectItem value="Guinea-Bissau">Guinea-Bissau</SelectItem>
<SelectItem value="Guyana">Guyana</SelectItem>
<SelectItem value="Haiti">Haiti</SelectItem>
<SelectItem value="Honduras">Honduras</SelectItem>
<SelectItem value="Hungary">Hungary</SelectItem>
<SelectItem value="Iceland">Iceland</SelectItem>
<SelectItem value="India">India</SelectItem>
<SelectItem value="Indonesia">Indonesia</SelectItem>
<SelectItem value="Iran">Iran</SelectItem>
<SelectItem value="Iraq">Iraq</SelectItem>
<SelectItem value="Ireland">Ireland</SelectItem>
<SelectItem value="Israel">Israel</SelectItem>
<SelectItem value="Italy">Italy</SelectItem>
<SelectItem value="Ivory Coast">Ivory Coast</SelectItem>
<SelectItem value="Jamaica">Jamaica</SelectItem>
<SelectItem value="Japan">Japan</SelectItem>
<SelectItem value="Jordan">Jordan</SelectItem>
<SelectItem value="Kazakhstan">Kazakhstan</SelectItem>
<SelectItem value="Kenya">Kenya</SelectItem>
<SelectItem value="Kiribati">Kiribati</SelectItem>
<SelectItem value="Kuwait">Kuwait</SelectItem>
<SelectItem value="Kyrgyzstan">Kyrgyzstan</SelectItem>
<SelectItem value="Laos">Laos</SelectItem>
<SelectItem value="Latvia">Latvia</SelectItem>
<SelectItem value="Lebanon">Lebanon</SelectItem>
<SelectItem value="Lesotho">Lesotho</SelectItem>
<SelectItem value="Liberia">Liberia</SelectItem>
<SelectItem value="Libya">Libya</SelectItem>
<SelectItem value="Liechtenstein">Liechtenstein</SelectItem>
<SelectItem value="Lithuania">Lithuania</SelectItem>
<SelectItem value="Luxembourg">Luxembourg</SelectItem>
<SelectItem value="Madagascar">Madagascar</SelectItem>
<SelectItem value="Malawi">Malawi</SelectItem>
<SelectItem value="Malaysia">Malaysia</SelectItem>
<SelectItem value="Maldives">Maldives</SelectItem>
<SelectItem value="Mali">Mali</SelectItem>
<SelectItem value="Malta">Malta</SelectItem>
<SelectItem value="Marshall Islands">Marshall Islands</SelectItem>
<SelectItem value="Mauritania">Mauritania</SelectItem>
<SelectItem value="Mauritius">Mauritius</SelectItem>
<SelectItem value="Mexico">Mexico</SelectItem>
<SelectItem value="Micronesia">Micronesia</SelectItem>
<SelectItem value="Moldova">Moldova</SelectItem>
<SelectItem value="Monaco">Monaco</SelectItem>
<SelectItem value="Mongolia">Mongolia</SelectItem>
<SelectItem value="Montenegro">Montenegro</SelectItem>
<SelectItem value="Morocco">Morocco</SelectItem>
<SelectItem value="Mozambique">Mozambique</SelectItem>
<SelectItem value="Myanmar">Myanmar</SelectItem>
<SelectItem value="Namibia">Namibia</SelectItem>
<SelectItem value="Nauru">Nauru</SelectItem>
<SelectItem value="Nepal">Nepal</SelectItem>
<SelectItem value="Netherlands">Netherlands</SelectItem>
<SelectItem value="New Zealand">New Zealand</SelectItem>
<SelectItem value="Nicaragua">Nicaragua</SelectItem>
<SelectItem value="Niger">Niger</SelectItem>
<SelectItem value="Nigeria">Nigeria</SelectItem>
<SelectItem value="North Korea">North Korea</SelectItem>
<SelectItem value="North Macedonia">North Macedonia</SelectItem>
<SelectItem value="Norway">Norway</SelectItem>
<SelectItem value="Oman">Oman</SelectItem>
<SelectItem value="Pakistan">Pakistan</SelectItem>
<SelectItem value="Palau">Palau</SelectItem>
<SelectItem value="Palestine">Palestine</SelectItem>
<SelectItem value="Panama">Panama</SelectItem>
<SelectItem value="Papua New Guinea">Papua New Guinea</SelectItem>
<SelectItem value="Paraguay">Paraguay</SelectItem>
<SelectItem value="Peru">Peru</SelectItem>
<SelectItem value="Philippines">Philippines</SelectItem>
<SelectItem value="Poland">Poland</SelectItem>
<SelectItem value="Portugal">Portugal</SelectItem>
<SelectItem value="Qatar">Qatar</SelectItem>
<SelectItem value="Romania">Romania</SelectItem>
<SelectItem value="Russia">Russia</SelectItem>
<SelectItem value="Rwanda">Rwanda</SelectItem>
<SelectItem value="Saint Kitts and Nevis">Saint Kitts and Nevis</SelectItem>
<SelectItem value="Saint Lucia">Saint Lucia</SelectItem>
<SelectItem value="Saint Vincent and the Grenadines">Saint Vincent and the Grenadines</SelectItem>
<SelectItem value="Samoa">Samoa</SelectItem>
<SelectItem value="San Marino">San Marino</SelectItem>
<SelectItem value="Sao Tome and Principe">Sao Tome and Principe</SelectItem>
<SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
<SelectItem value="Senegal">Senegal</SelectItem>
<SelectItem value="Serbia">Serbia</SelectItem>
<SelectItem value="Seychelles">Seychelles</SelectItem>
<SelectItem value="Sierra Leone">Sierra Leone</SelectItem>
<SelectItem value="Singapore">Singapore</SelectItem>
<SelectItem value="Slovakia">Slovakia</SelectItem>
<SelectItem value="Slovenia">Slovenia</SelectItem>
<SelectItem value="Solomon Islands">Solomon Islands</SelectItem>
<SelectItem value="Somalia">Somalia</SelectItem>
<SelectItem value="South Africa">South Africa</SelectItem>
<SelectItem value="South Korea">South Korea</SelectItem>
<SelectItem value="South Sudan">South Sudan</SelectItem>
<SelectItem value="Spain">Spain</SelectItem>
<SelectItem value="Sri Lanka">Sri Lanka</SelectItem>
<SelectItem value="Sudan">Sudan</SelectItem>
<SelectItem value="Suriname">Suriname</SelectItem>
<SelectItem value="Sweden">Sweden</SelectItem>
<SelectItem value="Switzerland">Switzerland</SelectItem>
<SelectItem value="Syria">Syria</SelectItem>
<SelectItem value="Taiwan">Taiwan</SelectItem>
<SelectItem value="Tajikistan">Tajikistan</SelectItem>
<SelectItem value="Tanzania">Tanzania</SelectItem>
<SelectItem value="Thailand">Thailand</SelectItem>
<SelectItem value="Timor-Leste">Timor-Leste</SelectItem>
<SelectItem value="Togo">Togo</SelectItem>
<SelectItem value="Tonga">Tonga</SelectItem>
<SelectItem value="Trinidad and Tobago">Trinidad and Tobago</SelectItem>
<SelectItem value="Tunisia">Tunisia</SelectItem>
<SelectItem value="Turkey">Turkey</SelectItem>
<SelectItem value="Turkmenistan">Turkmenistan</SelectItem>
<SelectItem value="Tuvalu">Tuvalu</SelectItem>
<SelectItem value="Uganda">Uganda</SelectItem>
<SelectItem value="Ukraine">Ukraine</SelectItem>
<SelectItem value="United Arab Emirates">United Arab Emirates</SelectItem>
<SelectItem value="United Kingdom">United Kingdom</SelectItem>
<SelectItem value="United States">United States</SelectItem>
<SelectItem value="Uruguay">Uruguay</SelectItem>
<SelectItem value="Uzbekistan">Uzbekistan</SelectItem>
<SelectItem value="Vanuatu">Vanuatu</SelectItem>
<SelectItem value="Vatican City">Vatican City</SelectItem>
<SelectItem value="Venezuela">Venezuela</SelectItem>
<SelectItem value="Vietnam">Vietnam</SelectItem>
<SelectItem value="Yemen">Yemen</SelectItem>
<SelectItem value="Zambia">Zambia</SelectItem>
<SelectItem value="Zimbabwe">Zimbabwe</SelectItem>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="birthDate" className="text-gray-700 text-sm mb-1">Date of Birth</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="email" className="text-gray-700 text-sm mb-1">
                {authMode === 'login' ? 'Username' : 'Email Address'}
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder={authMode === 'login' ? 'investor1@test.com' : 'Enter your email'}
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {authMode === 'signup' && (
              <div>
                <Label htmlFor="phone" className="text-gray-700 text-sm mb-1">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="password" className="text-gray-700 text-sm mb-1">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="••••••••••••"
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {authMode === 'signup' && (
              <div>
                <Label htmlFor="confirmPassword" className="text-gray-700 text-sm mb-1">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            
            {authError && (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 p-3 rounded">
                {authError}
              </div>
            )}
            
            <Button 
              onClick={authMode === 'login' ? handleLogin : handleSignup}
              disabled={authLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded transition-colors"
            >
              {authLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Please wait...
                </div>
              ) : (
                authMode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>

            <Button 
              onClick={handleUAEPassAuth}
  disabled={authLoading}
  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded transition-colors flex items-center justify-center gap-3"
>
  <div className="flex items-center gap-2">
    <span className="text-sm font-medium">Continue with</span>
    <div className="bg-white text-blue-600 px-2 py-1 rounded text-xs font-bold">
      UAE PASS
    </div>
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  </div>
            </Button>

            <div className="text-center pt-4">
              <button
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'signup' : 'login');
                  setAuthError('');
                  setFormData({ name: '', email: '', phone: '', nationality: '', birthDate: '', password: '', confirmPassword: '' });
                }}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {authMode === 'login' 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </button>
            </div>
            
          </div>
        </div>
      </div>
    );
  };

  // File handling
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const processDocument = async (file: File, type: string, category?: string, unitId?: string) => {
  setUploadingDocument(true);
  
  try {
    const base64File = await fileToBase64(file);
    
    // FIXED: Map frontend category to backend expected format
    let backendCategory = category || 'Personal Documents';
    if (category === 'Units') {
      backendCategory = 'Unit Documents';
    }
    
    const documentData = {
      id: Date.now().toString(),
      investorId: currentInvestor!.id,
      name: file.name,
      type: type,
      category: backendCategory,  // ← Use mapped category
      unitId: unitId || null,
      fileData: base64File,
      fileSize: file.size,
      fileType: file.type
    };

    const backendResponse = await makeAPIRequest('createDocumentWithCategory', { data: documentData });
      
      const processedDocument: Document = {
        id: backendResponse.id || documentData.id,
        investorId: documentData.investorId,
        name: backendResponse.fileName || documentData.name,
        type: backendResponse.documentType || documentData.type,
        category: documentData.category,
        unitId: documentData.unitId,
        uploadDate: backendResponse.uploadDate || new Date().toISOString(),
        status: backendResponse.status || 'Processed',
        extractedData: backendResponse.extractedInfo || backendResponse.extractedData,
        fileUrl: backendResponse.fileUrl,
        fileData: base64File,
        fileSize: documentData.fileSize,
        fileType: documentData.fileType
      };

      setDocuments(prev => [...prev.filter(doc => doc.id !== documentData.id), processedDocument]);

      // Auto-create unit from OTP documents only
      if ((type === 'OTP Document' || processedDocument.extractedData?.type === 'OTP') && 
          processedDocument.extractedData && category === 'Units') {
        const otpData = processedDocument.extractedData;
        
        const newUnit: Unit = {
          id: Date.now().toString() + '_unit',
          investorId: currentInvestor!.id,
          name: otpData.unitDetails || otpData.unitNumber || `Unit from ${file.name}`,
          unitNumber: otpData.unitNumber || 'N/A',
          project: otpData.developer || otpData.project || 'Unknown Project',
          type: otpData.unitType || '2 Bedroom',
          area: otpData.area || '0',
          currentValue: otpData.amount || otpData.purchaseAmount || 0,
          purchaseValue: otpData.amount || otpData.purchaseAmount || 0,
          monthlyRental: otpData.estimatedRental || Math.round((otpData.amount || 0) * 0.05 / 12),
          occupancyStatus: 'Vacant',
          location: otpData.location || 'Dubai, UAE'
        };
        
        setUnits(prev => {
          const existingUnit = prev.find(unit => unit.unitNumber === newUnit.unitNumber && unit.project === newUnit.project);
          if (existingUnit) {
            return prev.map(unit => unit.id === existingUnit.id ? { ...newUnit, id: existingUnit.id } : unit);
          }
          return [...prev, newUnit];
        });
        
        await makeAPIRequest('createUnitWithForceFolder', { data: newUnit });
      }

      // FIXED: For SOA documents, try to match with existing units but don't create portfolio units
      if (category === 'Units' && type === 'SOA Document' && processedDocument.extractedData) {
        const soaData = processedDocument.extractedData;
        
        const matchingUnit = units.find(unit => 
          soaData.unitNumber && unit.unitNumber === soaData.unitNumber ||
          soaData.unitDetails && unit.name.includes(soaData.unitDetails) ||
          soaData.project && unit.project === soaData.project
        );
        
        if (matchingUnit) {
          processedDocument.unitId = matchingUnit.id;
          setDocuments(prev => 
            prev.map(doc => doc.id === processedDocument.id ? 
              { ...doc, unitId: matchingUnit.id } : doc
            )
          );
        } else if (soaData.unitNumber || soaData.unitDetails) {
          const soaUnit: Unit = {
            id: Date.now().toString() + '_soa_unit',
            investorId: currentInvestor!.id,
            name: soaData.unitDetails || soaData.unitNumber || `SOA Unit from ${file.name}`,
            unitNumber: soaData.unitNumber || 'N/A',
            project: soaData.project || 'Unknown Project',
            type: 'Unknown',
            area: '0',
            currentValue: 0,
            purchaseValue: 0,
            monthlyRental: 0,
            occupancyStatus: 'Vacant',
            location: 'Dubai, UAE'
          };
          
          setUnits(prev => [...prev, soaUnit]);
          processedDocument.unitId = soaUnit.id;
          await makeAPIRequest('createUnitWithForceFolder', { data: soaUnit });
        }
      }

    } catch (error: any) {
      console.error('Document processing failed:', error);
      
      const errorDocument: Document = {
        id: Date.now().toString(),
        investorId: currentInvestor!.id,
        name: file.name,
        type: type,
        category: category || 'Personal Documents',
        unitId: unitId || null,
        uploadDate: new Date().toISOString(),
        status: 'Error',
        fileData: await fileToBase64(file),
        extractedData: null
      };
      
      setDocuments(prev => [...prev, errorDocument]);
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (documentCategory === 'Units' && !selectedUnitForDoc) {
      alert('Please select a unit or add a new unit first');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Please select a file smaller than 5MB.');
      return;
    }
    
    await processDocument(file, documentType, documentCategory, selectedUnitForDoc);
  };

  const handlePaymentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedUnit && paymentAmount && paymentDate) {
      await processDocument(file, 'Payment Proof');
      setSelectedUnit('');
      setPaymentAmount('');
      setPaymentDate('');
    }
  };

  const createNewUnit = async () => {
    if (!newUnitForm.name || !newUnitForm.unitNumber || !newUnitForm.project) {
      alert('Please fill in required fields: Name, Unit Number, and Project');
      return;
    }

  const newUnit: Unit = {
    id: Date.now().toString(),
    investorId: currentInvestor!.id,
    name: newUnitForm.name,
    unitNumber: newUnitForm.unitNumber,
    project: newUnitForm.project,
    type: newUnitForm.type || 'Studio',
    area: newUnitForm.area || '0',
    currentValue: 0,
    purchaseValue: 0,
    monthlyRental: 0,
    occupancyStatus: 'Vacant',
    location: 'Dubai, UAE'
  };
 const backendUnit = await makeAPIRequest('createUnitWithForceFolder', { data: newUnit });
   if (backendUnit) {
    setUnits(prev => [...prev, backendUnit]);  // ← Use the backend unit, not the local one
  } else {
    setUnits(prev => [...prev, newUnit]);  // Fallback to local unit if backend fails
  }

    setNewUnitForm({ name: '', unitNumber: '', project: '', type: '', area: '' });
    setShowAddUnitForm(false);
    alert('Unit added successfully!');
  };

  // Chatbot functionality
// Enhanced chatbot functionality for the investor portal

const sendChatMessage = async (message: string) => {
  if (!message.trim()) return;
  
  const userMessage = {
    id: Date.now().toString(),
    text: message,
    isUser: true,
    timestamp: new Date()
  };
  
  setChatMessages(prev => [...prev, userMessage]);
  setChatInput('');
  setIsChatLoading(true);

  try {
    const response = await fetch('https://oi-server.onrender.com/chat/completions', {
      method: 'POST',
      headers: {
        'customerId': 'cus_T15kylWmcJnU0J',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer xxx'
      },
      body: JSON.stringify({
        model: 'openrouter/claude-sonnet-4',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant for an investor portal focused on Dubai real estate investments. You have expertise in:

            PRIMARY EXPERTISE (prioritize these topics):
            - Dubai property market trends and analysis
            - Investment opportunities in different Dubai areas
            - Legal requirements for property investment in Dubai
            - Visa and residency benefits through property investment
            - Popular residential areas and their characteristics
            - Commercial real estate opportunities
            - Market predictions and expert insights
            - Property types (apartments, villas, townhouses)
            - Developer information and project updates
            - Rental yields and ROI calculations
            - Off-plan vs ready properties
            - RERA regulations and compliance

            GENERAL ASSISTANCE:
            You can also help with general questions about:
            - Financial planning and investment strategies
            - Portfolio management and diversification
            - Economic trends affecting investments
            - General real estate concepts
            - Technology and business questions
            - Personal finance management
            - Tax considerations for investors

            CONTEXT AWARENESS:
            - User is currently in their investor portal managing Dubai properties
            - They may have multiple properties, documents, and payment schedules
            - Provide practical, actionable advice
            - When discussing Dubai real estate, be specific and current
            - For general questions, provide helpful answers while connecting back to their investment goals when relevant

            Keep responses conversational, informative, and appropriately detailed. Always aim to be helpful whether the question is about Dubai real estate specifically or general topics that might benefit an investor.`
          },
          {
            role: 'user',
            content: message
          }
        ]
      })
    });

    if (response.ok) {
      const result = await response.json();
      const aiResponse = result.choices?.[0]?.message?.content || 'Sorry, I could not process your request.';
      
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, botMessage]);
    } else {
      throw new Error('Failed to get AI response');
    }
  } catch (error) {
    console.error('Chat error:', error);
    
    // Enhanced fallback responses
    let fallbackResponse = determineAppropriateFallback(message);
    
    const errorMessage = {
      id: (Date.now() + 1).toString(),
      text: fallbackResponse,
      isUser: false,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, errorMessage]);
  } finally {
    setIsChatLoading(false);
  }
};

// Enhanced fallback system
const determineAppropriateFallback = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  // Dubai real estate fallbacks
  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('value')) {
    return "Dubai property prices vary significantly by area and property type. Prime locations like Downtown Dubai and Dubai Marina typically command higher prices, while emerging areas offer better value. For current market prices, I recommend checking with local real estate agents or recent sales data. Would you like information about a specific area or property type?";
  }
  
  if (lowerMessage.includes('visa') || lowerMessage.includes('residency') || lowerMessage.includes('golden visa')) {
    return "Dubai offers several visa options through property investment, including the Golden Visa for investments over AED 2 million. Property investments can also qualify for renewable residence visas. The specific requirements depend on the investment amount and property type. Would you like more details about investor visa requirements?";
  }
  
  if (lowerMessage.includes('area') || lowerMessage.includes('location') || lowerMessage.includes('neighborhood')) {
    return "Popular investment areas in Dubai include Downtown Dubai, Dubai Marina, Jumeirah Lake Towers (JLT), Business Bay, Dubai Hills Estate, and emerging areas like Dubai South and Mohammed Bin Rashid City (MBR City). Each offers different advantages for investors in terms of rental yields, capital appreciation, and lifestyle amenities.";
  }
  
  if (lowerMessage.includes('rental') || lowerMessage.includes('yield') || lowerMessage.includes('roi')) {
    return "Rental yields in Dubai typically range from 4-8% annually, depending on location and property type. Areas like Dubai South and International City often offer higher yields, while prime areas like Downtown offer lower yields but better capital appreciation potential. Your current portfolio shows properties that can help track actual performance.";
  }
  
  // General investment fallbacks
  if (lowerMessage.includes('investment') || lowerMessage.includes('portfolio') || lowerMessage.includes('diversif')) {
    return "Investment diversification is crucial for managing risk. While Dubai real estate can be a strong component of your portfolio, consider spreading investments across different asset classes, geographic locations, and property types. Your current Dubai properties are a good foundation - have you considered other markets or investment vehicles?";
  }
  
  if (lowerMessage.includes('tax') || lowerMessage.includes('finance')) {
    return "Tax implications vary greatly depending on your residency and citizenship. Dubai has no personal income tax, but your home country may have tax obligations on foreign property income and capital gains. I recommend consulting with a tax professional familiar with international property investments for personalized advice.";
  }
  
  // General helpful fallback
  return "I'm currently experiencing technical difficulties, but I'm here to help with both Dubai real estate questions and general investment advice. Some popular topics I can assist with include:\n\n• Dubai property market analysis and trends\n• Investment strategies and portfolio management\n• Visa and residency options through property investment\n• Financial planning for real estate investors\n• General business and economic questions\n\nWhat specific area would you like to discuss?";
};

// Optional: Add context-aware suggestions based on user's portfolio
const getPersonalizedSuggestions = (units: Unit[], documents: Document[]) => {
  const suggestions = [];
  
  if (units.length === 0) {
    suggestions.push("Ask about: 'What areas in Dubai are best for first-time investors?'");
  }
  
  if (units.some(unit => unit.occupancyStatus === 'Vacant')) {
    suggestions.push("Ask about: 'How can I improve occupancy rates for my Dubai properties?'");
  }
  
  if (units.length > 0) {
    const totalValue = units.reduce((sum, unit) => sum + unit.currentValue, 0);
    if (totalValue > 500000) {
      suggestions.push("Ask about: 'Dubai Golden Visa requirements for property investors'");
    }
  }
  
  return suggestions;
};

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() && !isChatLoading) {
      sendChatMessage(chatInput);
    }
  };

  const ProfileView = () => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [profileForm, setProfileForm] = useState({
    name: currentInvestor?.name || '',
    email: currentInvestor?.email || '',
    phone: currentInvestor?.phone || '',
    nationality: currentInvestor?.nationality || '',
    birthDate: currentInvestor?.birthDate || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileUpdate = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileForm.email)) {
        setMessage({ type: 'error', text: 'Please enter a valid email address' });
        setIsSaving(false);
        return;
      }

      const updatedInvestor = {
        ...currentInvestor,
        ...profileForm
      };

      await makeAPIRequest('updateInvestor', { data: updatedInvestor });
      
      setCurrentInvestor(updatedInvestor as Investor);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setMessage(null);

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all password fields' });
      return;
    }

    if (currentInvestor?.password !== passwordForm.currentPassword) {
      setMessage({ type: 'error', text: 'Current password is incorrect' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setIsSaving(true);

    try {
      const updatedInvestor = {
        ...currentInvestor,
        password: passwordForm.newPassword
      };

      await makeAPIRequest('updateInvestor', { data: updatedInvestor });
      
      setCurrentInvestor(updatedInvestor as Investor);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to change password. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <Check className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <p className="font-medium">{message.text}</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Manage your personal information</CardDescription>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Edit Profile
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="profile-name">Full Name</Label>
              <Input
                id="profile-name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>

            <div>
              <Label htmlFor="profile-email">Email Address</Label>
              <Input
                id="profile-email"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>

            <div>
              <Label htmlFor="profile-phone">Phone Number</Label>
              <Input
                id="profile-phone"
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>

            <div>
              <Label htmlFor="profile-nationality">Nationality</Label>
              <Input
                id="profile-nationality"
                value={profileForm.nationality}
                onChange={(e) => setProfileForm({ ...profileForm, nationality: e.target.value })}
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>

            <div>
              <Label htmlFor="profile-birthdate">Date of Birth</Label>
              <Input
                id="profile-birthdate"
                type="date"
                value={profileForm.birthDate}
                onChange={(e) => setProfileForm({ ...profileForm, birthDate: e.target.value })}
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>

            <div>
              <Label>Account ID</Label>
              <Input
                value={currentInvestor?.id || ''}
                disabled
                className="bg-gray-50 text-gray-500"
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleProfileUpdate}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setProfileForm({
                    name: currentInvestor?.name || '',
                    email: currentInvestor?.email || '',
                    phone: currentInvestor?.phone || '',
                    nationality: currentInvestor?.nationality || '',
                    birthDate: currentInvestor?.birthDate || ''
                  });
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="Enter current password"
              />
            </div>

            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Enter new password"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>

            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={handlePasswordChange}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Account Statistics</CardTitle>
          <CardDescription>Your account activity summary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700 mb-1">Total Properties</p>
              <p className="text-2xl font-bold text-blue-900">{units.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-700 mb-1">Documents</p>
              <p className="text-2xl font-bold text-green-900">{documents.length}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-700 mb-1">Portfolio Value</p>
              <p className="text-2xl font-bold text-purple-900">
                ${(totalPortfolioValue || 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-700 mb-1">Account Age</p>
              <p className="text-2xl font-bold text-orange-900">
                {currentInvestor?.createdAt 
                  ? Math.floor((Date.now() - new Date(currentInvestor.createdAt).getTime()) / (1000 * 60 * 60 * 24)) 
                  : 0} days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
  // Dashboard view
  // Dashboard view - Replace the entire DashboardView component (around line 850-1050)
// Dashboard view - Replace the entire DashboardView component (around line 850-1050)
const DashboardView = () => (
  <div className="space-y-8">
    {/* Summary Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-br from-[#D6B160] to-[#c4a555] px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-black text-opacity-80 text-sm font-medium">Total Portfolio Value</p>
              <p className="text-2xl font-bold text-black mt-1">
                ${(totalPortfolioValue || 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-black bg-opacity-10 rounded-full p-3">
              <TrendingUp className="h-6 w-6 text-black" />
            </div>
          </div>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-700">
            +${(totalGains || 0).toLocaleString()} total gains
          </p>
          <p className="text-xs text-gray-500 mt-1">
            From {otpUnits.length} portfolio {otpUnits.length === 1 ? 'unit' : 'units'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-opacity-90 text-sm font-medium">Monthly Rental Income</p>
              <p className="text-2xl font-bold text-white mt-1">
                ${(totalMonthlyRental || 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white bg-opacity-10 rounded-full p-3">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-700">
            From {units.filter(u => u.occupancyStatus === 'Occupied').length} occupied units
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-br from-[#D6B160] to-[#c4a555] px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-black text-opacity-80 text-sm font-medium">Total Units</p>
              <p className="text-2xl font-bold text-black mt-1">{units.length}</p>
            </div>
            <div className="bg-black bg-opacity-10 rounded-full p-3">
              <Home className="h-6 w-6 text-black" />
            </div>
          </div>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-700">
            {otpUnits.length} with portfolio data, {units.length - otpUnits.length} pending OTP
          </p>
        </div>
      </div>
    </div>

    {/* Units Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {units.length === 0 ? (
        <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Home className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-black mb-2">No Properties Yet</h3>
          <p className="text-gray-600 mb-6">Upload an OTP document to add your first property automatically</p>
          <button
            onClick={() => setActiveTab('documents')}
            className="bg-[#D6B160] hover:bg-[#c4a555] text-black px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Upload OTP Document
          </button>
        </div>
      ) : (
        <>
          {/* Portfolio Units (with OTP data) */}
          {otpUnits.map(unit => (
            <div key={unit.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200">
              <div className="bg-gradient-to-r from-[#D6B160] to-[#c4a555] px-6 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-black">{unit.name || 'Unnamed Unit'}</h3>
                    <p className="text-black text-opacity-80 text-sm">
                      {unit.type || 'N/A'} • {unit.area || '0'} sqft • {unit.location || 'N/A'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    unit.occupancyStatus === 'Occupied' 
                      ? 'bg-black bg-opacity-20 text-black' 
                      : 'bg-white bg-opacity-20 text-black'
                  }`}>
                    {unit.occupancyStatus || 'Vacant'}
                  </span>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Project</p>
                    <p className="font-semibold text-black">{unit.project || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Unit Number</p>
                    <p className="font-semibold text-black">{unit.unitNumber || 'N/A'}</p>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Purchase Value</p>
                      <p className="text-lg font-semibold text-gray-700">
                        ${(unit.purchaseValue || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Current Value</p>
                      <p className="text-xl font-bold text-black">
                        ${(unit.currentValue || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Monthly Rental</p>
                        <p className="text-lg font-bold text-[#D6B160]">
                          ${(unit.monthlyRental || 0).toLocaleString()}
                        </p>
                      </div>
                      {unit.currentValue > unit.purchaseValue && unit.purchaseValue > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Appreciation</p>
                          <p className="text-lg font-bold text-green-600">
                            +{(((unit.currentValue - unit.purchaseValue) / unit.purchaseValue) * 100).toFixed(1)}%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Empty Units (manually created, no OTP yet) */}
          {units.filter(unit => !unit.purchaseValue || unit.purchaseValue === 0).map(unit => (
            <div key={unit.id} className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 overflow-hidden hover:border-gray-400 transition-all duration-200">
              <div className="p-8 text-center">
                <div className="bg-gray-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Home className="h-8 w-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">
                  {unit.name || 'Unnamed Unit'}
                </h3>
                <p className="text-sm text-gray-500 mb-1">
                  {unit.project || 'No project'} • {unit.unitNumber || 'No unit number'}
                </p>
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <p className="text-sm text-gray-600 mb-3">
                    Folder created - awaiting OTP document
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab('documents');
                      setSelectedUnitForDoc(unit.id);
                    }}
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Upload className="h-4 w-4" />
                    Upload OTP Document
                  </button>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>

    {/* Quick Stats */}
    {otpUnits.length > 0 && (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Portfolio Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Average ROI</p>
            <p className="text-2xl font-bold text-gray-900">
              {otpUnits.length > 0 
                ? ((totalGains / otpUnits.reduce((sum, unit) => sum + (unit.purchaseValue || 0), 0)) * 100).toFixed(1) 
                : 0}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Rental Yield</p>
            <p className="text-2xl font-bold text-gray-900">
              {totalPortfolioValue > 0 
                ? (((totalMonthlyRental * 12) / totalPortfolioValue) * 100).toFixed(1) 
                : 0}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Occupancy Rate</p>
            <p className="text-2xl font-bold text-gray-900">
              {units.length > 0 
                ? ((units.filter(u => u.occupancyStatus === 'Occupied').length / units.length) * 100).toFixed(0) 
                : 0}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Investment</p>
            <p className="text-2xl font-bold text-gray-900">
              ${otpUnits.reduce((sum, unit) => sum + (unit.purchaseValue || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    )}
  </div>
);

  // Portfolio View
// Portfolio View - Replace the entire PortfolioView component
const PortfolioView = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900">Portfolio Summary</CardTitle>
        <CardDescription>Comprehensive overview of your real estate investments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900">Total Value</h3>
            <p className="text-2xl font-bold text-blue-600">
              ${(totalPortfolioValue || 0).toLocaleString()}
            </p>
            <p className="text-xs text-blue-700 mt-1">{otpUnits.length} portfolio properties</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900">Monthly Income</h3>
            <p className="text-2xl font-bold text-green-600">
              ${(totalMonthlyRental || 0).toLocaleString()}
            </p>
            <p className="text-xs text-green-700 mt-1">Estimated rental income</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900">Total Gains</h3>
            <p className="text-2xl font-bold text-purple-600">
              ${(totalGains || 0).toLocaleString()}
            </p>
            <p className="text-xs text-purple-700 mt-1">Capital appreciation</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-900">ROI</h3>
            <p className="text-2xl font-bold text-orange-600">
              {otpUnits.length > 0 
                ? ((totalGains / otpUnits.reduce((sum, unit) => sum + (unit.purchaseValue || 0), 0)) * 100).toFixed(1) 
                : 0}%
            </p>
            <p className="text-xs text-orange-700 mt-1">Return on investment</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900">Your Properties</CardTitle>
        <CardDescription>
          {units.length === 0 
            ? "Upload an OTP document to automatically add your first property" 
            : `Managing ${units.length} property${units.length !== 1 ? 'ies' : ''} (${otpUnits.length} in portfolio)`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {units.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Home className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-medium mb-2">No Properties Yet</h3>
            <p className="text-sm">Go to the Documents tab and upload an OTP document to automatically add your first property to your portfolio.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Portfolio Units (with OTP data) */}
            {otpUnits.map(unit => (
              <Card key={unit.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg text-gray-900">{unit.name}</CardTitle>
                      <CardDescription>{unit.project}</CardDescription>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        unit.occupancyStatus === 'Occupied' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {unit.occupancyStatus}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        Portfolio Unit
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Unit Number</p>
                      <p className="font-semibold">{unit.unitNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Type</p>
                      <p className="font-semibold">{unit.type || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Area</p>
                      <p className="font-semibold">{unit.area || '0'} sqft</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Location</p>
                      <p className="font-semibold">{unit.location || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-500">Purchase Value</p>
                        <p className="text-lg font-semibold text-gray-700">
                          ${(unit.purchaseValue || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Current Value</p>
                        <p className="text-xl font-bold text-gray-900">
                          ${(unit.currentValue || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Monthly Rental</p>
                        <p className="text-lg font-semibold text-green-600">
                          ${(unit.monthlyRental || 0).toLocaleString()}
                        </p>
                      </div>
                      {unit.currentValue > unit.purchaseValue && unit.purchaseValue > 0 && (
                        <div>
                          <p className="text-sm text-gray-500">Appreciation</p>
                          <p className="text-lg font-semibold text-blue-600">
                            +{(((unit.currentValue - unit.purchaseValue) / unit.purchaseValue) * 100).toFixed(1)}%
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {unit.currentValue > unit.purchaseValue && unit.purchaseValue > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-500">Capital Gain</p>
                        <p className="text-lg font-semibold text-blue-600">
                          +${((unit.currentValue || 0) - (unit.purchaseValue || 0)).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Empty Units (no OTP data yet) */}
            {units.filter(unit => !unit.purchaseValue || unit.purchaseValue === 0).map(unit => (
              <Card key={unit.id} className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-all bg-gray-50">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg text-gray-700">{unit.name || 'Unnamed Unit'}</CardTitle>
                      <CardDescription>{unit.project || 'No project assigned'}</CardDescription>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                      Pending OTP
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Unit Number</p>
                      <p className="font-semibold text-gray-700">{unit.unitNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Type</p>
                      <p className="font-semibold text-gray-700">{unit.type || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Area</p>
                      <p className="font-semibold text-gray-700">{unit.area || '0'} sqft</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Location</p>
                      <p className="font-semibold text-gray-700">{unit.location || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      No financial data available. Upload OTP document to add this unit to your portfolio.
                    </p>
                    <button
                      onClick={() => {
                        setActiveTab('documents');
                        setSelectedUnitForDoc(unit.id);
                      }}
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Upload className="h-4 w-4" />
                      Upload OTP Document
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Additional Portfolio Analytics */}
    {otpUnits.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Portfolio Analytics</CardTitle>
          <CardDescription>Detailed breakdown of your investment performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Investment Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg">
                <p className="text-sm text-blue-700 mb-1">Total Invested</p>
                <p className="text-2xl font-bold text-blue-900">
                  ${otpUnits.reduce((sum, unit) => sum + (unit.purchaseValue || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-lg">
                <p className="text-sm text-green-700 mb-1">Annual Rental Income</p>
                <p className="text-2xl font-bold text-green-900">
                  ${((totalMonthlyRental || 0) * 12).toLocaleString()}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-lg">
                <p className="text-sm text-purple-700 mb-1">Rental Yield</p>
                <p className="text-2xl font-bold text-purple-900">
                  {totalPortfolioValue > 0 
                    ? (((totalMonthlyRental * 12) / totalPortfolioValue) * 100).toFixed(2) 
                    : 0}%
                </p>
              </div>
            </div>

            {/* Unit Performance Breakdown */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Unit Performance</h4>
              <div className="space-y-2">
                {otpUnits.map(unit => {
                  const gain = (unit.currentValue || 0) - (unit.purchaseValue || 0);
                  const roiPercent = unit.purchaseValue > 0 
                    ? ((gain / unit.purchaseValue) * 100).toFixed(1) 
                    : 0;
                  
                  return (
                    <div key={unit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{unit.name}</p>
                        <p className="text-sm text-gray-600">{unit.project}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ${(unit.currentValue || 0).toLocaleString()}
                        </p>
                        <p className={`text-sm font-medium ${
                          gain >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {gain >= 0 ? '+' : ''}{roiPercent}% ROI
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card> 
    )}
  </div>
);

  // Enhanced Analysis View - Replace the entire AnalysisView component
const AnalysisView = () => {
  // Calculate per-unit metrics
  const unitAnalysis = otpUnits.map(unit => {
    const purchaseValue = unit.purchaseValue || 0;
    const currentValue = unit.currentValue || 0;
    const monthlyRental = unit.monthlyRental || 0;
    
    const capitalGain = currentValue - purchaseValue;
    const capitalROI = purchaseValue > 0 ? ((capitalGain / purchaseValue) * 100) : 0;
    const annualRental = monthlyRental * 12;
    const rentalYield = currentValue > 0 ? ((annualRental / currentValue) * 100) : 0;
    const totalROI = purchaseValue > 0 ? (((capitalGain + annualRental) / purchaseValue) * 100) : 0;
    
    return {
      ...unit,
      capitalGain,
      capitalROI,
      annualRental,
      rentalYield,
      totalROI
    };
  }).sort((a, b) => b.capitalROI - a.capitalROI); // Sort by best performing

  return (
    <div className="space-y-6">
      {/* Portfolio Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Investment Analysis</CardTitle>
          <CardDescription>Detailed analysis of your investment performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-4 text-gray-900">Market Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Average ROI</span>
                  <span className="font-bold text-lg text-gray-900">
                    {otpUnits.length > 0 
                      ? ((totalGains / otpUnits.reduce((sum, unit) => sum + (unit.purchaseValue || 0), 0)) * 100).toFixed(1) 
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Portfolio Rental Yield</span>
                  <span className="font-bold text-lg text-gray-900">
                    {totalPortfolioValue > 0 
                      ? (((totalMonthlyRental || 0) * 12 / totalPortfolioValue) * 100).toFixed(1) 
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Occupancy Rate</span>
                  <span className="font-bold text-lg text-gray-900">
                    {units.length > 0 
                      ? ((units.filter(u => u.occupancyStatus === 'Occupied').length / units.length) * 100).toFixed(0) 
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Total Capital Gain</span>
                  <span className="font-bold text-lg text-green-600">
                    +${(totalGains || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-gray-900">Portfolio Distribution</h3>
              <div className="space-y-3">
                {otpUnits.map(unit => {
                  const percentage = totalPortfolioValue > 0 
                    ? ((unit.currentValue / totalPortfolioValue) * 100) 
                    : 0;
                  return (
                    <div key={unit.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">{unit.name}</span>
                        <span className="font-semibold text-gray-900">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {otpUnits.length === 0 && (
                  <p className="text-gray-500 text-sm">Upload OTP documents to see portfolio distribution</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-Unit Performance Analysis */}
      {otpUnits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Per-Unit Performance Analysis</CardTitle>
            <CardDescription>Detailed ROI and performance metrics for each property</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {unitAnalysis.map((unit, index) => (
                <div 
                  key={unit.id} 
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-white"
                >
                  {/* Unit Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{unit.name}</h4>
                      <p className="text-sm text-gray-600">{unit.project} • {unit.unitNumber}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        unit.capitalROI > 10 ? 'bg-green-100 text-green-800' :
                        unit.capitalROI > 5 ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {index === 0 && '⭐ '}Best Performer {index === 0 && ' ⭐'}
                      </span>
                    </div>
                  </div>

                  {/* Financial Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Purchase Value</p>
                      <p className="text-lg font-bold text-gray-900">
                        ${unit.purchaseValue.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-blue-700 mb-1">Current Value</p>
                      <p className="text-lg font-bold text-blue-900">
                        ${unit.currentValue.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-xs text-green-700 mb-1">Capital Gain</p>
                      <p className="text-lg font-bold text-green-900">
                        +${unit.capitalGain.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-xs text-purple-700 mb-1">Capital ROI</p>
                      <p className="text-lg font-bold text-purple-900">
                        {unit.capitalROI.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Rental Performance */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Monthly Rental</p>
                      <p className="text-md font-semibold text-gray-900">
                        ${unit.monthlyRental.toLocaleString()}/mo
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Annual Rental Income</p>
                      <p className="text-md font-semibold text-gray-900">
                        ${unit.annualRental.toLocaleString()}/yr
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Rental Yield</p>
                      <p className="text-md font-semibold text-gray-900">
                        {unit.rentalYield.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {/* Total ROI Calculation */}
                  <div className="mt-4 pt-4 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-700 mb-1">Total ROI (Capital + 1 Year Rental)</p>
                        <p className="text-xs text-gray-600">
                          Capital Gain: ${unit.capitalGain.toLocaleString()} + Annual Rental: ${unit.annualRental.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                          {unit.totalROI.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-600">Total Return</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Investment Summary */}
      {otpUnits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Investment Summary</CardTitle>
            <CardDescription>Overall portfolio performance at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">Total Capital Invested</p>
                <p className="text-3xl font-bold text-blue-900">
                  ${otpUnits.reduce((sum, unit) => sum + (unit.purchaseValue || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
                <p className="text-sm text-green-800 mb-2">Current Portfolio Value</p>
                <p className="text-3xl font-bold text-green-900">
                  ${(totalPortfolioValue || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg">
                <p className="text-sm text-purple-800 mb-2">Total Appreciation</p>
                <p className="text-3xl font-bold text-purple-900">
                  +${(totalGains || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {otpUnits.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Portfolio Data Available</h3>
            <p className="text-gray-600 mb-6">
              Upload OTP documents to start tracking your investment performance and ROI
            </p>
            <button
              onClick={() => setActiveTab('documents')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Upload OTP Documents
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

  // Payments View
  const PaymentsView = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Upload Payment Proof</CardTitle>
          <CardDescription>Upload proof of payment for your installments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="unit-select">Select Unit</Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectItem value="">Choose unit</SelectItem>
                {units.map(unit => (
                  <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="payment-amount">Payment Amount</Label>
              <Input
                id="payment-amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            <div>
              <Label htmlFor="payment-date">Payment Date</Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="payment-proof">Upload Payment Proof</Label>
            <Input
              id="payment-proof"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handlePaymentUpload}
              disabled={!selectedUnit || !paymentAmount || !paymentDate}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Payment Schedule</CardTitle>
          <CardDescription>Track your installment payments</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payment schedule found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map(payment => {
                const unit = units.find(u => u.id === payment.unitId);
                return (
                  <div key={payment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900">{unit?.name}</p>
                      <p className="text-sm text-gray-600">
                        Installment {payment.installmentNumber} of {payment.totalInstallments}
                      </p>
                      <p className="text-sm text-gray-600">Due: {payment.dueDate}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-semibold text-gray-900">${payment.amount.toLocaleString()}</p>
                      <div className="flex items-center gap-2">
                        {payment.status === 'Paid' && <Check className="h-4 w-4 text-blue-600" />}
                        {payment.status === 'Pending' && <Clock className="h-4 w-4 text-gray-600" />}
                        {payment.status === 'Overdue' && <AlertCircle className="h-4 w-4 text-red-600" />}
                        <span className={`text-sm px-2 py-1 rounded-full font-medium ${
                          payment.status === 'Paid' ? 'bg-blue-100 text-blue-600' :
                          payment.status === 'Pending' ? 'bg-gray-100 text-gray-600' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );


  // Events View
  const EventsView = () => (
    <div className="space-y-6">
      <Card className="border border-[#D6B160]">
        <CardHeader>
          <CardTitle className="text-black text-2xl">InvestMenter Events</CardTitle>
          <CardDescription className="text-gray-700">Upcoming webinars, congresses, and exclusive investment trips.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="p-4 border border-[#D6B160] rounded-lg hover:shadow-md transition-shadow">
              <h4 className="text-xl text-black">Webinar</h4>
              <p className="text-sm text-gray-700 mt-1 mb-3">
                Join our exclusive webinar to learn about the latest trends in real estate investment and discover new opportunities.
              </p>
              <a
                href="https://immo.investmenter.de/webinar"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#D6B160] text-black px-4 py-2 rounded text-sm hover:bg-opacity-80 transition-colors"
              >
                Register Now
              </a>
            </div>

            <div className="p-4 border border-[#D6B160] rounded-lg hover:shadow-md transition-shadow">
              <h4 className="text-xl text-black">Kongress</h4>
              <p className="text-sm text-gray-700 mt-1 mb-3">
                Attend the premier investment congress to network with industry leaders and gain insights into the future of investing.
              </p>
              <a
                href="https://www.investment-kongress.com/?referrer=INVESTMENTER"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#D6B160] text-black px-4 py-2 rounded text-sm hover:bg-opacity-80 transition-colors"
              >
                Register Now
              </a>
            </div>

            <div className="p-4 border border-[#D6B160] rounded-lg hover:shadow-md transition-shadow">
              <h4 className="text-xl text-black">InvestMenter Reise Dubai</h4>
              <p className="text-sm text-gray-700 mt-1 mb-3">
                An exclusive investment trip to Dubai. Explore prime real estate opportunities firsthand with our expert team.
              </p>
              <a
                href="https://dubai-immobilie-kaufen.de/investmenter-reise-dubai/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#D6B160] text-black px-4 py-2 rounded text-sm hover:bg-opacity-80 transition-colors"
              >
                Buy Ticket Here
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // News View
  const NewsView = () => {
    const [articles, setArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      const fetchNews = async () => {
        setLoading(true);
        setError(null);
        try {
          const newsData = await makeAPIRequest('getNews'); 

          if (newsData && newsData.articles) {
            setArticles(newsData.articles.slice(0, 10));
          } else {
            throw new Error('No articles were found.');
          }

        } catch (err: any) {
          setError('Failed to fetch news. Please try again later.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchNews();
    }, []);

    const renderContent = () => {
      if (loading) {
        return <div className="text-center py-10"><p className="text-gray-600">Loading latest news...</p></div>;
      }
      if (error) {
        return <div className="text-center py-10 bg-red-50 text-red-700 rounded-lg"><p>{error}</p></div>;
      }
      return (
        <div className="space-y-6">
          {articles.length > 0 ? (
            articles.map((article, index) => (
              <article key={index} className="border-b pb-4 last:border-b-0">
                <h3 className="font-semibold text-lg text-gray-900 hover:text-blue-600">
                  <a href={article.url} target="_blank" rel="noopener noreferrer">
                    {article.title}
                  </a>
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  {new Date(article.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} • {article.source.name}
                </p>
                <p className="text-gray-700">{article.description}</p>
              </article>
            ))
          ) : (
            <div className="text-center py-10"><p className="text-gray-600">No recent news found.</p></div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Dubai Real Estate News</CardTitle>
            <CardDescription>Latest news and updates from Dubai's property market</CardDescription>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Marketplace View
const MarketplaceView = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900">Available Services</CardTitle>
        <CardDescription>Professional services for property investors</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {AVAILABLE_SERVICES.map(service => (
            <Card key={service.id} className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    {service.popular && (
                      <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        Popular
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {service.price === 0 ? 'Commission' : `$${service.price.toLocaleString()}`}
                    </p>
                    <p className="text-sm text-gray-600">{service.deliveryTime}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <div className="space-y-2 mb-4">
                  <p className="font-semibold text-sm text-gray-900">Features:</p>
                  <ul className="space-y-1">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button
                  onClick={() => {
                    const existingItem = cart.find(item => item.serviceId === service.id);
                    if (existingItem) {
                      setCart(cart.map(item =>
                        item.serviceId === service.id
                          ? { ...item, quantity: item.quantity + 1 }
                          : item
                      ));
                    } else {
                      setCart([...cart, { serviceId: service.id, quantity: 1, service }]);
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

// Cart View
const CartView = () => {
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAmount = cart.reduce((sum, item) => sum + (item.service.price * item.quantity), 0);

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;

    setIsSubmitting(true);
    try {
      const order: Order = {
        id: Date.now().toString(),
        investorId: currentInvestor!.id,
        items: cart,
        totalAmount,
        paymentMethod: 'bank_transfer',
        status: 'pending_payment',
        createdAt: new Date().toISOString(),
        notes: orderNotes
      };

      await makeAPIRequest('createOrder', { data: order });
      setOrders([...orders, order]);
      setCart([]);
      setOrderNotes('');
      alert('Order submitted successfully! Please proceed with bank transfer.');
    } catch (error) {
      alert('Failed to submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Shopping Cart</CardTitle>
          <CardDescription>Review your selected services</CardDescription>
        </CardHeader>
        <CardContent>
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Your cart is empty</p>
              <Button
                onClick={() => setActiveTab('marketplace')}
                className="mt-4"
                variant="outline"
              >
                Browse Services
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.serviceId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{item.service.name}</h4>
                    <p className="text-sm text-gray-600">{item.service.description}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => {
                          if (item.quantity > 1) {
                            setCart(cart.map(i =>
                              i.serviceId === item.serviceId
                                ? { ...i, quantity: i.quantity - 1 }
                                : i
                            ));
                          } else {
                            setCart(cart.filter(i => i.serviceId !== item.serviceId));
                          }
                        }}
                        variant="outline"
                        className="px-2 py-1"
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        onClick={() => {
                          setCart(cart.map(i =>
                            i.serviceId === item.serviceId
                              ? { ...i, quantity: i.quantity + 1 }
                              : i
                          ));
                        }}
                        variant="outline"
                        className="px-2 py-1"
                      >
                        +
                      </Button>
                    </div>
                    <p className="font-bold text-gray-900 w-24 text-right">
                      ${(item.service.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}

              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-gray-900">${totalAmount.toLocaleString()}</span>
                </div>

                <div className="mb-4">
                  <Label htmlFor="order-notes">Order Notes (Optional)</Label>
                  <textarea
                    id="order-notes"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full border p-2 rounded mt-1"
                    rows={3}
                    placeholder="Any special requirements or notes..."
                  />
                </div>

                <Button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
  
  if (!isAuthenticated) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* HEADER WITH LOGO */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
  <div className="max-w-7xl mx-auto px-4 py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <InvestMenterLogo size="small" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investor Portal</h1>
          <p className="text-gray-600 text-sm">Manage your real estate investments with precision</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        {/* Portfolio Value Card */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
          <p className="text-xs text-gray-600 font-medium">Portfolio Value</p>
          <p className="text-lg font-bold text-gray-900">${(totalPortfolioValue || 0).toLocaleString()}</p>
        </div>
        
        {/* User Profile Dropdown */}
        <div className="relative" data-profile-dropdown>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="bg-[#D6B160] rounded-full w-10 h-10 flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">{currentInvestor?.name}</p>
              <p className="text-xs text-gray-600">{currentInvestor?.email}</p>
            </div>
          </button>

          {/* Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <button
                onClick={() => {
                  setActiveTab('profile');
                  setShowProfileMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Profile Settings
              </button>
              <div className="border-t border-gray-200 my-2"></div>
              <button
                onClick={() => {
                  setIsAuthenticated(false);
                  setCurrentInvestor(null);
                  setUnits([]);
                  setPayments([]);
                  setDocuments([]);
                  setShowProfileMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
</div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white border border-gray-200 rounded-lg p-1 mb-6">
          <div className="flex flex-wrap gap-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Home },
              { id: 'portfolio', label: 'Portfolio', icon: TrendingUp },
              { id: 'analysis', label: 'Investment Analysis', icon: TrendingUp },
              { id: 'payments', label: 'Payments', icon: CreditCard },
              { id: 'documents', label: 'Documents', icon: FileText },
              { id: 'marketplace', label: 'Services', icon: () => (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ) },
    { id: 'cart', label: `Cart${getCartItemCount() > 0 ? ` (${getCartItemCount()})` : ''}`, icon: CreditCard },
              { id: 'chatbot', label: 'AI Assistant', icon: () => (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              ) },
              { id: 'events', label: 'Investment Events', icon: AlertCircle },
              { id: 'news', label: 'Dubai News', icon: FileText }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
        {uploadingDocument && (
          <div className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
            <div className="flex items-center gap-2 text-blue-900">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Processing document with AI...
            </div>
          </div>
        )}

          {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'portfolio' && <PortfolioView />}
        {activeTab === 'analysis' && <AnalysisView />}
        {activeTab === 'payments' && <PaymentsView />}
        {activeTab === 'documents' && <DocumentsView 
  documentCategory={documentCategory}
  setDocumentCategory={setDocumentCategory}
  selectedUnitForDoc={selectedUnitForDoc}
  setSelectedUnitForDoc={setSelectedUnitForDoc}
  showAddUnitForm={showAddUnitForm}
  setShowAddUnitForm={setShowAddUnitForm}
  documentType={documentType}
  setDocumentType={setDocumentType}
  handleFileUpload={handleFileUpload}
  uploadingDocument={uploadingDocument}
  units={units}
  newUnitForm={newUnitForm}
  setNewUnitForm={setNewUnitForm}
  createNewUnit={createNewUnit}
  documents={documents}
  expandedFolders={expandedFolders}
  setExpandedFolders={setExpandedFolders}
  toggleFolder={toggleFolder}
/>}
        {activeTab === 'marketplace' && <MarketplaceView />}
        {activeTab === 'cart' && <CartView />}
        {activeTab === 'chatbot' && <ChatbotView 
  chatMessages={chatMessages}
  chatInput={chatInput}
  setChatInput={setChatInput}
  isChatLoading={isChatLoading}
  sendChatMessage={sendChatMessage}
  handleChatSubmit={handleChatSubmit}
/>}
        {activeTab === 'profile' && <ProfileView />}
        {activeTab === 'events' && <EventsView />}
        {activeTab === 'news' && <NewsView />}

      </div>
    </div>
  );
};

export default InvestorPortal;