import React from 'react';

// Import the same UI components used in your main file
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline';
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

// Simple components (you'll need these in the separate file)
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

// ChatbotView Props Interface
interface ChatbotViewProps {
  chatMessages: Array<{id: string, text: string, isUser: boolean, timestamp: Date}>;
  chatInput: string;
  setChatInput: (value: string) => void;
  isChatLoading: boolean;
  sendChatMessage: (message: string) => void;
  handleChatSubmit: (e: React.FormEvent) => void;
}

// Main ChatbotView Component
const ChatbotView: React.FC<ChatbotViewProps> = ({ 
  chatMessages, 
  chatInput, 
  setChatInput, 
  isChatLoading, 
  sendChatMessage, 
  handleChatSubmit 
}) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900 flex items-center gap-2">
          <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Dubai Real Estate AI Assistant
        </CardTitle>
        <CardDescription>Get expert insights about Dubai property market, investment opportunities, and regulations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col h-96">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-3 p-4 bg-gray-50 rounded-lg">
            {chatMessages.map(message => (
              <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  message.isUser 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}>
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 text-gray-900 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <p className="text-sm">AI is thinking...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Quick Questions */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Quick Questions:</p>
            <div className="flex flex-wrap gap-2">
              {[
                "What are the best areas to invest in Dubai?",
                "How can I get a visa through property investment?",
                "What are the current rental yields?",
                "Tell me about off-plan properties"
              ].map(question => (
                <button
                  key={question}
                  onClick={() => sendChatMessage(question)}
                  disabled={isChatLoading}
                  className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors disabled:opacity-50"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
          
          {/* Chat Input */}
          <form onSubmit={handleChatSubmit} className="flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about Dubai real estate..."
              disabled={isChatLoading}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={isChatLoading || !chatInput.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              Send
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
    
    {/* Real Estate Market Highlights */}
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900">Market Highlights</CardTitle>
        <CardDescription>Latest trends and insights</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">Investment Growth</h3>
            <p className="text-sm text-green-800">Dubai property market shows strong growth with increasing foreign investment</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Golden Visa</h3>
            <p className="text-sm text-blue-800">Long-term residency available for property investments above AED 2M</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-2">Rental Yields</h3>
            <p className="text-sm text-purple-800">Competitive rental returns averaging 5-8% across prime locations</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default ChatbotView;