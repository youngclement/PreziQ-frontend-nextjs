import { MOCK_COLLECTIONS } from "../components/mock-data";
import CollectionActivitiesClient from "./client";

// This function generates the static routes at build time
export function generateStaticParams() {
  return MOCK_COLLECTIONS.map((collection) => ({
    id: collection.id,
  }));
}

export default function CollectionActivitiesPage({ params }: { params: { id: string } }) {
  return <CollectionActivitiesClient params={params} />;
}