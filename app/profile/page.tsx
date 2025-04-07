'use client';

import { UserProfileClient } from './components/user-profile-client';
import { Suspense } from 'react';
import { Loader2, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Metadata } from 'next';

export default function ProfilePage() {
	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-6 px-4 sm:px-6 lg:px-8">
			<div className="max-w-4xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="flex items-center space-x-4 mb-8"
				>
					<div className="p-3 bg-primary/10 rounded-full">
						<UserCircle className="h-8 w-8 text-primary" />
					</div>
					<div>
						<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
							Hồ sơ cá nhân
						</h1>
						<p className="text-gray-600 dark:text-gray-300">
							Quản lý thông tin cá nhân và bảo mật tài khoản của bạn
						</p>
					</div>
				</motion.div>

				<Suspense fallback={<LoadingState />}>
					<UserProfileClient />
				</Suspense>
			</div>
		</div>
	);
}

function LoadingState() {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3 }}
			className="w-full h-96 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg shadow-lg"
		>
			<div className="flex flex-col items-center space-y-4">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
				<span className="text-gray-600 dark:text-gray-300">
					Đang tải thông tin...
				</span>
			</div>
		</motion.div>
	);
}
