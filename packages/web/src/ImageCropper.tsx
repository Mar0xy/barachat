import { Component, createSignal, onMount, Show } from 'solid-js';

interface ImageCropperProps {
  imageUrl: string;
  onCrop: (croppedBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
  title?: string;
}

export const ImageCropper: Component<ImageCropperProps> = (props) => {
  let canvasRef: HTMLCanvasElement | undefined;
  let imageRef: HTMLImageElement | undefined;
  
  const [isDragging, setIsDragging] = createSignal(false);
  const [cropArea, setCropArea] = createSignal({
    x: 50,
    y: 50,
    size: 200
  });
  const [imageLoaded, setImageLoaded] = createSignal(false);
  const [imageSize, setImageSize] = createSignal({ width: 0, height: 0 });

  // aspectRatio could be used for non-square crops in future
  // const aspectRatio = props.aspectRatio || 1; // Default to square

  onMount(() => {
    if (imageRef) {
      imageRef.onload = () => {
        const img = imageRef!;
        const maxWidth = 400;
        const maxHeight = 400;
        
        let width = img.naturalWidth;
        let height = img.naturalHeight;
        
        // Scale down if too large
        if (width > maxWidth || height > maxHeight) {
          const scale = Math.min(maxWidth / width, maxHeight / height);
          width = width * scale;
          height = height * scale;
        }
        
        setImageSize({ width, height });
        
        // Initialize crop area in center
        const minDimension = Math.min(width, height);
        const initialSize = minDimension * 0.8;
        setCropArea({
          x: (width - initialSize) / 2,
          y: (height - initialSize) / 2,
          size: initialSize
        });
        
        setImageLoaded(true);
        drawCanvas();
      };
    }
  });

  const drawCanvas = () => {
    if (!canvasRef || !imageRef || !imageLoaded()) return;
    
    const canvas = canvasRef;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = imageSize();
    canvas.width = width;
    canvas.height = height;
    
    // Draw the image
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(imageRef!, 0, 0, width, height);
    
    // Draw overlay (darken non-cropped areas)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, width, height);
    
    // Clear the crop area
    const crop = cropArea();
    ctx.clearRect(crop.x, crop.y, crop.size, crop.size);
    ctx.drawImage(
      imageRef!,
      (crop.x / width) * imageRef!.naturalWidth,
      (crop.y / height) * imageRef!.naturalHeight,
      (crop.size / width) * imageRef!.naturalWidth,
      (crop.size / height) * imageRef!.naturalHeight,
      crop.x,
      crop.y,
      crop.size,
      crop.size
    );
    
    // Draw border around crop area
    ctx.strokeStyle = '#5865F2';
    ctx.lineWidth = 2;
    ctx.strokeRect(crop.x, crop.y, crop.size, crop.size);
    
    // Draw resize handles
    const handleSize = 10;
    ctx.fillStyle = '#5865F2';
    // Corner handles
    ctx.fillRect(crop.x - handleSize/2, crop.y - handleSize/2, handleSize, handleSize);
    ctx.fillRect(crop.x + crop.size - handleSize/2, crop.y - handleSize/2, handleSize, handleSize);
    ctx.fillRect(crop.x - handleSize/2, crop.y + crop.size - handleSize/2, handleSize, handleSize);
    ctx.fillRect(crop.x + crop.size - handleSize/2, crop.y + crop.size - handleSize/2, handleSize, handleSize);
  };

  const handleMouseDown = (e: MouseEvent) => {
    const canvas = canvasRef;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const crop = cropArea();
    
    // Check if clicking inside crop area
    if (x >= crop.x && x <= crop.x + crop.size &&
        y >= crop.y && y <= crop.y + crop.size) {
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging() || !canvasRef) return;
    
    const rect = canvasRef.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const crop = cropArea();
    const { width, height } = imageSize();
    
    // Update crop position
    let newX = x - crop.size / 2;
    let newY = y - crop.size / 2;
    
    // Keep crop within bounds
    newX = Math.max(0, Math.min(newX, width - crop.size));
    newY = Math.max(0, Math.min(newY, height - crop.size));
    
    setCropArea({ ...crop, x: newX, y: newY });
    drawCanvas();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    
    const crop = cropArea();
    const { width, height } = imageSize();
    
    // Adjust size with mouse wheel
    const delta = e.deltaY > 0 ? -10 : 10;
    let newSize = crop.size + delta;
    
    const maxSize = Math.min(width, height);
    newSize = Math.max(50, Math.min(newSize, maxSize));
    
    // Keep crop centered when resizing
    const deltaSize = newSize - crop.size;
    let newX = crop.x - deltaSize / 2;
    let newY = crop.y - deltaSize / 2;
    
    // Keep within bounds
    newX = Math.max(0, Math.min(newX, width - newSize));
    newY = Math.max(0, Math.min(newY, height - newSize));
    
    setCropArea({ x: newX, y: newY, size: newSize });
    drawCanvas();
  };

  const handleCrop = async () => {
    if (!imageRef || !imageLoaded()) return;
    
    const crop = cropArea();
    const { width, height } = imageSize();
    
    // Create a new canvas for the cropped image
    const cropCanvas = document.createElement('canvas');
    const outputSize = 256; // Output resolution
    cropCanvas.width = outputSize;
    cropCanvas.height = outputSize;
    
    const ctx = cropCanvas.getContext('2d');
    if (!ctx) return;
    
    // Calculate source rectangle in original image
    const scaleX = imageRef.naturalWidth / width;
    const scaleY = imageRef.naturalHeight / height;
    
    const sourceX = crop.x * scaleX;
    const sourceY = crop.y * scaleY;
    const sourceSize = crop.size * scaleX;
    
    // Draw cropped portion
    ctx.drawImage(
      imageRef,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      outputSize,
      outputSize
    );
    
    // Convert to blob
    cropCanvas.toBlob((blob) => {
      if (blob) {
        props.onCrop(blob);
      }
    }, 'image/png');
  };

  return (
    <div class="modal-overlay" onClick={props.onCancel}>
      <div class="modal cropper-modal" onClick={(e) => e.stopPropagation()}>
        <div class="modal-header">
          <h2>{props.title || 'Crop Image'}</h2>
          <button class="modal-close" onClick={props.onCancel}>×</button>
        </div>
        <div class="modal-body cropper-body">
          <div class="cropper-container">
            <img
              ref={imageRef}
              src={props.imageUrl}
              alt="Crop preview"
              style="display: none;"
            />
            <Show when={imageLoaded()}>
              <canvas
                ref={canvasRef}
                class="cropper-canvas"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
              />
              <div class="cropper-instructions">
                <p>• Click and drag to move the crop area</p>
                <p>• Use mouse wheel to resize</p>
              </div>
            </Show>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="button-secondary" onClick={props.onCancel}>
            Cancel
          </button>
          <button type="button" class="button-primary" onClick={handleCrop}>
            Crop & Upload
          </button>
        </div>
      </div>
    </div>
  );
};
