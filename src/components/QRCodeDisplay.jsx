import { QRCodeCanvas } from 'qrcode.react';

const QRCodeDisplay = ({ value, size = 120 }) => {
    if (!value) return null;
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="bg-white p-3 rounded-xl border-2 border-gray-200 shadow-sm">
                <QRCodeCanvas
                    value={value}
                    size={size}
                    level="M"
                    includeMargin={false}
                    imageSettings={{
                        src: '',
                        height: 0,
                        width: 0,
                        excavate: false,
                    }}
                />
            </div>
            <p className="text-xs text-gray-500">Scan QR to verify token</p>
        </div>
    );
};

export default QRCodeDisplay;
