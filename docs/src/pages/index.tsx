import { useHistory } from '@docusaurus/router';
import { useEffect } from 'react';

export default function Home() {
  const history = useHistory();

  useEffect(() => {
    // Redirect to the intro documentation
    history.replace('/gswap-sdk/docs/intro');
  }, [history]);

  // Return null since we're redirecting
  return null;
}
