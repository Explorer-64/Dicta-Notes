import react from "@vitejs/plugin-react";
import "dotenv/config";
import { defineConfig, splitVendorChunkPlugin } from "vite";
import injectHTML from "vite-plugin-html-inject";
import tsConfigPaths from "vite-tsconfig-paths";

type Extension = {
	name: string;
	version: string;
	config: Record<string, unknown>;
};

enum ExtensionName {
	FIREBASE_AUTH = "firebase-auth",
	STACK_AUTH = "stack-auth"
}

const listExtensions = (): Extension[] => {
	// Extract Firebase config from environment or DATABUTTON_EXTENSIONS for backward compatibility
	if (process.env.DATABUTTON_EXTENSIONS) {
		try {
			return JSON.parse(process.env.DATABUTTON_EXTENSIONS) as Extension[];
		} catch (err: unknown) {
			console.error("Error parsing DATABUTTON_EXTENSIONS", err);
			console.error(process.env.DATABUTTON_EXTENSIONS);
		}
	}
	
	// Try to get Firebase config from VITE_FIREBASE_CONFIG
	if (process.env.VITE_FIREBASE_CONFIG) {
		try {
			const firebaseConfig = JSON.parse(process.env.VITE_FIREBASE_CONFIG);
			return [{
				name: "firebase-auth",
				version: "1",
				config: {
					firebaseConfig,
					signInOptions: {
						google: true,
						github: false,
						facebook: false,
						twitter: false,
						emailAndPassword: true,
						magicLink: false,
					},
					siteName: "Dicta-Notes",
					signInSuccessUrl: "/",
					tosLink: "/terms",
					privacyPolicyLink: "/privacy",
				}
			}];
		} catch (err) {
			console.error("Error parsing VITE_FIREBASE_CONFIG", err);
		}
	}

	return [];
};

const extensions = listExtensions();

const getExtensionConfig = (name: string): string => {
	const extension = extensions.find((it) => it.name === name);

	if (!extension) {
		console.warn(`Extension ${name} not found`);
	}

	return JSON.stringify(extension?.config);
};

const buildVariables = () => {
const appId = process.env.DATABUTTON_PROJECT_ID || process.env.VITE_APP_ID || "dicta-notes";
		const apiUrl = process.env.VITE_API_URL || "http://localhost:8000";
		const wsApiUrl = process.env.VITE_WS_API_URL || "ws://localhost:8000";

	const defines: Record<string, string> = {
		__APP_ID__: JSON.stringify(appId),
		__API_PATH__: JSON.stringify(""),
		__API_HOST__: JSON.stringify(""),
		__API_PREFIX_PATH__: JSON.stringify(""),
		__API_URL__: JSON.stringify(apiUrl),
		__WS_API_URL__: JSON.stringify(wsApiUrl),
		__APP_BASE_PATH__: JSON.stringify("/"),
		__APP_TITLE__: JSON.stringify("Dicta-Notes"),
		__APP_FAVICON_LIGHT__: JSON.stringify("/favicon-light.svg"),
		__APP_FAVICON_DARK__: JSON.stringify("/favicon-dark.svg"),
		__APP_DEPLOY_USERNAME__: JSON.stringify(""),
		__APP_DEPLOY_APPNAME__: JSON.stringify(""),
		__APP_DEPLOY_CUSTOM_DOMAIN__: JSON.stringify(""),
		__STACK_AUTH_CONFIG__: JSON.stringify(getExtensionConfig(ExtensionName.STACK_AUTH)),
		__FIREBASE_CONFIG__: JSON.stringify(
			getExtensionConfig(ExtensionName.FIREBASE_AUTH),
		),
	};

	return defines;
};

// https://vite.dev/config/
export default defineConfig({
	define: buildVariables(),
	plugins: [react(), splitVendorChunkPlugin(), tsConfigPaths(), injectHTML()],
	server: {
		port: 3000, // Start from port 3000, will auto-increment if unavailable
		strictPort: false, // Automatically find next available port if port is taken
		open: false, // Don't auto-open browser
		proxy: {
			"/routes": {
				target: "http://127.0.0.1:8000",
				changeOrigin: true,
			},
		},
	},
	// Path aliases are handled by vite-tsconfig-paths plugin from tsconfig.json
	// Do NOT add a generic "@" alias here — it overrides the specific
	// @/components/ui/* → extensions/shadcn/components/* mapping in tsconfig.
});
