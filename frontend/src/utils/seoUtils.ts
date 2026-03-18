import brain from "brain";
import { IndexNowSubmitUrlRequest } from "types";
import { APP_BASE_PATH } from "app"; // Import APP_BASE_PATH for canonical URLs

/**
 * Creates a full canonical URL including domain for a page path
 * 
 * @param path The path component, should start with a slash
 * @returns Full canonical URL
 */
export const getCanonicalUrl = (path: string): string => {
  // Always use the production domain for canonical URLs
  const productionDomain = "https://dicta-notes.com";
  // Ensure path starts with a slash
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${productionDomain}${normalizedPath}`;
};

/**
 * Submits a URL to the Bing IndexNow API via our backend.
 * 
 * @param pageUrl The full URL of the page to submit (e.g., https://dicta-notes.com/some-page).
 * @returns Promise<boolean> True if the submission was accepted, false otherwise.
 */
export const submitUrlToBingIndexNow = async (pageUrl: string): Promise<boolean> => {
  try {
    // Always use dicta-notes.com as the host for IndexNow
    const host = "dicta-notes.com";

    const payload: IndexNowSubmitUrlRequest = {
      host: host,
      url: pageUrl,
    };

    console.log("Submitting to Bing IndexNow via backend:", payload);
    const response = await brain.submit_url_to_bing(payload);

    if (response.ok) {
      const responseData = await response.json();
      console.log("Bing IndexNow submission response:", responseData);
      // IndexNow response structure includes status_code
      return responseData.status_code === 200 || responseData.status_code === 202;
    } else {
      const errorData = await response.text();
      console.error("Failed to submit URL to Bing IndexNow:", response.status, errorData);
      return false;
    }
  } catch (error) {
    console.error("Error calling Bing IndexNow submission endpoint:", error);
    return false;
  }
};
