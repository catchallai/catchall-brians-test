import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";

export default function QRCodeGenerator({ equipment, open, onClose }) {
  if (!equipment) return null;

  const qrData = JSON.stringify({
    id: equipment.id,
    name: equipment.name,
    serial: equipment.serial_number,
    category: equipment.category
  });

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${equipment.name}-QR.png`;
    link.click();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=600,height=600');
    printWindow.document.write(`
      <html>
        <head><title>${equipment.name} - QR Code</title></head>
        <body style="text-align: center; padding: 40px;">
          <h2>${equipment.name}</h2>
          <p>Serial: ${equipment.serial_number || 'N/A'}</p>
          <img src="${qrCodeUrl}" alt="QR Code" />
          <p style="margin-top: 20px; font-size: 12px;">Scan to view equipment details</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>QR Code - {equipment.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg flex items-center justify-center">
            <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
          </div>
          <p className="text-sm text-gray-600 text-center">
            Scan this code to quickly access equipment details
          </p>
          <div className="flex gap-2">
            <Button onClick={handleDownload} className="flex-1 gap-2">
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button onClick={handlePrint} variant="outline" className="flex-1 gap-2">
              <Printer className="w-4 h-4" />
              Print Label
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}