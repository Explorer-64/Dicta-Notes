import { API_PATH } from "../constants";
import { Brain } from "./Brain";
import type { RequestParams } from "./http-client";
import { auth } from "../app";

const constructBaseUrl = (): string => {
  // Dev: Vite proxy forwards /routes/** to localhost:8000
  // Prod: Firebase Hosting rewrites /routes/** to Cloud Run
  return `${window.location.origin}${API_PATH}`;
};

type BaseApiParams = Omit<RequestParams, "signal" | "baseUrl" | "cancelToken">;

const constructBaseApiParams = (): BaseApiParams => {
  return {
    credentials: "include",
    secure: true, // Enable security worker for all requests
  };
};

const securityWorker = async (securityData: any): Promise<RequestParams | void> => {
  try {
    // Get Firebase auth token
    const token = await auth.getAuthToken();
    if (token) {
      return {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
    } else {
      console.warn("No auth token available for API request");
    }
  } catch (error) {
    console.warn("Failed to get auth token for API request:", error);
    // Return void to proceed without auth (will fail with 401, but that's expected)
  }
};

const constructClient = () => {
  const baseUrl = constructBaseUrl();
  const baseApiParams = constructBaseApiParams();

  return new Brain({
    baseUrl,
    baseApiParams,
    securityWorker,
  });
};

const brain = constructClient();

export default brain;
