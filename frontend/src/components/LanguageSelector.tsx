import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface LanguageSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  targetLanguage: string;
  setTargetLanguage: (language: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  isOpen,
  onClose,
  targetLanguage,
  setTargetLanguage,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent aria-describedby="language-dialog-description">
        <DialogHeader>
          <DialogTitle id="language-dialog-title">Translation Settings</DialogTitle>
          <DialogDescription id="language-dialog-description">
            Select the language you want to translate the transcription to.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="target-language">Target Language</Label>
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
                <SelectItem value="ko">Korean</SelectItem>
                <SelectItem value="zh">Chinese</SelectItem>
                {/* Add more supported languages here */}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={onClose} className="mt-4">
          Done
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default LanguageSelector;
