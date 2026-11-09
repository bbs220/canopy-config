import { useNavigate } from 'react-router';
import { NotFoundUI } from '../components/ui/NotFoundUI';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <NotFoundUI
      onGoHome={() => navigate('/')}
      onGoBack={() => navigate(-1)}
      onGoShopifyPreview={() => navigate('/shopify-preview')}
    />
  );
}

export default NotFoundPage;
