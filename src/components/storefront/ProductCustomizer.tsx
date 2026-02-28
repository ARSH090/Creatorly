'use client';

import React, { useState } from 'react';

export default function ProductCustomizer() {
    const [selectedSize, setSelectedSize] = useState('M');
    const [selectedColor, setSelectedColor] = useState('Black');

    const sizes = ['S', 'M', 'L', 'XL'];
    const colors = ['Black', 'White', 'Navy'];

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Customize</h3>

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Size</label>
                    <div className="flex gap-2">
                        {sizes.map(size => (
                            <button
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${selectedSize === size
                                        ? 'bg-black text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Color</label>
                    <div className="flex gap-2">
                        {colors.map(color => (
                            <button
                                key={color}
                                onClick={() => setSelectedColor(color)}
                                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all border ${selectedColor === color
                                        ? 'border-black bg-gray-50 text-black'
                                        : 'border-transparent bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {color}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
