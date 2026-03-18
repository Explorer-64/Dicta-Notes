import { Helmet } from 'react-helmet-async';

/**
 * Component that adds noindex, nofollow meta tags to prevent search engine indexing.
 * Use this on protected pages, test pages, and other pages that shouldn't appear in search results.
 */
export function NoIndexMeta() {
  return (
    <Helmet>
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
  );
}
