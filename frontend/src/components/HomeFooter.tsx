import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Footer component for the Home page
 * Uses React Router Link for internal navigation to avoid page reloads
 */
export function HomeFooter() {
  return (
    <footer className="py-8 sm:py-12 border-t mt-auto bg-gray-50 dark:bg-gray-900" role="contentinfo">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Column 1: Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-foreground">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-foreground">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-foreground">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Solutions */}
          <div>
            <h3 className="font-semibold mb-4">Solutions</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/multilingual-meetings" className="text-muted-foreground hover:text-foreground">
                  Multilingual Teams
                </Link>
              </li>
              <li>
                <Link to="/remote-teams" className="text-muted-foreground hover:text-foreground">
                  Remote Teams
                </Link>
              </li>
              <li>
                <Link to="/education" className="text-muted-foreground hover:text-foreground">
                  Education
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/instructions" className="text-muted-foreground hover:text-foreground">
                  Getting Started
                </Link>
              </li>
              <li>
                <Link to="/fa-qs" className="text-muted-foreground hover:text-foreground">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/install" className="text-muted-foreground hover:text-foreground">
                  Install Guide
                </Link>
              </li>
              <li>
                <Link to="/for-ai-assistants" className="text-muted-foreground hover:text-foreground">
                  For AI Assistants
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/cookie-policy" className="text-muted-foreground hover:text-foreground">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-sm text-muted-foreground mb-4 sm:mb-0">
            <span className="font-semibold">Dicta-Notes</span> © {new Date().getFullYear()}
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="text-muted-foreground">
              Dicta-Notes
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
