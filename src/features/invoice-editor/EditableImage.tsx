import React, { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Trash2, Upload, Crop as CropIcon, Image as ImageIcon } from "lucide-react";
import Cropper from "react-easy-crop";
import { motion, AnimatePresence } from "framer-motion";

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return "";
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL("image/png");
};

export const EditableImage = ({
  value,
  onChange,
  className,
  style,
  placeholder = "Upload Image",
  isEditing = true,
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  isEditing?: boolean;
}) => {
  const [openPopover, setOpenPopover] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIsUploading(true);
      
      // Simulate upload delay for animation
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result?.toString() || null);
        setIsUploading(false);
      });
      reader.readAsDataURL(file);
    }
  };

  const showSaveCrop = async () => {
    try {
      if (!imageSrc || !croppedAreaPixels) return;
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onChange(croppedImage);
      setImageSrc(null); // Clear cropper state
      setOpenPopover(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClear = () => {
    onChange("");
    setImageSrc(null);
    setOpenPopover(false);
  };

  if (!isEditing) {
    if (!value) return null;
    return (
      <img src={value} alt="Signature" style={style} className={cn("max-w-full max-h-full object-contain", className)} />
    );
  }

  return (
    <Popover 
      open={openPopover} 
      onOpenChange={(open) => {
        // Prevent closing by accident if we are currently cropping an image
        if (!open && imageSrc) return;
        setOpenPopover(open);
      }}
    >
      <div
        data-editable-field="true"
        onDoubleClick={(e) => {
          e.stopPropagation();
          setOpenPopover(true);
        }}
        className={cn(
          "cursor-pointer hover:ring-1 hover:ring-black/10 rounded-md transition-all border border-dashed border-transparent hover:border-black/20 overflow-hidden relative group/image",
          "flex items-center justify-center min-h-[40px] min-w-[80px]",
          !value && "bg-black/5 text-black/40 border-black/10 hover:bg-black/10",
          className
        )}
        style={style}
      >
        <PopoverTrigger render={<button type="button" className="absolute inset-0 opacity-0 pointer-events-none z-[-1]" />}>
          
        </PopoverTrigger>
        
        {value ? (
          <img src={value} alt="Signature" className="max-w-full max-h-full object-contain pointer-events-none" />
        ) : (
          <div className="flex flex-col items-center justify-center p-2">
            <ImageIcon className="w-5 h-5 mb-1 opacity-50" />
            <span className="text-[10px] uppercase font-semibold opacity-50">{placeholder}</span>
          </div>
        )}
        
        <div className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover/image:opacity-100 flex items-center justify-center transition-opacity">
          <span className="text-xs font-medium">Double click to edit</span>
        </div>
      </div>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-72 p-2 bg-background border-border shadow-xl rounded-lg animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-2 z-50 flex flex-col gap-2"
      >
        <AnimatePresence mode="wait">
          {!imageSrc ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-2"
            >
              <div 
                className={cn(
                  "border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center text-center transition-colors cursor-pointer",
                  isUploading ? "border-primary/50 bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted"
                )}
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/jpg"
                  className="hidden"
                />
                
                {isUploading ? (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center gap-2 text-primary"
                  >
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Upload className="w-8 h-8" />
                    </motion.div>
                    <span className="text-xs font-medium">Processing Image...</span>
                  </motion.div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2 text-primary">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium mb-1">Click to Upload</p>
                    <p className="text-[10px] text-muted-foreground">PNG, JPG up to 5MB</p>
                  </>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="crop"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col"
            >
              <div className="relative w-full h-48 bg-black/5 rounded-md overflow-hidden mb-2">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={21 / 9} // General aspect ratio for signatures
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  showGrid={false}
                />
              </div>
              
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-[10px] font-medium text-muted-foreground">Zoom</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => setImageSrc(null)}>
                  Cancel
                </Button>
                <Button size="sm" className="flex-1 text-xs h-8" onClick={showSaveCrop}>
                  <CropIcon className="w-3 h-3 mr-1" /> Save Crop
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Actions */}
        {!imageSrc && (
          <div className="flex items-center justify-between pt-2 border-t mt-1">
            <Button variant="ghost" size="sm" onClick={handleClear} className="h-7 text-xs px-2 text-red-500 hover:text-red-600 hover:bg-red-50">
              <Trash2 className="w-3 h-3 mr-1" /> Clear
            </Button>
            <Button size="sm" onClick={() => setOpenPopover(false)} className="h-7 px-3 text-xs">
              Done
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
