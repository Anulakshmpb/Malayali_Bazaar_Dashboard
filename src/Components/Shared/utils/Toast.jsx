import React from 'react';
import {
	FaCheckCircle,
	FaExclamationCircle,
	FaInfoCircle,
	FaExclamationTriangle,
	FaTimes,
} from 'react-icons/fa';

const Toast = ({ id, message, type, onClose }) => {
	const typeConfig = {
		success: {
			icon: <FaCheckCircle />,
			colorClass: 'text-emerald-500',
			borderClass: 'border-l-4 border-emerald-500',
		},
		error: {
			icon: <FaExclamationCircle />,
			colorClass: 'text-red-500',
			borderClass: 'border-l-4 border-red-500',
		},
		info: {
			icon: <FaInfoCircle />,
			colorClass: 'text-blue-500',
			borderClass: 'border-l-4 border-blue-500',
		},
		warning: {
			icon: <FaExclamationTriangle />,
			colorClass: 'text-amber-500',
			borderClass: 'border-l-4 border-amber-500',
		},
	};

	const config = typeConfig[type] || typeConfig.info;

	return (
		<div className={`flex items-center gap-3 p-4 rounded-xl shadow-lg bg-white min-w-[300px] animate-slideIn max-md:min-w-0 ${config.borderClass}`}>
			<div className={`text-xl shrink-0 ${config.colorClass}`}>{config.icon}</div>
			<div className="flex-1 text-sm font-medium text-slate-800">{message}</div>
			<button
				className="text-slate-500 p-1 flex items-center justify-center rounded transition-colors duration-200 hover:bg-black/5 cursor-pointer"
				onClick={() => onClose(id)}
			>
				<FaTimes />
			</button>
		</div>
	);
};

export default Toast;
