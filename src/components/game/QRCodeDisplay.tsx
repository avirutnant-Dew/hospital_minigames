import { QRCodeSVG } from "qrcode.react";

interface QRCodeDisplayProps {
  url: string;
  size?: number;
  title?: string;
}

export function QRCodeDisplay({ url, size = 200, title }: QRCodeDisplayProps) {
  return (
    <div className="glass-card p-6 flex flex-col items-center gap-4">
      {title && (
        <h3 className="text-lg font-display font-bold text-center">{title}</h3>
      )}
      <div className="p-4 bg-white rounded-xl shadow-inner">
        <QRCodeSVG
          value={url}
          size={size}
          level="H"
          includeMargin={false}
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>
      <p className="text-sm text-muted-foreground text-center break-all max-w-xs">
        {url}
      </p>
    </div>
  );
}
