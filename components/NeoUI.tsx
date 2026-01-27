import React from 'react';

// --- Colors ---
export const COLORS = {
  primary: 'bg-[#FFADE7]',    // Pink
  secondary: 'bg-[#A2D2FF]',  // Blue
  accent: 'bg-[#FFEF96]',     // Yellow
  success: 'bg-[#B0F2B4]',    // Green
  white: 'bg-white',
  bg: 'bg-[#FDF4F5]',
  text: 'text-black'          // Changed to pure black
};

// --- Loader ---
export const NeoLoader: React.FC = () => (
  <div className="flex justify-center items-center space-x-2 p-8">
    <div className="w-4 h-4 bg-[#FFADE7] rounded-full animate-bounce border-2 border-black"></div>
    <div className="w-4 h-4 bg-[#A2D2FF] rounded-full animate-bounce delay-75 border-2 border-black"></div>
    <div className="w-4 h-4 bg-[#FFEF96] rounded-full animate-bounce delay-150 border-2 border-black"></div>
  </div>
);

// --- Card ---
interface CardProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
  noShadow?: boolean;
}
export const NeoCard: React.FC<CardProps> = ({ children, className = '', color = 'bg-white', noShadow = false }) => (
  <div className={`${color} border-2 border-black rounded-xl p-4 ${noShadow ? '' : 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'} ${className}`}>
    {children}
  </div>
);

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' | 'black';
  size?: 'sm' | 'md' | 'lg';
}
export const NeoButton: React.FC<ButtonProps> = ({ children, className = '', variant = 'primary', size = 'md', ...props }) => {
  let bgClass = COLORS.primary;
  let textClass = 'text-black';
  
  if (variant === 'secondary') bgClass = COLORS.secondary;
  if (variant === 'accent') bgClass = COLORS.accent;
  if (variant === 'danger') bgClass = 'bg-[#FF8888]';
  if (variant === 'ghost') bgClass = 'bg-transparent border-transparent shadow-none';
  if (variant === 'black') {
    bgClass = 'bg-black';
    textClass = 'text-white';
  }

  const sizeClass = size === 'sm' ? 'px-3 py-1 text-sm' : size === 'lg' ? 'px-6 py-3 text-lg' : 'px-4 py-2';
  const borderClass = variant === 'ghost' ? '' : 'border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all';

  return (
    <button 
      className={`font-bold rounded-lg flex items-center justify-center gap-2 ${bgClass} ${textClass} ${sizeClass} ${borderClass} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
      {...props}
    >
      {children}
    </button>
  );
};

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}
export const NeoInput: React.FC<InputProps> = ({ label, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block font-bold mb-1 text-sm text-black">{label}</label>}
    <input 
      className={`w-full border-2 border-black bg-black text-white placeholder:text-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFADE7] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${className}`}
      {...props}
    />
  </div>
);

// --- Modal ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}
export const NeoModal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="relative w-full max-w-lg animate-in fade-in zoom-in duration-200">
        <NeoCard color="bg-white" className="max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2">
            <h2 className="text-xl font-bold text-black">{title}</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          {children}
        </NeoCard>
      </div>
    </div>
  );
};

// --- Badge ---
export const NeoBadge: React.FC<{ children: React.ReactNode, color?: string }> = ({ children, color = 'bg-gray-200' }) => (
  <span className={`${color} border border-black px-2 py-0.5 rounded-full text-xs font-bold text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]`}>
    {children}
  </span>
);