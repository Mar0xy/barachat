import { Component, createSignal, Show } from 'solid-js';
import { ImageCropper } from '../ImageCropper';
import { API_URL } from '../utils/constants';

interface ProfileImageUploaderProps {
  currentAvatar?: string;
  currentBanner?: string;
  onAvatarUpdate: (url: string) => void;
  onBannerUpdate: (url: string) => void;
}

export const ProfileImageUploader: Component<ProfileImageUploaderProps> = (props) => {
  const [uploading, setUploading] = createSignal(false);
  const [uploadingBanner, setUploadingBanner] = createSignal(false);
  const [cropImageUrl, setCropImageUrl] = createSignal<string | null>(null);
  const [cropBannerUrl, setCropBannerUrl] = createSignal<string | null>(null);

  const handleFileSelect = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setCropImageUrl(result);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleBannerFileSelect = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setCropBannerUrl(result);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleCroppedImage = async (blob: Blob) => {
    setUploading(true);
    setCropImageUrl(null);

    const formData = new FormData();
    formData.append('avatar', blob, 'avatar.png');

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/upload/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        props.onAvatarUpdate(data.url);
      } else {
        console.error('Failed to upload avatar');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleCroppedBanner = async (blob: Blob) => {
    setUploadingBanner(true);
    setCropBannerUrl(null);

    const formData = new FormData();
    formData.append('banner', blob, 'banner.png');

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/upload/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        props.onBannerUpdate(data.url);
      } else {
        console.error('Failed to upload banner');
      }
    } catch (error) {
      console.error('Error uploading banner:', error);
    } finally {
      setUploadingBanner(false);
    }
  };

  return (
    <>
      <Show when={cropImageUrl()}>
        <ImageCropper
          imageUrl={cropImageUrl()!}
          onCrop={handleCroppedImage}
          onCancel={() => setCropImageUrl(null)}
          aspectRatio={1}
          cropShape="round"
        />
      </Show>

      <Show when={cropBannerUrl()}>
        <ImageCropper
          imageUrl={cropBannerUrl()!}
          onCrop={handleCroppedBanner}
          onCancel={() => setCropBannerUrl(null)}
          aspectRatio={3}
          cropShape="rect"
        />
      </Show>

      <label>
        Avatar
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading()}
        />
        <Show when={uploading()}>
          <p class="upload-status">Uploading avatar...</p>
        </Show>
      </label>

      <Show when={props.currentAvatar}>
        <div class="avatar-preview">
          <p>Current Avatar:</p>
          <img src={props.currentAvatar} alt="Avatar" class="preview-image" />
        </div>
      </Show>

      <label>
        Banner
        <input
          type="file"
          accept="image/*"
          onChange={handleBannerFileSelect}
          disabled={uploadingBanner()}
        />
        <Show when={uploadingBanner()}>
          <p class="upload-status">Uploading banner...</p>
        </Show>
      </label>

      <Show when={props.currentBanner}>
        <div class="banner-preview">
          <p>Current Banner:</p>
          <img src={props.currentBanner} alt="Banner" class="preview-image-banner" />
        </div>
      </Show>
    </>
  );
};
