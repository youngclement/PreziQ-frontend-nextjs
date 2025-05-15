export interface TopicImage {
  topic: string;
  imageUrl: string;
}

export const topicImages: Record<string, string> = {
  ART: "https://mastermedia.vn/wp-content/uploads/2023/05/art-va-design-1.jpg",
  SCIENCE:
    "https://cdn.vietnambiz.vn/2019/10/15/1nvhe7mchqmjbgyvx-uobra-15711056360651103109227.png",
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
    "https://www.sciencing.com/sciencing/what-is-geology-13764454/ce627d12bb604ced899fee14f2ff23fb.jpg  ",
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
