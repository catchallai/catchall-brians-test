import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function QRCodeGenerator({ equipment, open, onClose }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();

  const updateEquipmentMutation = useMutation({
    mutationFn: ({ id, qr_code_url }) => base44.entities.Equipment.update(id, { qr_code_url }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });

  useEffect(() => {
    if (equipment && open) {
      generateQRCode();
    }
  }, [equipment, open]);

  const generateQRCode = async () => {
    if (!equipment) {
      return;
    }

    setGenerating(true);
    try {
      // Generate QR code data URL
      const qrData = JSON.stringify({
        id: equipment.id,
        name: equipment.name,
        serial: equipment.serial_number,
        category: equipment.category,
      });

      // Use a QR code API to generate the image
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

      setQrCodeUrl(qrUrl);

      // Update equipment with QR code URL if not already set
      if (!equipment.qr_code_url) {
        await updateEquipmentMutation.mutateAsync({
          id: equipment.id,
          qr_code_url: qrUrl,
        });
      }
    } catch (error) {
      console.error('QR generation failed:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = qrCodeUrl;
    a.download = `${equipment.name}-QR.png`;
    a.click();
  };

  if (!equipment) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>QR Code - {equipment.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {generating ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          ) : (
            <>
              <div className="flex justify-center p-6 bg-gray-50 rounded-lg">
                <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>Name:</strong> {equipment.name}
                </p>
                <p>
                  <strong>Serial:</strong> {equipment.serial_number || 'N/A'}
                </p>
                <p>
                  <strong>Category:</strong> {equipment.category}
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleDownload} className="flex-1 gap-2">
                  <Download className="w-4 h-4" />
                  Download QR Code
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
