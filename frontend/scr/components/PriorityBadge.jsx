import React from 'react';

const PriorityBadge = ({ prioridad }) => {
    // Diccionario de configuración de colores según el nivel de riesgo
    const colorConfig = {
        'Alta': 'bg-red-100 text-red-800 border border-red-200',
        'Media': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        'Baja': 'bg-green-100 text-green-800 border border-green-200'
    };

    // Si por algún motivo llega vacío, por defecto es Baja
    const currentStyle = colorConfig[prioridad] || colorConfig['Baja'];

    return (
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full shadow-sm ${currentStyle}`}>
            {prioridad || 'Baja'}
        </span>
    );
};

export default PriorityBadge;