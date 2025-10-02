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

  const getCompanyLogo = () => {
    // Base64 encoded company logo - replace with your actual logo
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  };

  const generatePackageInvoiceHTML = () => {
    const invoiceNumber = generateInvoiceNumber();
    const currentDate = new Date().toLocaleDateString('en-IN');
    const totalAmount = booking.pending_payment || booking.total_amount || 0;
    const advancePaid = booking.advanced_payment || 0;
    const balance = totalAmount - advancePaid;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Package Trip Invoice</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Helvetica Neue', Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
                color: #333;
            }
            
            .invoice-container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                border-radius: 15px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            
            .header {
                background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                color: white;
                padding: 30px;
                position: relative;
                overflow: hidden;
            }
            
            .header::before {
                content: '';
                position: absolute;
                top: -50%;
                right: -20%;
                width: 200px;
                height: 200px;
                background: rgba(255,255,255,0.1);
                border-radius: 50%;
            }
            
            .company-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            
            .company-logo {
                width: 60px;
                height: 60px;
                background: white;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                color: #10B981;
                font-size: 24px;
            }
            
            .company-details h1 {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 5px;
            }
            
            .company-details p {
                opacity: 0.9;
                font-size: 14px;
            }
            
            .invoice-title {
                text-align: center;
                font-size: 32px;
                font-weight: 300;
                letter-spacing: 2px;
                margin-top: 10px;
            }
            
            .content {
                padding: 40px;
            }
            
            .invoice-meta {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
                background: #f8fafc;
                padding: 20px;
                border-radius: 10px;
            }
            
            .meta-item h4 {
                color: #64748b;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 5px;
            }
            
            .meta-item p {
                font-size: 16px;
                font-weight: 600;
                color: #1e293b;
            }
            
            .trip-details {
                background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                border-radius: 15px;
                padding: 25px;
                margin-bottom: 30px;
                border-left: 5px solid #10B981;
            }
            
            .trip-title {
                font-size: 20px;
                font-weight: 700;
                color: #1e293b;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
            }
            
            .trip-icon {
                width: 30px;
                height: 30px;
                background: #10B981;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 10px;
                color: white;
                font-size: 14px;
            }
            
            .detail-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .detail-item {
                background: white;
                padding: 15px;
                border-radius: 10px;
                border: 1px solid #e2e8f0;
            }
            
            .detail-label {
                color: #64748b;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 5px;
            }
            
            .detail-value {
                font-size: 16px;
                font-weight: 600;
                color: #1e293b;
            }
            
            .location-info {
                background: white;
                padding: 20px;
                border-radius: 10px;
                border: 1px solid #e2e8f0;
                margin-bottom: 20px;
            }
            
            .cost-breakdown {
                margin-bottom: 30px;
            }
            
            .cost-title {
                font-size: 18px;
                font-weight: 700;
                color: #1e293b;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 2px solid #e2e8f0;
            }
            
            .cost-table {
                width: 100%;
                border-collapse: collapse;
                background: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            }
            
            .cost-table th {
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                padding: 15px;
                text-align: left;
                font-weight: 600;
                color: #475569;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .cost-table td {
                padding: 15px;
                border-bottom: 1px solid #f1f5f9;
            }
            
            .cost-table tr:last-child td {
                border-bottom: none;
            }
            
            .total-row {
                background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                color: white;
                font-weight: 700;
            }
            
            .total-row td {
                font-size: 18px;
                border-bottom: none;
            }
            
            .payment-summary {
                background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                border-radius: 15px;
                padding: 25px;
                margin-bottom: 30px;
                border: 2px solid #f59e0b;
            }
            
            .payment-title {
                font-size: 18px;
                font-weight: 700;
                color: #92400e;
                margin-bottom: 15px;
            }
            
            .payment-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 15px;
            }
            
            .payment-item {
                text-align: center;
                background: white;
                padding: 15px;
                border-radius: 10px;
            }
            
            .payment-label {
                color: #92400e;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 5px;
            }
            
            .payment-amount {
                font-size: 20px;
                font-weight: 700;
                color: #1e293b;
            }
            
            .instructions {
                background: #eff6ff;
                border-radius: 10px;
                padding: 20px;
                border-left: 4px solid #3b82f6;
                margin-bottom: 30px;
            }
            
            .instructions-title {
                font-weight: 600;
                color: #1e40af;
                margin-bottom: 10px;
            }
            
            .instructions-text {
                color: #1e40af;
                line-height: 1.6;
            }
            
            .footer {
                background: #1e293b;
                color: white;
                padding: 30px;
                text-align: center;
            }
            
            .footer p {
                margin-bottom: 5px;
                opacity: 0.8;
            }
            
            .footer .company-name {
                font-size: 18px;
                font-weight: 700;
                opacity: 1;
                margin-bottom: 10px;
            }
            
            @media print {
                body { background: white; padding: 0; }
                .invoice-container { box-shadow: none; }
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <div class="header">
                <div class="company-info">
                    <div class="company-logo">🚗</div>
                    <div class="company-details">
                        <h1>RideShare Pro</h1>
                        <p>Premium Transportation Services</p>
                        <p>📧 support@ridesharepro.com | 📞 +91-XXXX-XXXXXX</p>
                    </div>
                </div>
                <div class="invoice-title">PACKAGE TRIP INVOICE</div>
            </div>
            
            <div class="content">
                <div class="invoice-meta">
                    <div class="meta-item">
                        <h4>Invoice Number</h4>
                        <p>${invoiceNumber}</p>
                    </div>
                    <div class="meta-item">
                        <h4>Invoice Date</h4>
                        <p>${currentDate}</p>
                    </div>
                    <div class="meta-item">
                        <h4>Trip Date</h4>
                        <p>${formatDate(booking.date_of_travel)}</p>
                    </div>
                    <div class="meta-item">
                        <h4>Package ID</h4>
                        <p>#${booking.id}</p>
                    </div>
                </div>
                
                <div class="trip-details">
                    <div class="trip-title">
                        <div class="trip-icon">📦</div>
                        Package Trip Details
                    </div>
                    
                    <div class="location-info">
                        <div class="detail-label">Pickup Location</div>
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
                        ${booking.pickup_time ? `
                        <div class="detail-item">
                            <div class="detail-label">Pickup Time</div>
                            <div class="detail-value">${formatTime(booking.pickup_time)}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                ${booking.special_instructions ? `
                <div class="instructions">
                    <div class="instructions-title">Special Instructions</div>
                    <div class="instructions-text">${booking.special_instructions}</div>
                </div>
                ` : ''}
                
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
                            ${booking.base_amount > 0 ? `
                            <tr>
                                <td>Base Package Amount</td>
                                <td style="text-align: right;">₹${booking.base_amount}</td>
                            </tr>
                            ` : ''}
                            ${booking.toll_amount > 0 ? `
                            <tr>
                                <td>Toll Charges</td>
                                <td style="text-align: right;">₹${booking.toll_amount}</td>
                            </tr>
                            ` : ''}
                            ${booking.parking_fee > 0 ? `
                            <tr>
                                <td>Parking Fee</td>
                                <td style="text-align: right;">₹${booking.parking_fee}</td>
                            </tr>
                            ` : ''}
                            ${booking.night_halt_charges > 0 ? `
                            <tr>
                                <td>Night Halt Charges</td>
                                <td style="text-align: right;">₹${booking.night_halt_charges}</td>
                            </tr>
                            ` : ''}
                            <tr class="total-row">
                                <td><strong>Total Amount</strong></td>
                                <td style="text-align: right;"><strong>₹${totalAmount}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="payment-summary">
                    <div class="payment-title">💳 Payment Summary</div>
                    <div class="payment-grid">
                        <div class="payment-item">
                            <div class="payment-label">Total Amount</div>
                            <div class="payment-amount">₹${totalAmount}</div>
                        </div>
                        <div class="payment-item">
                            <div class="payment-label">Amount Paid</div>
                            <div class="payment-amount">₹${advancePaid}</div>
                        </div>
                        <div class="payment-item">
                            <div class="payment-label">Balance</div>
                            <div class="payment-amount">₹${balance}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="footer">
                <p class="company-name">RideShare Pro</p>
                <p>Thank you for choosing our premium transportation services!</p>
                <p>For support: support@ridesharepro.com | +91-XXXX-XXXXXX</p>
                <p>Visit us: www.ridesharepro.com</p>
            </div>
        </div>
    </body>
    </html>
    `;
  };

  const generateRegularInvoiceHTML = () => {
    const invoiceNumber = generateInvoiceNumber();
    const currentDate = new Date().toLocaleDateString('en-IN');
    const totalAmount = booking.total_amount || booking.pending_payment || 0;
    const advancePaid = booking.advanced_payment || 0;
    const balance = totalAmount - advancePaid;
    const isRoundTrip = booking.round_trip === true || booking.round_trip === 'true';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${isRoundTrip ? 'Round Trip' : 'Single Trip'} Invoice</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Helvetica Neue', Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
                color: #333;
            }
            
            .invoice-container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                border-radius: 15px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            
            .header {
                background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
                color: white;
                padding: 30px;
                position: relative;
                overflow: hidden;
            }
            
            .header::before {
                content: '';
                position: absolute;
                top: -50%;
                right: -20%;
                width: 200px;
                height: 200px;
                background: rgba(255,255,255,0.1);
                border-radius: 50%;
            }
            
            .company-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            
            .company-logo {
                width: 60px;
                height: 60px;
                background: white;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                color: #3B82F6;
                font-size: 24px;
            }
            
            .company-details h1 {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 5px;
            }
            
            .company-details p {
                opacity: 0.9;
                font-size: 14px;
            }
            
            .invoice-title {
                text-align: center;
                font-size: 32px;
                font-weight: 300;
                letter-spacing: 2px;
                margin-top: 10px;
            }
            
            .content {
                padding: 40px;
            }
            
            .invoice-meta {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
                background: #f8fafc;
                padding: 20px;
                border-radius: 10px;
            }
            
            .meta-item h4 {
                color: #64748b;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 5px;
            }
            
            .meta-item p {
                font-size: 16px;
                font-weight: 600;
                color: #1e293b;
            }
            
            .route-container {
                background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                border-radius: 15px;
                padding: 25px;
                margin-bottom: 30px;
                border-left: 5px solid #3B82F6;
            }
            
            .route-title {
                font-size: 20px;
                font-weight: 700;
                color: #1e293b;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
            }
            
            .route-icon {
                width: 30px;
                height: 30px;
                background: #3B82F6;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 10px;
                color: white;
                font-size: 14px;
            }
            
            .route-item {
                display: flex;
                align-items: center;
                margin-bottom: 15px;
                background: white;
                padding: 15px;
                border-radius: 10px;
                border: 1px solid #e2e8f0;
            }
            
            .route-marker {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                margin-right: 15px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 12px;
                font-weight: bold;
            }
            
            .pickup-marker {
                background: #10B981;
            }
            
            .dropoff-marker {
                background: #EF4444;
            }
            
            .route-text {
                font-size: 16px;
                font-weight: 600;
                color: #1e293b;
                flex: 1;
            }
            
            .route-connector {
                display: flex;
                align-items: center;
                margin-left: 25px;
                margin-bottom: 10px;
            }
            
            .connector-line {
                width: 2px;
                height: 20px;
                background: #d1d5db;
                margin-right: 15px;
            }
            
            .connector-arrow {
                color: #6b7280;
                font-size: 14px;
            }
            
            .trip-details {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .detail-item {
                background: white;
                padding: 20px;
                border-radius: 10px;
                border: 1px solid #e2e8f0;
                text-align: center;
            }
            
            .detail-icon {
                width: 40px;
                height: 40px;
                background: #f1f5f9;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 10px;
                color: #3B82F6;
                font-size: 18px;
            }
            
            .detail-label {
                color: #64748b;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 5px;
            }
            
            .detail-value {
                font-size: 18px;
                font-weight: 700;
                color: #1e293b;
            }
            
            .instructions {
                background: #eff6ff;
                border-radius: 10px;
                padding: 20px;
                border-left: 4px solid #3b82f6;
                margin-bottom: 30px;
            }
            
            .instructions-title {
                font-weight: 600;
                color: #1e40af;
                margin-bottom: 10px;
            }
            
            .instructions-text {
                color: #1e40af;
                line-height: 1.6;
            }
            
            .driver-info {
                background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
                border-radius: 15px;
                padding: 25px;
                margin-bottom: 30px;
                border: 2px solid #10b981;
            }
            
            .driver-title {
                font-size: 18px;
                font-weight: 700;
                color: #065f46;
                margin-bottom: 15px;
            }
            
            .driver-details {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
            }
            
            .driver-item {
                background: white;
                padding: 15px;
                border-radius: 10px;
                text-align: center;
            }
            
            .payment-summary {
                background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                border-radius: 15px;
                padding: 25px;
                margin-bottom: 30px;
                border: 2px solid #f59e0b;
            }
            
            .payment-title {
                font-size: 18px;
                font-weight: 700;
                color: #92400e;
                margin-bottom: 15px;
                text-align: center;
            }
            
            .payment-amount {
                text-align: center;
                font-size: 36px;
                font-weight: 700;
                color: #1e293b;
                background: white;
                padding: 20px;
                border-radius: 10px;
            }
            
            .footer {
                background: #1e293b;
                color: white;
                padding: 30px;
                text-align: center;
            }
            
            .footer p {
                margin-bottom: 5px;
                opacity: 0.8;
            }
            
            .footer .company-name {
                font-size: 18px;
                font-weight: 700;
                opacity: 1;
                margin-bottom: 10px;
            }
            
            @media print {
                body { background: white; padding: 0; }
                .invoice-container { box-shadow: none; }
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <div class="header">
                <div class="company-info">
                    <div class="company-logo">🚗</div>
                    <div class="company-details">
                        <h1>RideShare Pro</h1>
                        <p>Premium Transportation Services</p>
                        <p>📧 support@ridesharepro.com | 📞 +91-XXXX-XXXXXX</p>
                    </div>
                </div>
                <div class="invoice-title">${isRoundTrip ? 'ROUND TRIP' : 'RIDE'} INVOICE</div>
            </div>
            
            <div class="content">
                <div class="invoice-meta">
                    <div class="meta-item">
                        <h4>Invoice Number</h4>
                        <p>${invoiceNumber}</p>
                    </div>
                    <div class="meta-item">
                        <h4>Invoice Date</h4>
                        <p>${currentDate}</p>
                    </div>
                    <div class="meta-item">
                        <h4>Trip Date</h4>
                        <p>${formatDate(booking.date_of_travel)}</p>
                    </div>
                    <div class="meta-item">
                        <h4>Booking ID</h4>
                        <p>#${booking.id}</p>
                    </div>
                </div>
                
                <div class="route-container">
                    <div class="route-title">
                        <div class="route-icon">${isRoundTrip ? '🔄' : '📍'}</div>
                        ${isRoundTrip ? 'Round Trip Route' : 'Trip Route'}
                    </div>
                    
                    <div class="route-item">
                        <div class="route-marker dropoff-marker">🎯</div>
                        <div class="route-text">${booking.end_point}</div>
                    </div>
                    
                    ${isRoundTrip ? `
                    <div class="route-connector">
                        <div class="connector-line"></div>
                        <div class="connector-arrow">↓</div>
                    </div>
                    
                    <div class="route-item">
                        <div class="route-marker pickup-marker">📍</div>
                        <div class="route-text">${booking.start_point}</div>
                    </div>
                    ` : ''}
                </div>
                
                <div class="trip-details">
                    <div class="detail-item">
                        <div class="detail-icon">🚗</div>
                        <div class="detail-label">Vehicle Type</div>
                        <div class="detail-value">${booking.vehicle_type}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-icon">📅</div>
                        <div class="detail-label">Travel Date</div>
                        <div class="detail-value">${formatDate(booking.date_of_travel)}</div>
                    </div>
                    ${booking.pickup_time ? `
                    <div class="detail-item">
                        <div class="detail-icon">⏰</div>
                        <div class="detail-label">Pickup Time</div>
                        <div class="detail-value">${formatTime(booking.pickup_time)}</div>
                    </div>
                    ` : ''}
                </div>
                
                ${(booking.ride_instructions || booking.pickupInstructions) ? `
                <div class="instructions">
                    <div class="instructions-title">Pickup Instructions</div>
                    <div class="instructions-text">${booking.ride_instructions || booking.pickupInstructions}</div>
                </div>
                ` : ''}
                
                ${booking.driver ? `
                <div class="driver-info">
                    <div class="driver-title">Driver Information</div>
                    <div class="driver-details">
                        <div class="driver-item">
                            <div class="detail-label">Driver Name</div>
                            <div class="detail-value">${booking.driver.name}</div>
                        </div>
                        <div class="driver-item">
                            <div class="detail-label">Car Number</div>
                            <div class="detail-value">${booking.driver.carNumber}</div>
                        </div>
                        <div class="driver-item">
                            <div class="detail-label">Rating</div>
                            <div class="detail-value">⭐ ${booking.driver.rating}</div>
                        </div>
                    </div>
                </div>
                ` : ''}
                
                <div class="payment-summary">
                    <div class="payment-title">💳 Total Fare</div>
                    <div class="payment-amount">₹${totalAmount}</div>
                </div>
            </div>
            
            <div class="footer">
                <p class="company-name">RideShare Pro</p>
                <p>Thank you for choosing our premium transportation services!</p>
                <p>For support: support@ridesharepro.com | +91-XXXX-XXXXXX</p>
                <p>Visit us: www.ridesharepro.com</p>
            </div>
        </div>
    </body>
    </html>
    `;
  };

  const generateInvoiceHTML = () => {
    if (booking.trip_type === 'package') {
      return generatePackageInvoiceHTML();
    }
    return generateRegularInvoiceHTML();
  };

  const handleDownloadPDF = async () => {
    try {
      setIsGenerating(true);
      
      const html = generateInvoiceHTML();
      
      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html });
      
      // Save to downloads
      const fileName = `Invoice_${generateInvoiceNumber()}_${Date.now()}.pdf`;
      const downloadPath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.moveAsync({
        from: uri,
        to: downloadPath
      });
      
      // Share or save the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadPath, {
          mimeType: 'application/pdf',
          dialogTitle: 'Download Invoice',
          UTI: 'com.adobe.pdf'
        });
      }
      
      Alert.alert(
        'Success',
        'Invoice has been generated and saved successfully!',
        [{ text: 'OK', onPress: () => onClose() }]
      );
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
      const tripType = booking.trip_type === 'package' ? 'Package Trip' : 
                       (booking.round_trip ? 'Round Trip' : 'Ride');
      
      await Share.share({
        message: `${tripType} Invoice - ${invoiceNumber}\n\nTrip Date: ${formatDate(booking.date_of_travel)}\nAmount: ₹${booking.total_amount || booking.pending_payment}\n\nGenerated via RideShare Pro`,
        title: `Invoice ${invoiceNumber}`
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.bottomSheet}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.dragHandle} />
            <View style={styles.headerContent}>
              <Text style={styles.sheetTitle}>Invoice Preview</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Preview Content */}
          <ScrollView style={styles.previewContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.invoicePreview}>
              <View style={styles.previewHeader}>
                <View style={styles.companyBadge}>
                  <MaterialCommunityIcons name="car" size={32} color="#10B981" />
                </View>
                <Text style={styles.companyName}>RideShare Pro</Text>
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
                    {booking.trip_type === 'package' ? 'Package Trip' : 
                     booking.round_trip ? 'Round Trip' : 'Single Trip'}
                  </Text>
                </View>
              </View>

              <View style={styles.routePreview}>
                <MaterialCommunityIcons name="map-marker" size={20} color="#10B981" />
                <Text style={styles.locationText}>{booking.start_point || booking.pick_up_place}</Text>
                {booking.end_point && (
                  <>
                    <MaterialCommunityIcons name="arrow-down" size={16} color="#9CA3AF" />
                    <MaterialCommunityIcons name="map-marker" size={20} color="#EF4444" />
                    <Text style={styles.locationText}>{booking.end_point}</Text>
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
                <MaterialCommunityIcons name="information" size={16} color="#3B82F6" />
                <Text style={styles.infoText}>
                  Full invoice with complete details will be generated in PDF format
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.shareButton]}
              onPress={handleShare}
            >
              <MaterialCommunityIcons name="share-variant" size={20} color="#3B82F6" />
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
    color: '#111827',
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
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#1D4ED8',
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
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  downloadButton: {
    backgroundColor: '#10B981',
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

export default InvoiceGenerator;