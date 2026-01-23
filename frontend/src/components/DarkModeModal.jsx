import React from 'react';
import { X } from 'lucide-react';

export default function DarkModeModal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-2xl"
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`bg-gray-900 rounded-lg w-full ${maxWidth} max-h-[90vh] overflow-auto border border-gray-800`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-900">
          <h2 className="text-xl font-medium text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-2xl transition"
          >
            x
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-gray-100">
          {React.Children.map(children, (child, index) => (
            <React.Fragment key={index}>{child}</React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
