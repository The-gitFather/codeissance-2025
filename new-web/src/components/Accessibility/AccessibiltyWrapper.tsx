"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Accessibility,
  Link,
  ZoomIn,
  ZoomOut,
  StretchHorizontal,
  ImageOff,
  BookOpen,
  VideoOff,
} from "lucide-react";
import LanguageSelect from "./LanguageSelect";

export default function AccessibilityMenuWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isLinksHighlighted, setIsLinksHighlighted] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [textSpacing, setTextSpacing] = useState(0);
  const [areImagesHidden, setAreImagesHidden] = useState(false);
  const [isDyslexiaMode, setIsDyslexiaMode] = useState(false);
  const [areVideosHidden, setAreVideosHidden] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Load state from localStorage
  useEffect(() => {
    const storedFontSize = localStorage.getItem("fontSize");
    const storedTextSpacing = localStorage.getItem("textSpacing");
    const storedHighContrast = localStorage.getItem("isHighContrast");
    const storedLinksHighlighted = localStorage.getItem("isLinksHighlighted");
    const storedImagesHidden = localStorage.getItem("areImagesHidden");
    const storedDyslexiaMode = localStorage.getItem("isDyslexiaMode");
    const storedVideosHidden = localStorage.getItem("areVideosHidden");

    if (storedFontSize) setFontSize(Number(storedFontSize));
    if (storedTextSpacing) setTextSpacing(Number(storedTextSpacing));
    if (storedHighContrast) setIsHighContrast(storedHighContrast === "true");
    if (storedLinksHighlighted)
      setIsLinksHighlighted(storedLinksHighlighted === "true");
    if (storedImagesHidden) setAreImagesHidden(storedImagesHidden === "true");
    if (storedDyslexiaMode) setIsDyslexiaMode(storedDyslexiaMode === "true");
    if (storedVideosHidden) setAreVideosHidden(storedVideosHidden === "true");
  }, []);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem("fontSize", JSON.stringify(fontSize));
    localStorage.setItem("textSpacing", JSON.stringify(textSpacing));
    localStorage.setItem("isHighContrast", JSON.stringify(isHighContrast));
    localStorage.setItem("isLinksHighlighted", JSON.stringify(isLinksHighlighted));
    localStorage.setItem("areImagesHidden", JSON.stringify(areImagesHidden));
    localStorage.setItem("isDyslexiaMode", JSON.stringify(isDyslexiaMode));
    localStorage.setItem("areVideosHidden", JSON.stringify(areVideosHidden));
  }, [
    fontSize,
    textSpacing,
    isHighContrast,
    isLinksHighlighted,
    areImagesHidden,
    isDyslexiaMode,
    areVideosHidden,
  ]);

  useEffect(() => {
    document.documentElement.style.setProperty("--font-size", `${fontSize}px`);
    document.documentElement.style.setProperty("--text-spacing", `${textSpacing}`);
    document.documentElement.classList.toggle("high-contrast", isHighContrast);
    document.documentElement.classList.toggle("links-highlighted", isLinksHighlighted);
    document.documentElement.classList.toggle("images-hidden", areImagesHidden);
    document.documentElement.classList.toggle("videos-hidden", areVideosHidden);
    document.body.classList.toggle("dyslexia-mode", isDyslexiaMode);
  }, [
    fontSize,
    textSpacing,
    isHighContrast,
    isLinksHighlighted,
    areImagesHidden,
    isDyslexiaMode,
    areVideosHidden,
  ]);

  const handleOpenChange = (open) => {
    setIsOpen(open);
  };

  return (
    <div>
      <Popover onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            className={`fixed bottom-6 right-6 w-[60px] h-[60px] rounded-full p-3 z-50 bg-blue-600 hover:bg-blue-700 text-white ${isOpen ? "animate-pulse" : ""
              } transition-all duration-300 ease-in-out`}
            aria-label="Accessibility options"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              transform: isHovered ? "scale(1.1)" : "scale(1)",
              boxShadow: isHovered ? "0 0 15px rgba(37, 99, 235, 0.8)" : "0 0 5px rgba(0, 0, 0, 0.2)",
            }}
          >
            <Accessibility
              style={{
                width: '25px',
                height: '25px',
                transform: isHovered ? "rotate(15deg)" : "rotate(0deg)",
                transition: "transform 0.3s ease-in-out"
              }}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 m-4 animate-fadeIn">
          <h2 className="text-lg font-semibold mb-4">Accessibility Options</h2>
          <div className="space-y-4">
            <Toggle
              aria-label="High contrast"
              pressed={isHighContrast}
              onPressedChange={setIsHighContrast}
              className="transition-transform hover:scale-105"
            >
              High Contrast
            </Toggle>

            <Toggle
              aria-label="Highlight links"
              pressed={isLinksHighlighted}
              onPressedChange={setIsLinksHighlighted}
              className="transition-transform hover:scale-105"
            >
              <Link className="h-4 w-4 mr-2" />
              Highlight Links
            </Toggle>

            <div>
              <label htmlFor="font-size" className="block text-sm font-medium mb-1">
                Font Size
              </label>
              <div className="flex items-center space-x-2">
                <ZoomOut className="h-4 w-4" />
                <Slider
                  id="font-size"
                  min={12}
                  max={24}
                  step={1}
                  value={[fontSize]}
                  onValueChange={(value) => setFontSize(value[0])}
                  className="flex-1"
                />
                <ZoomIn className="h-4 w-4" />
              </div>
            </div>

            <div>
              <label htmlFor="text-spacing" className="block text-sm font-medium mb-1">
                Text Spacing
              </label>
              <div className="flex items-center space-x-2">
                <StretchHorizontal className="h-4 w-4" />
                <Slider
                  id="text-spacing"
                  min={0}
                  max={10}
                  step={1}
                  value={[textSpacing]}
                  onValueChange={(value) => setTextSpacing(value[0])}
                  className="flex-1"
                />
              </div>
            </div>

            <Separator />

            <Toggle
              aria-label="Hide images"
              pressed={areImagesHidden}
              onPressedChange={setAreImagesHidden}
              className="transition-transform hover:scale-105"
            >
              <ImageOff className="h-4 w-4 mr-2" />
              Hide Images
            </Toggle>

            <Toggle
              aria-label="Dyslexia friendly"
              pressed={isDyslexiaMode}
              onPressedChange={setIsDyslexiaMode}
              className="transition-transform hover:scale-105"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Dyslexia Friendly
            </Toggle>

            <Toggle
              aria-label="Hide videos"
              pressed={areVideosHidden}
              onPressedChange={setAreVideosHidden}
              className="transition-transform hover:scale-105"
            >
              <VideoOff className="h-4 w-4 mr-2" />
              Hide Videos
            </Toggle>
            <LanguageSelect />
          </div>
        </PopoverContent>
      </Popover>

      <main className="accessibility-content">{children}</main>

      <style jsx global>{`
        :root {
          --font-size: 16px;
          --text-spacing: 0;
        }
        
        body {
          font-size: var(--font-size);
        }
        
        .accessibility-content {
          letter-spacing: calc(var(--text-spacing) * 0.1em);
          word-spacing: calc(var(--text-spacing) * 0.2em);
        }

        .high-contrast {
          filter: contrast(150%);
        }
        
        .links-highlighted a {
          background-color: yellow;
          color: black;
        }
        
        .images-hidden img {
          display: none;
        }
        
        .videos-hidden video {
          display: none;
        }
        
        .dyslexia-mode * {
          font-family: "Open Dyslexic", sans-serif;
          word-spacing: 0.35em;
          letter-spacing: 0.12em;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
        }
        
        .animate-pulse {
          animation: pulse 1.5s infinite;
        }
      `}</style>
    </div>
  );
}