import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, Settings, LogOut, UserPlus, ArrowLeft, ChevronDown } from "lucide-react";
import { useCurrentUser, firebaseAuth } from "app";
import { toast } from "sonner";
import { GlobalTranslation } from "components/GlobalTranslation";


export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { user } = useCurrentUser();
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  
  // Check if device is iPhone on component mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsIOSDevice(/iPhone/.test(navigator.userAgent));
    }
  }, []);
  
  const isActive = (path: string) => location.pathname === path;
  
  const navigateTo = (path: string, options?: { state?: any }) => {
    navigate(path, options);
    setOpen(false);
  };
  
  const handleLogout = async () => {
    try {
      await firebaseAuth.signOut();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Failed to log out");
    }
    setOpen(false);
  };

  const shouldShowBackButton = () => {
    // Don't show back button on these paths
    const excludePaths = ["/", "/login", "/forgot-password"]; // Removed /signup
    return !excludePaths.includes(location.pathname);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-orange-50 to-amber-50 backdrop-blur supports-[backdrop-filter]:bg-gradient-to-r supports-[backdrop-filter]:from-orange-50/90 supports-[backdrop-filter]:to-amber-50/90 border-orange-200">
      <div className={`container flex items-center ${isIOSDevice ? 'h-24 pt-8' : 'h-14'}`}>
        {shouldShowBackButton() && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2" 
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="mr-4 flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}>
          <span className="font-bold text-xl bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Dicta-Notes</span>
        </div>
        
        {/* Mobile menu (hamburger) */}
        <div className="flex flex-1 items-center justify-end md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px]">
              <nav className="flex flex-col space-y-4 mt-6">
                <Button 
                  variant={isActive("/") ? "secondary" : "ghost"} 
                  onClick={() => navigateTo("/")}
                  className="justify-start"
                  data-translate
                >
                  Home
                </Button>
                <Button 
                  variant={isActive("/about") ? "secondary" : "ghost"} 
                  onClick={() => navigateTo("/about")}
                  className="justify-start"
                  data-translate
                >
                  About
                </Button>
                <Button 
                  variant={isActive("/transcribe") ? "secondary" : "ghost"} 
                  onClick={() => navigateTo("/transcribe")}
                  className="justify-start"
                  data-translate
                >
                  Transcribe
                </Button>
                <Button 
                  variant={isActive("/sessions") ? "secondary" : "ghost"} 
                  onClick={() => navigateTo("/sessions")}
                  className="justify-start"
                  data-translate
                >
                  Sessions
                </Button>
                
                {/* Mobile Translate with bold styling */}
                <div className="my-2">
                  <GlobalTranslation 
                    buttonVariant="outline" 
                    buttonSize="default" 
                    className="justify-start w-full font-bold border-2 border-primary text-primary" 
                  />
                </div>
                
                <Button 
                  variant={isActive("/contact") ? "secondary" : "ghost"} 
                  onClick={() => navigateTo("/contact")}
                  className="justify-start"
                  data-translate
                >
                  Contact
                </Button>
                <Button 
                  variant={isActive("/companies") ? "secondary" : "ghost"} 
                  onClick={() => navigateTo("/companies")}
                  className="justify-start"
                  data-translate
                >
                  Companies
                </Button>
                <Button 
                  variant={isActive("/instructions") ? "secondary" : "ghost"} 
                  onClick={() => navigateTo("/instructions")}
                  className="justify-start"
                  data-translate
                >
                  Instructions
                </Button>
                <Button 
                  variant={isActive("/ai-benefits") ? "secondary" : "ghost"} 
                  onClick={() => navigateTo("/ai-benefits")}
                  className="justify-start"
                  data-translate
                >
                  AI Benefits
                </Button>
                <Button
                  variant={isActive("/non-profit-solutions") ? "secondary" : "ghost"}
                  onClick={() => navigateTo("/non-profit-solutions")}
                  className="justify-start"
                  data-translate
                >
                  Non-Profit Solutions
                </Button>
                <Button
                  variant={isActive("/documents") ? "secondary" : "ghost"}
                  onClick={() => navigateTo("/documents")}
                  className="justify-start"
                  data-translate
                >
                  Documents
                </Button>

                <Button
                  variant={isActive("/settings") ? "secondary" : "ghost"} 
                  onClick={() => navigateTo("/settings")}
                  className="justify-start"
                  data-translate
                >
                  Settings
                </Button>
                
                {/* Mobile diagnostics link removed */}
                
                <div className="border-t my-2 pt-2">
                  {user ? (
                    <Button 
                      variant="ghost" 
                      onClick={handleLogout}
                      className="justify-start w-full"
                      data-translate
                    >
                      <LogOut className="h-4 w-4 mr-2" /> Sign Out
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      onClick={() => navigateTo("/login", { state: { mode: 'signUp' } })}
                      className="justify-start w-full"
                      data-translate
                    >
                      <UserPlus className="h-4 w-4 mr-2" /> Sign Up
                    </Button>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Desktop navigation */}
        <div className="hidden md:flex flex-1 items-center justify-end space-x-1">
          <nav className="flex items-center space-x-1">
            <Button
              variant={isActive("/sessions") ? "secondary" : "ghost"}
              onClick={() => navigate("/sessions")}
              data-translate
            >
              Sessions
            </Button>

            <div className="mx-1">
              <GlobalTranslation
                buttonVariant="outline"
                buttonSize="default"
                className="font-bold border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              />
            </div>

            {/* More dropdown for secondary nav items */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1" data-translate>
                  More <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/sessions")} data-translate>Sessions</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/")} data-translate>Home</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/about")} data-translate>About</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/transcribe")} data-translate>Transcribe</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/contact")} data-translate>Contact</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/companies")} data-translate>Companies</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/instructions")} data-translate>Instructions</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/ai-benefits")} data-translate>AI Benefits</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/non-profit-solutions")} data-translate>Non-Profit Solutions</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/documents")} data-translate>Documents</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant={isActive("/settings") ? "secondary" : "ghost"}
              onClick={() => navigate("/settings")}
              className="flex items-center gap-1"
              data-translate
            >
              <Settings size={16} />
              Settings
            </Button>

            <div className="border-l pl-2 ml-1 flex items-center">
              {user ? (
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="flex items-center gap-1"
                >
                  <LogOut className="h-4 w-4 mr-1" /> Sign Out
                </Button>
              ) : (
                <Button
                  variant="default"
                  onClick={() => navigate("/login", { state: { mode: 'signUp' } })}
                  className="flex items-center gap-1"
                >
                  <UserPlus className="h-4 w-4 mr-1" /> Sign Up
                </Button>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
