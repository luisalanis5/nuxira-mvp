import React from 'react';

const VerifiedBadge = () => {
    return (
        <span className="inline-flex items-center justify-center p-0.5 ml-2 mt-1 align-middle relative group">
            {/* Brillo de fondo sutil */}
            <span className="absolute inset-0 bg-blue-400 rounded-full blur-[2px] opacity-40 group-hover:opacity-80 transition-opacity"></span>

            <svg
                className="w-5 h-5 text-blue-500 relative z-10"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Sol o Estrella poligonal */}
                <path d="M12 2l2.4 3.2L18 4.6l1.2 3.8L22 10l-2.2 3.1.6 4-3.8 1.4-1.8 3.5L12 20l-2.8 2-1.8-3.5-3.8-1.4.6-4L2 10l2.8-1.6L6 4.6l3.6.6L12 2z" className="text-blue-500" />
                {/* Palomita interior */}
                <path d="M10 15l-3-3 1.4-1.4 1.6 1.6 5-5L16.4 8l-6.4 6.4z" fill="white" />
            </svg>

            {/* Tooltip on hover */}
            <span className="absolute bottom-full right-0 mb-2 w-36 px-2 py-1 text-[10px] font-bold text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg border border-gray-700 text-center whitespace-normal leading-tight">
                Creador Verificado ✓
            </span>
        </span>
    );
};

export default VerifiedBadge;
