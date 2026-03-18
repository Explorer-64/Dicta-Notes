import React from 'react';
import { useTheme } from '../components/ThemeProvider';
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sun, Moon, Monitor } from "lucide-react";

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-2">Theme</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose between light, dark, or system theme for the application.
        </p>
      </div>
      
      <RadioGroup 
        value={theme} 
        onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="flex items-center space-x-2 rounded-md border p-4 cursor-pointer hover:bg-accent">
          <RadioGroupItem value="light" id="theme-light" className="sr-only" />
          <Label 
            htmlFor="theme-light" 
            className="flex items-center gap-3 w-full cursor-pointer"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Sun className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Light</p>
              <p className="text-sm text-muted-foreground">Use light theme</p>
            </div>
          </Label>
        </div>
        
        <div className="flex items-center space-x-2 rounded-md border p-4 cursor-pointer hover:bg-accent">
          <RadioGroupItem value="dark" id="theme-dark" className="sr-only" />
          <Label 
            htmlFor="theme-dark" 
            className="flex items-center gap-3 w-full cursor-pointer"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Moon className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Dark</p>
              <p className="text-sm text-muted-foreground">Use dark theme</p>
            </div>
          </Label>
        </div>
        
        <div className="flex items-center space-x-2 rounded-md border p-4 cursor-pointer hover:bg-accent">
          <RadioGroupItem value="system" id="theme-system" className="sr-only" />
          <Label 
            htmlFor="theme-system" 
            className="flex items-center gap-3 w-full cursor-pointer"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Monitor className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">System</p>
              <p className="text-sm text-muted-foreground">Follow system theme</p>
            </div>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};
