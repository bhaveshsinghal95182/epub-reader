"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { useLocalStorage } from "@/hooks/use-local-storage"

interface ReaderSettingsProps {
  onClose: () => void
}

export function ReaderSettings({ onClose }: ReaderSettingsProps) {
  const [fontSize, setFontSize] = useLocalStorage("epub-font-size", "100")
  const [fontFamily, setFontFamily] = useLocalStorage("epub-font-family", "serif")

  return (
    <div className="container mx-auto px-4 mb-4">
      <div className="bg-white dark:bg-[#333333] p-4 rounded-lg border-2 border-[#222222] dark:border-[#F5F5F5] shadow-[5px_5px_0px_rgba(0,0,0,0.9)] dark:shadow-[5px_5px_0px_rgba(255,255,255,0.9)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg font-bold">Reader Settings</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-2">Font Size</h4>
            <div className="flex items-center gap-4">
              <span className="text-sm">A</span>
              <Slider
                value={[Number.parseInt(fontSize)]}
                min={50}
                max={200}
                step={10}
                onValueChange={(value) => setFontSize(value[0].toString())}
                className="flex-1"
              />
              <span className="text-lg">A</span>
            </div>
            <div className="text-center mt-1 text-sm">{fontSize}%</div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Font Family</h4>
            <RadioGroup
              value={fontFamily}
              onValueChange={setFontFamily}
              className="grid grid-cols-1 sm:grid-cols-2 gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="serif" id="serif" />
                <Label htmlFor="serif" className="font-serif">
                  Serif
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sans-serif" id="sans-serif" />
                <Label htmlFor="sans-serif" className="font-sans">
                  Sans-serif
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monospace" id="monospace" />
                <Label htmlFor="monospace" className="font-mono">
                  Monospace
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system-ui" id="system-ui" />
                <Label htmlFor="system-ui">System UI</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>
    </div>
  )
}

