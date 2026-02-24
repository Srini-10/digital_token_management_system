import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const statusColors = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    called: 'bg-blue-100 text-blue-800 border-blue-200',
};

const TokenCard = ({ token, onCancel, showActions = true }) => {
    const printRef = useRef(null);

    const downloadPDF = async () => {
        const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${token.token_number}.pdf`);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            {/* Printable area (hidden visually but captured for PDF) */}
            <div ref={printRef} style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '400px', padding: '24px', background: 'white', fontFamily: 'Inter, sans-serif' }}>
                <div style={{ borderTop: '6px solid #0f2557', paddingTop: '16px' }}>
                    {/* Header: logo + title — use table layout for reliable html2canvas rendering */}
                    <div style={{ display: 'table', width: '100%', marginBottom: '16px' }}>
                        <div style={{ display: 'table-cell', verticalAlign: 'middle', width: '56px' }}>
                            <div style={{
                                marginTop: '10px',
                                width: '42px', height: '42px',
                                background: '#0f2557', borderRadius: '50%',
                                display: 'table-cell',
                                textAlign: 'center', verticalAlign: 'middle', display: 'flex', justifyContent: 'center', alignItems: 'center',
                                color: '#d4a017', fontWeight: 'bold', fontSize: '14px',
                            }}>
                                <p className="-mt-3">GT</p></div>
                        </div>
                        <div style={{ display: 'table-cell', verticalAlign: 'middle', paddingLeft: '12px' }}>
                            <p style={{ fontWeight: 'bold', color: '#0f2557', margin: 0, fontSize: '15px' }}>Government of Tamil Nadu</p>
                            <p style={{ color: '#6b7280', fontSize: '12px', margin: '2px 0 0 0' }}>Digital Token System</p>
                        </div>
                    </div>

                    <hr style={{ borderColor: '#e5e7eb', marginBottom: '16px' }} />
                    <div style={{ marginBottom: '16px' }}>
                        <InfoRow label="Department" value={token.department_name} />
                        <InfoRow label="Token No." value={token.token_number} bold />
                        <InfoRow label="Date" value={token.booking_date} />
                        <InfoRow label="Time Slot" value={token.slot_time} />
                        <InfoRow label="Citizen Name" value={token.user_name} />
                        <InfoRow label="Status" value={token.status?.toUpperCase()} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                        {token.qr_data && <QRCodeCanvas value={token.qr_data} size={100} />}
                    </div>
                    <hr style={{ borderColor: '#e5e7eb', marginBottom: '12px' }} />
                    <p style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
                        Please arrive 10 minutes before your slot time.
                    </p>
                </div>
            </div>

            {/* Visible card */}
            <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-xl font-bold text-gov-blue">{token.token_number}</p>
                        <p className="text-gray-600 text-sm mt-0.5">{token.department_name}</p>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize ${statusColors[token.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {token.status}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gov-light rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-0.5">Date</p>
                        <p className="font-semibold text-gov-navy text-sm">{token.booking_date}</p>
                    </div>
                    <div className="bg-gov-light rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-0.5">Time Slot</p>
                        <p className="font-semibold text-gov-navy text-sm">{token.slot_time}</p>
                    </div>
                </div>

                {showActions && (
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <button
                            onClick={downloadPDF}
                            className="flex-1 bg-gov-navy hover:bg-gov-blue text-white text-sm font-medium py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                        >
                            📄 Download PDF
                        </button>
                        {token.status === 'pending' && onCancel && (
                            <button
                                onClick={() => onCancel(token)}
                                className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const InfoRow = ({ label, value, bold }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ color: '#6b7280', fontSize: '13px' }}>{label}</span>
        <span style={{ fontWeight: bold ? 'bold' : '500', color: '#0f2557', fontSize: '13px' }}>{value}</span>
    </div>
);

export default TokenCard;
