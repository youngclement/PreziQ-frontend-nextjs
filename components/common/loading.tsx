import Lottie from 'lottie-react';
import loadingAnimation from '@/public/images/loading.json';

const Loading = () => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="relative w-32 h-32">
        <Lottie animationData={loadingAnimation} loop={true} />
      </div>
    </div>
  );
};

export default Loading;