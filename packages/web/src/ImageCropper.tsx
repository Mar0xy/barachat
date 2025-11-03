import { Component, createSignal, onMount, Show } from 'solid-js';

interface ImageCropperProps {
  imageUrl: string;
  onCrop: (croppedBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number; // width / height, e.g., 1 for square, 3 for 3:1 banner
  title?: string;
}

export const ImageCropper: Component<ImageCropperProps> = (props) => {
  let canvasRef: HTMLCanvasElement | undefined;
  let imageRef: HTMLImageElement | undefined;

  const [isDragging, setIsDragging] = createSignal(false);
  const [cropArea, setCropArea] = createSignal({
    x: 50,
    y: 50,
    width: 200,
    height: 200
  });
  const [imageLoaded, setImageLoaded] = createSignal(false);
  const [imageSize, setImageSize] = createSignal({ width: 0, height: 0 });

  // Default to square (1:1) if no aspect ratio provided
  const effectiveAspectRatio = () => props.aspectRatio || 1;

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
        const aspectRatio = effectiveAspectRatio();
        let initialWidth: number;
        let initialHeight: number;

        if (aspectRatio >= 1) {
          // Wider or square crop
          initialWidth = Math.min(width * 0.8, height * 0.8 * aspectRatio);
          initialHeight = initialWidth / aspectRatio;
        } else {
          // Taller crop
          initialHeight = Math.min(height * 0.8, width * 0.8 / aspectRatio);
          initialWidth = initialHeight * aspectRatio;
        }

        setCropArea({
          x: (width - initialWidth) / 2,
          y: (height - initialHeight) / 2,
          width: initialWidth,
          height: initialHeight
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
    ctx.clearRect(crop.x, crop.y, crop.width, crop.height);
    ctx.drawImage(
      imageRef!,
      (crop.x / width) * imageRef!.naturalWidth,
      (crop.y / height) * imageRef!.naturalHeight,
      (crop.width / width) * imageRef!.naturalWidth,
      (crop.height / height) * imageRef!.naturalHeight,
      crop.x,
      crop.y,
      crop.width,
      crop.height
    );

    // Draw border around crop area
    ctx.strokeStyle = '#5865F2';
    ctx.lineWidth = 2;
    ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);

    // Draw resize handles
    const handleSize = 10;
    ctx.fillStyle = '#5865F2';
    // Corner handles
    ctx.fillRect(crop.x - handleSize / 2, crop.y - handleSize / 2, handleSize, handleSize);
    ctx.fillRect(
      crop.x + crop.width - handleSize / 2,
      crop.y - handleSize / 2,
      handleSize,
      handleSize
    );
    ctx.fillRect(
      crop.x - handleSize / 2,
      crop.y + crop.height - handleSize / 2,
      handleSize,
      handleSize
    );
    ctx.fillRect(
      crop.x + crop.width - handleSize / 2,
      crop.y + crop.height - handleSize / 2,
      handleSize,
      handleSize
    );
  };

  const handleMouseDown = (e: MouseEvent) => {
    const canvas = canvasRef;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const crop = cropArea();

    // Check if clicking inside crop area
    if (
      x >= crop.x &&
      x <= crop.x + crop.width &&
      y >= crop.y &&
      y <= crop.y + crop.height
    ) {
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
    let newX = x - crop.width / 2;
    let newY = y - crop.height / 2;

    // Keep crop within bounds
    newX = Math.max(0, Math.min(newX, width - crop.width));
    newY = Math.max(0, Math.min(newY, height - crop.height));

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
    const aspectRatio = effectiveAspectRatio();

    // Adjust size with mouse wheel
    const delta = e.deltaY > 0 ? -10 : 10;
    let newWidth = crop.width + delta;
    let newHeight = newWidth / aspectRatio;

    // Constrain to image bounds
    const maxWidth = width;
    const maxHeight = height;
    
    if (newWidth > maxWidth || newHeight > maxHeight) {
      const scale = Math.min(maxWidth / newWidth, maxHeight / newHeight);
      newWidth *= scale;
      newHeight *= scale;
    }

    const minWidth = 50;
    const minHeight = minWidth / aspectRatio;
    
    if (newWidth < minWidth) {
      newWidth = minWidth;
      newHeight = minHeight;
    }

    // Keep crop centered when resizing
    const deltaWidth = newWidth - crop.width;
    const deltaHeight = newHeight - crop.height;
    let newX = crop.x - deltaWidth / 2;
    let newY = crop.y - deltaHeight / 2;

    // Keep within bounds
    newX = Math.max(0, Math.min(newX, width - newWidth));
    newY = Math.max(0, Math.min(newY, height - newHeight));

    setCropArea({ x: newX, y: newY, width: newWidth, height: newHeight });
    drawCanvas();
  };

  const handleCrop = async () => {
    if (!imageRef || !imageLoaded()) return;

    const crop = cropArea();
    const { width, height } = imageSize();

    // Create a new canvas for the cropped image
    const cropCanvas = document.createElement('canvas');
    const aspectRatio = effectiveAspectRatio();
    
    // For banners (wide aspect), use higher resolution; for avatars (square), use 256
    const outputHeight = aspectRatio >= 2 ? 200 : 256;
    const outputWidth = outputHeight * aspectRatio;
    
    cropCanvas.width = outputWidth;
    cropCanvas.height = outputHeight;

    const ctx = cropCanvas.getContext('2d');
    if (!ctx) return;

    // Calculate source rectangle in original image
    const scaleX = imageRef.naturalWidth / width;
    const scaleY = imageRef.naturalHeight / height;

    const sourceX = crop.x * scaleX;
    const sourceY = crop.y * scaleY;
    const sourceWidth = crop.width * scaleX;
    const sourceHeight = crop.height * scaleY;

    // Draw cropped portion
    ctx.drawImage(
      imageRef,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      outputWidth,
      outputHeight
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
          <button class="modal-close" onClick={props.onCancel}>
            ×
          </button>
        </div>
        <div class="modal-body cropper-body">
          <div class="cropper-container">
            <img ref={imageRef} src={props.imageUrl} alt="Crop preview" style="display: none;" />
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
