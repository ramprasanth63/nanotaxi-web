import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

interface InvoiceGeneratorProps {
  booking: any;
  visible: boolean;
  onClose: () => void;
}

const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({
  booking,
  visible,
  onClose
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString;
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const bookingId = String(booking.id).slice(-4);
    return `INV-${year}${month}-${bookingId}`;
  };

const getLogoBase64 = async () => {
  return 'https://www.nanotaxibooking.com/NaNoLogo.png';
};

  const generatePackageInvoiceHTML = () => {
    const invoiceNumber = generateInvoiceNumber();
    const currentDate = new Date().toLocaleDateString('en-IN');
    const tripDate = formatDate(booking.date_of_travel);
    const totalAmount = booking.pending_payment || booking.total_amount || 0;
    const advancePaid = booking.advanced_payment || 0;
    const balance = totalAmount - advancePaid;

    const pickupTimeSection = booking.pickup_time ? `
      <div class="detail-item">
        <div class="detail-label">Pickup Time</div>
        <div class="detail-value">${formatTime(booking.pickup_time)}</div>
      </div>` : '';

    const instructionsSection = booking.special_instructions ? `
      <div class="instructions">
        <div class="instructions-title">📝 Special Instructions</div>
        <div class="instructions-text">${booking.special_instructions}</div>
      </div>` : '';

    const baseAmountRow = booking.base_amount > 0 ? `
      <tr>
        <td>Base Package Amount</td>
        <td style="text-align: right;">₹${booking.base_amount}</td>
      </tr>` : '';

    const tollRow = booking.toll_amount > 0 ? `
      <tr>
        <td>Toll Charges</td>
        <td style="text-align: right;">₹${booking.toll_amount}</td>
      </tr>` : '';

    const parkingRow = booking.parking_fee > 0 ? `
      <tr>
        <td>Parking Fee</td>
        <td style="text-align: right;">₹${booking.parking_fee}</td>
      </tr>` : '';

    const nightHaltRow = booking.night_halt_charges > 0 ? `
      <tr>
        <td>Night Halt Charges</td>
        <td style="text-align: right;">₹${booking.night_halt_charges}</td>
      </tr>` : '';

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Hourly Package Invoice</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; 
            background: #ffffff; 
            color: #2d3748; 
            font-size: 14px;
            line-height: 1.6;
        }
        .invoice-wrapper {
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff;
            min-height: 100vh;
        }
        .header {
            padding: 25px 30px;
            border-bottom: 3px solid #09613F;
            background: linear-gradient(135deg, rgba(255,198,39,0.05) 0%, rgba(9,97,63,0.05) 100%);
        }
        .header-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .logo-section {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .logo {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #FFC627 0%, #09613F 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: white;
        }
        .company-name {
            font-size: 22px;
            font-weight: 700;
            color: #09613F;
        }
        .invoice-badge {
            background: #09613F;
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 13px;
        }
        .contact-bar {
            display: flex;
            gap: 25px;
            font-size: 12px;
            color: #64748b;
            padding-top: 10px;
        }
        .invoice-meta {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1px;
            background: #e5e7eb;
            margin: 20px 30px;
            border-radius: 10px;
            overflow: hidden;
        }
        .meta-item {
            background: white;
            padding: 12px;
            text-align: center;
        }
        .meta-label {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 2px;
        }
        .meta-value {
            font-size: 13px;
            font-weight: 600;
            color: #09613F;
        }
        .trip-details {
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            margin: 0 30px 20px;
            border-left: 4px solid #FFC627;
        }
        .section-title {
            font-size: 12px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 15px;
        }
        .detail-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }
        .detail-item {
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .detail-label {
            font-size: 12px;
            color: #64748b;
        }
        .detail-value {
            font-size: 13px;
            font-weight: 600;
            color: #2d3748;
        }
        .instructions {
            background: #fef3c7;
            border-left: 4px solid #FFC627;
            border-radius: 8px;
            padding: 15px;
            margin: 0 30px 20px;
        }
        .instructions-title {
            font-size: 12px;
            font-weight: 600;
            color: #92400e;
            margin-bottom: 8px;
        }
        .instructions-text {
            font-size: 13px;
            color: #78350f;
        }
        .cost-breakdown {
            margin: 0 30px 20px;
        }
        .cost-title {
            font-size: 14px;
            font-weight: 600;
            color: #09613F;
            margin-bottom: 12px;
        }
        .cost-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
        }
        .cost-table th {
            background: #f8fafc;
            padding: 12px;
            text-align: left;
            font-size: 12px;
            color: #64748b;
            border-bottom: 2px solid #e5e7eb;
        }
        .cost-table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 13px;
        }
        .total-row {
            background: linear-gradient(135deg, #FFC627 0%, #09613F 100%);
            color: white;
            font-weight: 700;
        }
        .payment-summary {
            background: linear-gradient(135deg, rgba(255,198,39,0.08) 0%, rgba(9,97,63,0.08) 100%);
            border: 1px solid rgba(9,97,63,0.2);
            border-radius: 12px;
            padding: 20px;
            margin: 0 30px 25px;
        }
        .payment-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
        }
        .payment-item {
            text-align: center;
        }
        .payment-label {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 2px;
        }
        .payment-amount {
            font-size: 18px;
            font-weight: 700;
            color: #09613F;
        }
        .footer {
            border-top: 2px solid #e5e7eb;
            padding: 20px 30px;
            background: #f8fafc;
            text-align: center;
            font-size: 11px;
            color: #64748b;
        }
        @media print {
            body { background: white; }
            .invoice-wrapper { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="invoice-wrapper">
        <div class="header">
            <div class="header-top">
                <div class="logo-section">
                    <div class="logo">
                        <img src="${logoBase64}" alt="Nano Taxi" style="width: 100%; height: 100%; object-fit: contain;" />
                    </div>
                    <div class="company-name">NANO TAXI BOOKING</div>
                </div>
                <div class="invoice-badge">HOURLY PACKAGE INVOICE</div>
            </div>
            <div class="contact-bar">
                <span>📧 support@nanotaxibooking.com</span>
                <span>📞 85087 06396</span>
                <span>🌐 www.nanotaxibooking.com</span>
            </div>
        </div>
        <div class="invoice-meta">
            <div class="meta-item">
                <div class="meta-label">Invoice No</div>
                <div class="meta-value">${invoiceNumber}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Invoice Date</div>
                <div class="meta-value">${currentDate}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Trip Date</div>
                <div class="meta-value">${tripDate}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Package ID</div>
                <div class="meta-value">#${booking.id}</div>
            </div>
        </div>
        <div class="trip-details">
            <div class="section-title">📦 Package Trip Details</div>
            <div class="detail-item" style="margin-bottom: 15px;">
                <div class="detail-label">Start Point</div>
                <div class="detail-value">${booking.pick_up_place || booking.start_point}</div>
            </div>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">Vehicle Type</div>
                    <div class="detail-value">${booking.vehicle_type}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Total Distance</div>
                    <div class="detail-value">${booking.total_km_booked} KM</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Total Hours</div>
                    <div class="detail-value">${booking.total_hours_booked} Hours</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Number of Nights</div>
                    <div class="detail-value">${booking.no_of_nights} Night(s)</div>
                </div>
                ${pickupTimeSection}
            </div>
        </div>
        <div class="cost-breakdown">
            <div class="cost-title">💰 Cost Breakdown</div>
            <table class="cost-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th style="text-align: right;">Amount (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    ${baseAmountRow}
                    ${tollRow}
                    ${parkingRow}
                    ${nightHaltRow}
                    <tr class="total-row">
                        <td><strong>Total Amount</strong></td>
                        <td style="text-align: right;"><strong>₹${totalAmount}</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="footer">
            <p><strong>NANO TAXI BOOKING</strong></p>
            <p>Thank you for choosing our premium transportation services!</p>
            <p>support@nanotaxibooking.com | 85087 06396 | www.nanotaxibooking.com</p>
        </div>
    </div>
</body>
</html>`;
  };

  const generateRegularInvoiceHTML = async () => {
    const logoBase64 = await getLogoBase64();
    const invoiceNumber = generateInvoiceNumber();
    const currentDate = new Date().toLocaleDateString('en-IN');
    const tripDate = formatDate(booking.date_of_travel);
    const totalAmount = booking.total_amount || booking.pending_payment || 0;
    const isRoundTrip = booking.round_trip === true || booking.round_trip === 'true';

    const pickupTimeSection = booking.pickup_time ? `
      <div class="detail-row">
        <span class="detail-label">Pickup Time</span>
        <span class="detail-value">${formatTime(booking.pickup_time)}</span>
      </div>` : '';

    const roundTripRoute = isRoundTrip ? `
      <div class="route-connector">↓</div>
      <div class="route-point">
        <div class="route-marker marker-pickup">A</div>
        <div class="route-text">${booking.start_point}</div>
      </div>` : '';

    const driverSection = booking.driver ? `
      <div class="driver-section">
        <div class="section-title">👤 Driver Information</div>
        <div class="driver-content">
          <div class="driver-item">
            <div class="label">Driver Name</div>
            <div class="value">${booking.driver.name}</div>
          </div>
          <div class="driver-item">
            <div class="label">Vehicle Number</div>
            <div class="value">${booking.driver.carNumber}</div>
          </div>
          <div class="driver-item">
            <div class="label">Rating</div>
            <div class="value">⭐ ${booking.driver.rating}</div>
          </div>
        </div>
      </div>` : '';

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${isRoundTrip ? 'Round Trip' : 'Single Trip'} Invoice</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; 
            background: #ffffff; 
            color: #2d3748; 
            font-size: 14px;
            line-height: 1.6;
        }
        .invoice-wrapper {
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff;
            min-height: 100vh;
        }
        .header {
            padding: 25px 30px;
            border-bottom: 3px solid #09613F;
            background: linear-gradient(135deg, rgba(255,198,39,0.05) 0%, rgba(9,97,63,0.05) 100%);
        }
        .header-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .logo-section {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .logo {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #FFC627 0%, #09613F 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: white;
        }
        .company-name {
            font-size: 22px;
            font-weight: 700;
            color: #09613F;
        }
        .invoice-badge {
            background: #09613F;
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 13px;
        }
        .contact-bar {
            display: flex;
            gap: 25px;
            font-size: 12px;
            color: #64748b;
            padding-top: 10px;
        }
        .invoice-meta {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1px;
            background: #e5e7eb;
            margin: 20px 30px;
            border-radius: 10px;
            overflow: hidden;
        }
        .meta-item {
            background: white;
            padding: 12px;
            text-align: center;
        }
        .meta-label {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 2px;
        }
        .meta-value {
            font-size: 13px;
            font-weight: 600;
            color: #09613F;
        }
        .content-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            padding: 0 30px;
            margin-bottom: 20px;
        }
        .route-card {
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            border-left: 4px solid #FFC627;
        }
        .section-title {
            font-size: 12px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 15px;
        }
        .route-points {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .route-point {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .route-marker {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
            color: white;
        }
        .marker-pickup {
            background: #FFC627;
        }
        .marker-dropoff {
            background: #09613F;
        }
        .route-text {
            font-size: 13px;
            color: #2d3748;
        }
        .route-connector {
            width: 28px;
            display: flex;
            justify-content: center;
            color: #cbd5e0;
            font-size: 16px;
        }
        .details-card {
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-size: 12px;
            color: #64748b;
        }
        .detail-value {
            font-size: 13px;
            font-weight: 600;
            color: #2d3748;
        }
        .driver-section {
            margin: 0 30px 20px;
            background: linear-gradient(135deg, rgba(255,198,39,0.08) 0%, rgba(9,97,63,0.08) 100%);
            border: 1px solid rgba(9,97,63,0.2);
            border-radius: 12px;
            padding: 15px 20px;
        }
        .driver-content {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
        }
        .driver-item {
            text-align: center;
        }
        .label {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 2px;
        }
        .value {
            font-size: 13px;
            font-weight: 600;
            color: #09613F;
        }
        .payment-section {
            margin: 0 30px 25px;
            background: linear-gradient(135deg, #FFC627 0%, #09613F 100%);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
        }
        .payment-label {
            font-size: 12px;
            color: rgba(255,255,255,0.9);
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .payment-amount {
            font-size: 28px;
            font-weight: 700;
            color: white;
        }
        .footer {
            border-top: 2px solid #e5e7eb;
            padding: 20px 30px;
            background: #f8fafc;
            text-align: center;
            font-size: 11px;
            color: #64748b;
        }
        @media print {
            body { background: white; }
            .invoice-wrapper { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="invoice-wrapper">
        <div class="header">
            <div class="header-top">
                <div class="logo-section">
                    <div class="logo">
                        <img src="${logoBase64}" alt="Nano Taxi" style="width: 100%; height: 100%; object-fit: contain;" />
                    </div>
                    <div class="company-name">NANO TAXI BOOKING</div>
                </div>
                <div class="invoice-badge">${isRoundTrip ? 'ROUND TRIP' : 'SINGLE TRIP'} INVOICE</div>
            </div>
            <div class="contact-bar">
                <span>📧 support@nanotaxibooking.com</span>
                <span>📞 85087 06396</span>
                <span>🌐 www.nanotaxibooking.com</span>
            </div>
        </div>
        <div class="invoice-meta">
            <div class="meta-item">
                <div class="meta-label">Invoice No</div>
                <div class="meta-value">${invoiceNumber}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Invoice Date</div>
                <div class="meta-value">${currentDate}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Trip Date</div>
                <div class="meta-value">${tripDate}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Booking ID</div>
                <div class="meta-value">#${booking.id}</div>
            </div>
        </div>
        <div class="content-grid">
            <div class="route-card">
                <div class="section-title">${isRoundTrip ? '🔄' : '📍'} ${isRoundTrip ? 'Round Trip Route' : 'Trip Route'}</div>
                <div class="route-points">
                    <div class="route-point">
                        <div class="route-marker marker-pickup">A</div>
                        <div class="route-text">${booking.start_point}</div>
                    </div>
                    <div class="route-connector">↓</div>
                    <div class="route-point">
                        <div class="route-marker marker-dropoff">B</div>
                        <div class="route-text">${booking.end_point}</div>
                    </div>
                    ${roundTripRoute}
                </div>
            </div>
            <div class="details-card">
                <div class="section-title">📋 Trip Details</div>
                <div class="detail-row">
                    <span class="detail-label">Vehicle Type</span>
                    <span class="detail-value">${booking.vehicle_type}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Travel Date</span>
                    <span class="detail-value">${tripDate}</span>
                </div>
                ${pickupTimeSection}
                <div class="detail-row">
                    <span class="detail-label">Trip Type</span>
                    <span class="detail-value">${isRoundTrip ? 'Round Trip' : 'Single Trip'}</span>
                </div>
            </div>
        </div>
        ${driverSection}
        <div class="payment-section">
            <div class="payment-label">Total Fare</div>
            <div class="payment-amount">₹${totalAmount}</div>
        </div>
        <div class="footer">
            <p><strong>NANO TAXI BOOKING</strong></p>
            <p>Thank you for choosing our premium transportation services!</p>
            <p>support@nanotaxibooking.com | 85087 06396 | www.nanotaxibooking.com</p>
        </div>
    </div>
</body>
</html>`;
  };

  const generateInvoiceHTML = async () => {
    if (booking.trip_type === 'package') {
      return await generatePackageInvoiceHTML();
    }
    return await generateRegularInvoiceHTML();
  };

  const handleDownloadPDF = async () => {
    try {
      setIsGenerating(true);
      const html = await generateInvoiceHTML();
      const { uri } = await Print.printToFileAsync({ html });
      const fileName = `Invoice_${generateInvoiceNumber()}_${Date.now()}.pdf`;
      const downloadPath = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.moveAsync({ from: uri, to: downloadPath });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadPath, {
          mimeType: 'application/pdf',
          dialogTitle: 'Download Invoice',
          UTI: 'com.adobe.pdf'
        });
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate invoice. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    try {
      const invoiceNumber = generateInvoiceNumber();
      const tripType = booking.trip_type === 'package' 
        ? 'Hourly Package' 
        : (booking.round_trip ? 'Round Trip' : 'Single Trip');
      
      await Share.share({
        message: `${tripType} Invoice - ${invoiceNumber}\n\nTrip Date: ${formatDate(booking.date_of_travel)}\nAmount: ₹${booking.total_amount || booking.pending_payment}\n\nGenerated via NANO TAXI BOOKING`,
        title: `Invoice ${invoiceNumber}`
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHeader}>
            <View style={styles.dragHandle} />
            <View style={styles.headerContent}>
              <Text style={styles.sheetTitle}>Invoice Preview</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView style={styles.previewContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.invoicePreview}>
              <View style={styles.previewHeader}>
                <View style={styles.companyBadge}>
                  <MaterialCommunityIcons name="taxi" size={32} color="#FFC627" />
                </View>
                <Text style={styles.companyName}>NANO TAXI BOOKING</Text>
                <Text style={styles.invoiceLabel}>INVOICE</Text>
              </View>
              
              <View style={styles.invoiceDetails}>
                <View style={styles.invoiceRow}>
                  <Text style={styles.label}>Invoice Number:</Text>
                  <Text style={styles.value}>{generateInvoiceNumber()}</Text>
                </View>
                <View style={styles.invoiceRow}>
                  <Text style={styles.label}>Date:</Text>
                  <Text style={styles.value}>{formatDate(booking.date_of_travel)}</Text>
                </View>
                <View style={styles.invoiceRow}>
                  <Text style={styles.label}>Trip Type:</Text>
                  <Text style={styles.value}>
                    {booking.trip_type === 'package' ? 'Hourly Package' : 
                     booking.round_trip ? 'Round Trip' : 'Single Trip'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.routePreview}>
                <MaterialCommunityIcons name="map-marker" size={20} color="#FFC627" />
                <Text style={styles.locationText}>{booking.start_point || booking.pick_up_place}</Text>
                {booking.end_point && booking.trip_type !== 'package' && (
                  <>
                    <MaterialCommunityIcons name="arrow-down" size={16} color="#9CA3AF" />
                    <MaterialCommunityIcons name="map-marker" size={20} color="#09613F" />
                    <Text style={styles.locationText}>{booking.end_point}</Text>
                    {booking.round_trip && (
                      <>
                        <MaterialCommunityIcons name="arrow-down" size={16} color="#9CA3AF" />
                        <MaterialCommunityIcons name="map-marker" size={20} color="#FFC627" />
                        <Text style={styles.locationText}>{booking.start_point}</Text>
                      </>
                    )}
                  </>
                )}
              </View>
              
              <View style={styles.amountPreview}>
                <Text style={styles.amountLabel}>Total Amount</Text>
                <Text style={styles.amountValue}>
                  ₹{booking.total_amount || booking.pending_payment || 0}
                </Text>
              </View>
              
              <View style={styles.infoNote}>
                <MaterialCommunityIcons name="information" size={16} color="#09613F" />
                <Text style={styles.infoText}>
                  Full invoice with complete details will be generated in PDF format
                </Text>
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.shareButton]} 
              onPress={handleShare}
            >
              <MaterialCommunityIcons name="share-variant" size={20} color="#09613F" />
              <Text style={styles.shareButtonText}>Share Details</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.downloadButton, isGenerating && styles.disabledButton]}
              onPress={handleDownloadPDF}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <MaterialCommunityIcons name="loading" size={20} color="#FFFFFF" />
                  <Text style={styles.downloadButtonText}>Generating...</Text>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons name="download" size={20} color="#FFFFFF" />
                  <Text style={styles.downloadButtonText}>Download Invoice PDF</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  sheetHeader: {
    padding: 20,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  previewContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  invoicePreview: {
    paddingVertical: 20,
  },
  previewHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  companyBadge: {
    width: 80,
    height: 80,
    backgroundColor: '#F0FDF4',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#09613F',
    marginBottom: 4,
  },
  invoiceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 2,
  },
  invoiceDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  routePreview: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    marginVertical: 4,
    textAlign: 'center',
  },
  amountPreview: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 14,
    color: '#92400E',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  infoNote: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#065F46',
    marginLeft: 8,
    flex: 1,
  },
  actionButtons: {
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  shareButton: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#09613F',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#09613F',
  },
  downloadButton: {
    backgroundColor: '#09613F',
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
});

export default InvoiceGenerator