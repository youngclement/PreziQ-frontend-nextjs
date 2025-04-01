'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';

export default function ProfileLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { isLoggedIn } = useAuth();
	const router = useRouter();
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Kiểm tra xác thực và chuyển hướng nếu chưa đăng nhập
		const checkAuth = () => {
			if (!isLoggedIn) {
				router.push('/auth/login');
			} else {
				setLoading(false);
			}
		};

		// Đặt timeout ngắn để đảm bảo trạng thái auth đã được cập nhật
		const timer = setTimeout(checkAuth, 500);
		return () => clearTimeout(timer);
	}, [isLoggedIn, router]);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
				<span className="ml-2">Đang xác thực...</span>
			</div>
		);
	}

	return (
		<div className="min-h-screen pt-24 pb-8 px-4 md:px-6 lg:px-8">
			<div className="max-w-4xl mx-auto">{children}</div>
		</div>
	);
}
