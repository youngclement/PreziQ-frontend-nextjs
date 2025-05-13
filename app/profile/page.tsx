'use client';

import { UserProfileClient } from './components/user-profile-client';
import { Suspense } from 'react';
import { UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Metadata } from 'next';
import Loading from '@/components/common/loading';

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
		<Loading />
	);
}
