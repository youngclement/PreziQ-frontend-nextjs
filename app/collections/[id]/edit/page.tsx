import EditCollectionClient from './client';
import { collectionsApi } from '@/api-client/collections-api';
import { Collection } from '@/app/collections/components/types';

export async function generateStaticParams() {
	try {
		const response = await collectionsApi.getCollections();
		if (response.data.success) {
			const collections = response.data.data.content as Collection[];
			return collections.map((collection) => ({
				id: collection.id,
			}));
		}
		console.error('Failed to fetch collections:', response.data);
		return [{ id: 'placeholder' }];
	} catch (error) {
		console.error('Error fetching collections:', error);
		return [{ id: 'placeholder' }];
	}
}

export default function EditCollectionPage({
	params,
}: {
	params: { id: string };
}) {
	return <EditCollectionClient params={params} />;
}
