import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Client, Membership, Invoice, GymSettings } from '../types';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
};

export const generateClientPDF = (
  client: Client, 
  memberships: Membership[], 
  gymSettings: GymSettings | null,
  invoices: Invoice[] = []
) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const themeColor = gymSettings?.themeColor || '#10b981';
    
    const hexToRgb = (hex: string): [number, number, number] => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
    };
    
    const rgbColor = hexToRgb(themeColor);

    // Header Section
    doc.setFillColor(rgbColor[0], rgbColor[1], rgbColor[2]);
    doc.rect(0, 0, pageWidth, 50, 'F');

    if (gymSettings) {
      if (gymSettings.logoUrl) {
        try {
          doc.addImage(gymSettings.logoUrl, 'PNG', 15, 10, 30, 30, undefined, 'FAST');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(22);
          doc.setFont('helvetica', 'bold');
          doc.text(gymSettings.name.toUpperCase(), 50, 22);
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(gymSettings.address, 50, 30);
          doc.text(`Email: ${gymSettings.email} | Tel: ${gymSettings.phone}`, 50, 35);
          if (gymSettings.vat) doc.text(`P.IVA: ${gymSettings.vat}`, 50, 40);
        } catch (e) {
          console.error('Error adding logo to PDF:', e);
          // Fallback if logo fails
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(26);
          doc.setFont('helvetica', 'bold');
          doc.text(gymSettings.name.toUpperCase(), 15, 22);
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(gymSettings.address, 15, 30);
          doc.text(`Email: ${gymSettings.email} | Tel: ${gymSettings.phone}`, 15, 35);
          if (gymSettings.vat) doc.text(`P.IVA: ${gymSettings.vat}`, 15, 40);
        }
      } else {
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(26);
        doc.setFont('helvetica', 'bold');
        doc.text(gymSettings.name.toUpperCase(), 15, 22);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(gymSettings.address, 15, 30);
        doc.text(`Email: ${gymSettings.email} | Tel: ${gymSettings.phone}`, 15, 35);
        if (gymSettings.vat) doc.text(`P.IVA: ${gymSettings.vat}`, 15, 40);
      }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SCHEDA CLIENTE', pageWidth - 15, 22, { align: 'right' });
    doc.setFontSize(10);
    doc.text(`Codice: ${client.clientCode}`, pageWidth - 15, 30, { align: 'right' });
    doc.text(`Iscritto il: ${format(new Date(client.registrationDate), 'dd/MM/yyyy')}`, pageWidth - 15, 35, { align: 'right' });

    let currentY = 65;

    // Section: DATI PERSONALI
    doc.setDrawColor(rgbColor[0], rgbColor[1], rgbColor[2]);
    doc.setLineWidth(0.8);
    doc.line(15, currentY, pageWidth - 15, currentY);
    
    doc.setFontSize(13);
    doc.setTextColor(rgbColor[0], rgbColor[1], rgbColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('DATI PERSONALI', 15, currentY + 10);
    
    currentY += 20;
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    
    const personalData = [
      ['Nome e Cognome:', `${client.firstName} ${client.lastName}`],
      ['Data di Nascita:', client.birthDate ? format(new Date(client.birthDate), 'dd/MM/yyyy') : '-'],
      ['Sesso:', client.gender === 'M' ? 'Uomo' : client.gender === 'F' ? 'Donna' : 'Altro'],
      ['Codice Fiscale:', client.taxCode.toUpperCase() || '-']
    ];

    personalData.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 15, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 60, currentY);
      currentY += 8;
    });

    // Section: CONTATTI E INDIRIZZO
    currentY += 10;
    doc.setDrawColor(rgbColor[0], rgbColor[1], rgbColor[2]);
    doc.line(15, currentY, pageWidth - 15, currentY);
    
    doc.setFontSize(13);
    doc.setTextColor(rgbColor[0], rgbColor[1], rgbColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTATTI E INDIRIZZO', 15, currentY + 10);
    
    currentY += 20;
    
    const contactData = [
      ['Email:', client.email],
      ['Telefono:', client.phone],
      ['Indirizzo:', `${client.address}, ${client.civicNumber}`],
      ['Città:', `${client.zipCode} ${client.city}`]
    ];

    contactData.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 15, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 60, currentY);
      currentY += 8;
    });

    // Section: ABBONAMENTI
    currentY += 10;
    doc.setDrawColor(rgbColor[0], rgbColor[1], rgbColor[2]);
    doc.line(15, currentY, pageWidth - 15, currentY);
    
    doc.setFontSize(13);
    doc.setTextColor(rgbColor[0], rgbColor[1], rgbColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('ABBONAMENTI', 15, currentY + 10);

    const membershipData = memberships.map(m => [
      m.type,
      format(new Date(m.startDate), 'dd/MM/yyyy'),
      format(new Date(m.endDate), 'dd/MM/yyyy'),
      formatCurrency(m.price),
      m.status === 'Active' ? 'ATTIVO' : m.status === 'Expired' ? 'SCADUTO' : 'ANNULLATO'
    ]);

    autoTable(doc, {
      startY: currentY + 18,
      head: [['TIPO', 'INIZIO', 'FINE', 'PREZZO', 'STATO']],
      body: membershipData,
      theme: 'grid',
      headStyles: { fillColor: rgbColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'center' }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Section: NOTE
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setDrawColor(rgbColor[0], rgbColor[1], rgbColor[2]);
    doc.line(15, currentY, pageWidth - 15, currentY);
    doc.setFontSize(13);
    doc.setTextColor(rgbColor[0], rgbColor[1], rgbColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTE', 15, currentY + 10);
    
    doc.setDrawColor(230, 230, 230);
    doc.rect(15, currentY + 15, pageWidth - 30, 30);

    currentY += 60;

    // Footer & Signatures
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Firma del Cliente', 15, currentY);
    doc.line(15, currentY + 15, 70, currentY + 15);
    
    doc.text('Firma Palestra', pageWidth - 70, currentY);
    doc.line(pageWidth - 70, currentY + 15, pageWidth - 15, currentY + 15);

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Documento generato il ${format(new Date(), 'dd/MM/yyyy HH:mm')} | ${gymSettings?.name || ''} | Pagina ${i} di ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    doc.save(`Scheda_Cliente_${client.lastName}_${client.clientCode}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Errore durante la generazione del PDF. Riprova.');
  }
};

export const generateMembershipPDF = (membership: Membership, client: Client | undefined, gymSettings: GymSettings | null) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const themeColor = gymSettings?.themeColor || '#10b981';
    
    const hexToRgb = (hex: string): [number, number, number] => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
    };
    
    const rgbColor = hexToRgb(themeColor);

    // Header
    doc.setFillColor(rgbColor[0], rgbColor[1], rgbColor[2]);
    doc.rect(0, 0, pageWidth, 45, 'F');

    if (gymSettings) {
      if (gymSettings.logoUrl) {
        try {
          doc.addImage(gymSettings.logoUrl, 'PNG', 15, 8, 28, 28, undefined, 'FAST');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(20);
          doc.setFont('helvetica', 'bold');
          doc.text(gymSettings.name.toUpperCase(), 48, 20);
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(`Email: ${gymSettings.email} | Tel: ${gymSettings.phone}`, 48, 28);
          doc.text(gymSettings.address, 48, 33);
        } catch (e) {
          console.error('Error adding logo to PDF:', e);
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(22);
          doc.setFont('helvetica', 'bold');
          doc.text(gymSettings.name.toUpperCase(), 15, 20);
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(`Email: ${gymSettings.email} | Tel: ${gymSettings.phone}`, 15, 28);
          doc.text(gymSettings.address, 15, 33);
        }
      } else {
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(gymSettings.name.toUpperCase(), 15, 20);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Email: ${gymSettings.email} | Tel: ${gymSettings.phone}`, 15, 28);
        doc.text(gymSettings.address, 15, 33);
      }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RICEVUTA ABBONAMENTO', pageWidth - 15, 20, { align: 'right' });
    doc.setFontSize(9);
    doc.text(`N. ${membership.id.slice(-6).toUpperCase()}`, pageWidth - 15, 28, { align: 'right' });
    doc.text(`Data: ${format(new Date(), 'dd/MM/yyyy')}`, pageWidth - 15, 33, { align: 'right' });

    let currentY = 60;

    // Section: DATI CLIENTE
    doc.setDrawColor(rgbColor[0], rgbColor[1], rgbColor[2]);
    doc.setLineWidth(0.5);
    doc.line(15, currentY, pageWidth - 15, currentY);
    
    doc.setFontSize(12);
    doc.setTextColor(rgbColor[0], rgbColor[1], rgbColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('DATI CLIENTE', 15, currentY + 8);
    
    currentY += 18;
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    
    if (client) {
      doc.setFont('helvetica', 'bold');
      doc.text('Nome e Cognome:', 15, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(`${client.firstName} ${client.lastName}`, 60, currentY);
      
      currentY += 7;
      doc.setFont('helvetica', 'bold');
      doc.text('Codice Cliente:', 15, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(client.clientCode, 60, currentY);
      
      currentY += 7;
      doc.setFont('helvetica', 'bold');
      doc.text('Telefono:', 15, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(client.phone, 60, currentY);
      
      currentY += 7;
      doc.setFont('helvetica', 'bold');
      doc.text('Email:', 15, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(client.email, 60, currentY);
    }

    // Section: DETTAGLI ABBONAMENTO
    currentY += 15;
    doc.setDrawColor(rgbColor[0], rgbColor[1], rgbColor[2]);
    doc.line(15, currentY, pageWidth - 15, currentY);
    
    doc.setFontSize(12);
    doc.setTextColor(rgbColor[0], rgbColor[1], rgbColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('DETTAGLI ABBONAMENTO', 15, currentY + 8);
    
    currentY += 18;
    
    const details = [
      ['Tipo Abbonamento:', membership.type],
      ['Data Inizio:', format(new Date(membership.startDate), 'dd/MM/yyyy')],
      ['Data Fine:', format(new Date(membership.endDate), 'dd/MM/yyyy')],
      ['Prezzo:', formatCurrency(membership.price)],
      ['Stato:', membership.status === 'Active' ? 'ATTIVO' : membership.status === 'Expired' ? 'SCADUTO' : 'ANNULLATO']
    ];

    details.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 15, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 60, currentY);
      currentY += 7;
    });

    // Section: PAGAMENTO
    currentY += 10;
    doc.setDrawColor(rgbColor[0], rgbColor[1], rgbColor[2]);
    doc.line(15, currentY, pageWidth - 15, currentY);
    
    doc.setFontSize(12);
    doc.setTextColor(rgbColor[0], rgbColor[1], rgbColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMAZIONI PAGAMENTO', 15, currentY + 8);
    
    currentY += 18;
    
    const paymentData = [
      ['Importo Totale:', formatCurrency(membership.price)],
      ['Stato Pagamento:', membership.paymentStatus === 'Paid' ? 'PAGATO' : 'IN ATTESA'],
      ['Metodo:', membership.paymentMethod || '-'],
      ['Data Pagamento:', membership.paymentDate ? format(new Date(membership.paymentDate), 'dd/MM/yyyy') : '-']
    ];

    paymentData.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 15, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 60, currentY);
      currentY += 7;
    });

    // Section: EXTRA & NOTE
    if (membership.notes) {
      currentY += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('NOTE:', 15, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(membership.notes, 15, currentY + 7, { maxWidth: pageWidth - 30 });
      currentY += 15;
    }

    // Footer
    currentY = 260;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Firma Palestra', pageWidth - 70, currentY);
    doc.line(pageWidth - 70, currentY + 10, pageWidth - 15, currentY + 10);
    
    doc.setFontSize(8);
    doc.text(`Documento creato il ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 15, 285);

    doc.save(`Ricevuta_Abbonamento_${client?.lastName || 'Cliente'}_${membership.id.slice(-6).toUpperCase()}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Errore durante la generazione del PDF. Riprova.');
  }
};

export const generateInvoicePDF = (invoice: Invoice, gymSettings: GymSettings | null, autoPrint = false) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const themeColor = gymSettings?.themeColor || '#10b981';
    
    const hexToRgb = (hex: string): [number, number, number] => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
    };
    
    const rgbColor = hexToRgb(themeColor);

    // Header Background
    doc.setFillColor(rgbColor[0], rgbColor[1], rgbColor[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Gym Header
    if (gymSettings?.logoUrl) {
      try {
        doc.addImage(gymSettings.logoUrl, 'PNG', 15, 5, 25, 25, undefined, 'FAST');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(invoice.issuerData.name.toUpperCase(), 45, 18);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(invoice.issuerData.address, 45, 25);
        doc.text(`Email: ${invoice.issuerData.email} | Tel: ${invoice.issuerData.phone || ''}`, 45, 30);
        if (invoice.issuerData.vat) doc.text(`P.IVA: ${invoice.issuerData.vat}`, 45, 35);
      } catch (e) {
        console.error('Error adding logo to PDF:', e);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(invoice.issuerData.name.toUpperCase(), 15, 18);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(invoice.issuerData.address, 15, 25);
        doc.text(`Email: ${invoice.issuerData.email} | Tel: ${invoice.issuerData.phone || ''}`, 15, 30);
        if (invoice.issuerData.vat) doc.text(`P.IVA: ${invoice.issuerData.vat}`, 15, 35);
      }
    } else {
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(invoice.issuerData.name.toUpperCase(), 15, 18);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.issuerData.address, 15, 25);
      doc.text(`Email: ${invoice.issuerData.email} | Tel: ${invoice.issuerData.phone || ''}`, 15, 30);
      if (invoice.issuerData.vat) doc.text(`P.IVA: ${invoice.issuerData.vat}`, 15, 35);
    }

    // Invoice Info
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`FATTURA`, pageWidth - 15, 18, { align: 'right' });
    doc.setFontSize(12);
    doc.text(`#${invoice.id.slice(-6).toUpperCase()}`, pageWidth - 15, 25, { align: 'right' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Data Emissione: ${format(new Date(invoice.date), 'dd/MM/yyyy')}`, pageWidth - 15, 31, { align: 'right' });
    doc.text(`Data Scadenza: ${format(new Date(invoice.dueDate), 'dd/MM/yyyy')}`, pageWidth - 15, 36, { align: 'right' });

    // Client Info Section
    let currentY = 50;
    doc.setDrawColor(rgbColor[0], rgbColor[1], rgbColor[2]);
    doc.setLineWidth(0.5);
    doc.line(15, currentY, pageWidth - 15, currentY);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'bold');
    doc.text('DESTINATARIO:', 15, currentY + 8);
    
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    const client = invoice.clientData;
    if (client) {
      doc.text(`${client.firstName} ${client.lastName}`.toUpperCase(), 15, currentY + 15);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(client.address || '', 15, currentY + 20);
      doc.text(`${client.zipCode || ''} ${client.city || ''}`, 15, 24 + currentY);
      doc.text(`C.F.: ${client.taxCode || ''}`, 15, 28 + currentY);
      if (client.email) doc.text(`Email: ${client.email}`, 15, 32 + currentY);
    }

    // Status Badge
    const statusText = invoice.status === 'Paid' ? 'PAGATA' : invoice.status === 'Overdue' ? 'SCADUTA' : 'IN ATTESA';
    const statusColor = invoice.status === 'Paid' ? [16, 185, 129] : invoice.status === 'Overdue' ? [239, 68, 68] : [245, 158, 11];
    
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.roundedRect(pageWidth - 45, currentY + 8, 30, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(statusText, pageWidth - 30, currentY + 13.5, { align: 'center' });

    // Items Table
    const tableBody = invoice.items.map(item => [
      item.description,
      item.quantity,
      formatCurrency(item.price),
      formatCurrency(item.price * item.quantity)
    ]);

    autoTable(doc, {
      startY: currentY + 45,
      head: [['DESCRIZIONE', 'QTÀ', 'PREZZO UNIT.', 'TOTALE']],
      body: tableBody,
      theme: 'striped',
      headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY;

    // Totals Section
    doc.setDrawColor(230, 230, 230);
    doc.line(pageWidth - 80, finalY + 5, pageWidth - 15, finalY + 5);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('Totale Imponibile:', pageWidth - 80, finalY + 12);
    doc.setTextColor(20, 20, 20);
    doc.text(formatCurrency(invoice.total), pageWidth - 15, finalY + 12, { align: 'right' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rgbColor[0], rgbColor[1], rgbColor[2]);
    doc.text('TOTALE FATTURA:', pageWidth - 80, finalY + 22);
    doc.text(formatCurrency(invoice.total), pageWidth - 15, finalY + 22, { align: 'right' });

    // Notes
    if (invoice.notes) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text('NOTE E CONDIZIONI:', 15, finalY + 35);
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.notes, 15, finalY + 41, { maxWidth: 100 });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Fattura generata il ${format(new Date(), 'dd/MM/yyyy HH:mm')} | Pagina ${i} di ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    if (autoPrint) {
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
    } else {
      doc.save(`Fattura_${invoice.id.slice(-6).toUpperCase()}_${client?.lastName || 'Cliente'}.pdf`);
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Errore durante la generazione del PDF. Riprova.');
  }
};
