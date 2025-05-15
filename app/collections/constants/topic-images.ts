export interface TopicImage {
  topic: string;
  imageUrl: string;
}

export const topicImages: Record<string, string> = {
  ART: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80",
  SCIENCE:
    "https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80",
  TECHNOLOGY:
    "https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80",
  HISTORY:
    "https://images.unsplash.com/photo-1461360370896-922624d12aa1?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80",
  LITERATURE:
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80",
  ENTERTAINMENT:
    "https://images.unsplash.com/photo-1603190287605-e6ade32fa852?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80",
  SPORTS:
    "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80",
  GEOGRAPHY:
    "https://images.unsplash.com/photo-1526778548025-fa2f459cd5ce?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80",
  HEALTH:
    "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80",
  EDUCATION:
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80",
  NATURE:
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80",
  CULTURE:
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80",
  BUSINESS:
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80",
  PHILOSOPHY:
    "https://images.unsplash.com/photo-1544985361-b420d7a77043?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80",
  FOOD: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80",
  TRIVIA:
    "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80",
  "All Topics":
    "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80",
};

// Function to get image URL for a topic
export const getTopicImageUrl = (topic: string): string => {
  return (
    topicImages[topic] ||
    "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80"
  ); // Default image
};
