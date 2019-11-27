export class DiPreviewImage {
  url: string;
  width: number;
  height: number;
  error: string;

  image: HTMLImageElement;
  displayImage: DiPreviewImage;

  constructor(url: string, width: number, height: number, private changeFunc: (image: DiPreviewImage) => void) {
    this.url = url;
    this.width = width;
    this.height = height;

    this.beginLoading();
  }

  beginLoading() {
    this.image = new Image();

    this.image.onload = () => {
      this.displayImage = this;
      this.changeFunc(this);
    };

    this.image.onerror = () => {
      this.error = 'Not available.';
      if (this.displayImage) {
        this.displayImage.error = 'Not available.';
      }
      this.changeFunc(this);
    };

    this.image.src = this.url;
    this.image.style.width = this.width + 'px';
    this.image.style.height = this.height + 'px';
  }

  preferred(): DiPreviewImage {
    return (this.displayImage == null) ? this : this.displayImage;
  }

  preferredImage(): HTMLImageElement {
    if (this.displayImage == null && this.error) {
      return null;
    }
    return this.preferred().image;
  }
}
