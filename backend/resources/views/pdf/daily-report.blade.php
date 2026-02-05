<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            color: #000;
        }

        .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
        }

        .header h1 {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .header-info {
            display: flex;
            justify-content: space-between;
            margin-top: 8px;
            font-size: 9px;
        }

        .info-group {
            text-align: left;
        }

        .info-group strong {
            display: inline-block;
            width: 80px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }

        table.products-table {
            margin-bottom: 20px;
        }

        th {
            background-color: #f0f0f0;
            border: 1px solid #000;
            padding: 4px;
            text-align: left;
            font-weight: bold;
            font-size: 9px;
        }

        td {
            border: 1px solid #ccc;
            padding: 4px;
            text-align: left;
            font-size: 9px;
        }

        td.number {
            text-align: right;
        }

        .total-row {
            background-color: #ffcc00;
            font-weight: bold;
        }

        .total-row td {
            border: 1px solid #000;
        }

        .summary-section {
            margin-bottom: 15px;
        }

        .summary-section h3 {
            font-size: 10px;
            font-weight: bold;
            margin-bottom: 5px;
            border-bottom: 1px solid #000;
            padding-bottom: 3px;
        }

        .summary-table {
            width: 100%;
            margin-bottom: 10px;
        }

        .summary-table td {
            border: none;
            border-bottom: 1px solid #ccc;
            padding: 3px;
        }

        .summary-table td:first-child {
            text-align: left;
            width: 60%;
        }

        .summary-table td:last-child {
            text-align: right;
            width: 40%;
        }

        .summary-total {
            border-top: 2px solid #000 !important;
            border-bottom: 2px solid #000 !important;
            font-weight: bold;
            background-color: #f0f0f0;
        }

        .section-title {
            font-size: 10px;
            font-weight: bold;
            margin-top: 15px;
            margin-bottom: 8px;
            background-color: #f0f0f0;
            padding: 3px;
            border: 1px solid #000;
        }

        .footer {
            margin-top: 20px;
            border-top: 2px solid #000;
            padding-top: 10px;
            display: flex;
            justify-content: space-between;
            font-size: 9px;
        }

        .signature-box {
            text-align: center;
            width: 30%;
        }

        .signature-line {
            border-top: 1px solid #000;
            margin-top: 30px;
            padding-top: 3px;
        }

        .page-break {
            page-break-after: always;
        }

        .highlight {
            background-color: #ffcc00;
            font-weight: bold;
        }

        .payment-grid {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
        }

        .payment-column {
            flex: 1;
        }

        .payment-column table {
            margin-bottom: 0;
        }

        .payment-column table td {
            font-size: 8px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>LZT MEAT PRODUCTS</h1>
        <p>Daily Sales Report</p>
        <div class="header-info">
            <div class="info-group">
                <strong>Store:</strong> {{ $storeName }}
            </div>
            <div class="info-group">
                <strong>Date:</strong> {{ \Carbon\Carbon::parse($date)->format('m/d/Y') }}
            </div>
            <div class="info-group">
                <strong>Time:</strong> {{ date('H:i:s') }}
            </div>
        </div>
    </div>

    <!-- Products Sales Table -->
    <div class="section-title">PRODUCT SALES SUMMARY</div>
    <table class="products-table">
        <thead>
            <tr>
                <th style="width: 25%;">PRODUCT NAME</th>
                <th style="width: 15%;" class="number">QUANTITY</th>
                <th style="width: 15%;" class="number">UNIT PRICE</th>
                <th style="width: 20%;" class="number">TOTAL SALES</th>
                <th style="width: 15%;" class="number">TRANSACTIONS</th>
                <th style="width: 10%;" class="number">%</th>
            </tr>
        </thead>
        <tbody>
            @foreach($productSales as $product)
            <tr>
                <td>{{ $product['name'] }}</td>
                <td class="number">{{ $product['quantity'] }}</td>
                <td class="number">₱{{ number_format($product['totalSales'] / max($product['quantity'], 1), 2) }}</td>
                <td class="number">₱{{ number_format($product['totalSales'], 2) }}</td>
                <td class="number">{{ $product['transactions'] }}</td>
                <td class="number">{{ $summary['totalSales'] > 0 ? number_format(($product['totalSales'] / $summary['totalSales']) * 100, 1) : 0 }}%</td>
            </tr>
            @endforeach
            <tr class="total-row">
                <td colspan="3" style="text-align: right;"><strong>TOTAL</strong></td>
                <td class="number">₱{{ number_format($summary['totalSales'], 2) }}</td>
                <td class="number">{{ $summary['transactionCount'] }}</td>
                <td class="number">100%</td>
            </tr>
        </tbody>
    </table>

    <!-- Payment Methods Section -->
    <div class="section-title">PAYMENT METHODS</div>
    <table>
        <thead>
            <tr>
                <th>Payment Method</th>
                <th class="number">Transactions</th>
                <th class="number">Amount</th>
                <th class="number">%</th>
            </tr>
        </thead>
        <tbody>
            @foreach($paymentBreakdown as $payment)
            <tr>
                <td>{{ ucfirst($payment['method']) }}</td>
                <td class="number">{{ $payment['count'] }}</td>
                <td class="number">₱{{ number_format($payment['amount'], 2) }}</td>
                <td class="number">{{ $summary['totalSales'] > 0 ? number_format(($payment['amount'] / $summary['totalSales']) * 100, 1) : 0 }}%</td>
            </tr>
            @endforeach
            <tr class="total-row">
                <td><strong>TOTAL</strong></td>
                <td class="number"><strong>{{ $summary['transactionCount'] }}</strong></td>
                <td class="number"><strong>₱{{ number_format($summary['totalSales'], 2) }}</strong></td>
                <td class="number"><strong>100%</strong></td>
            </tr>
        </tbody>
    </table>

    <!-- Summary Section -->
    <div class="summary-section">
        <h3>SALES SUMMARY</h3>
        <table class="summary-table">
            <tr>
                <td>Total Transactions:</td>
                <td>{{ $summary['transactionCount'] }}</td>
            </tr>
            <tr>
                <td>Gross Sales (before discount):</td>
                <td>₱{{ number_format($summary['grossSales'], 2) }}</td>
            </tr>
            <tr>
                <td>Total Discount Applied:</td>
                <td>₱{{ number_format($summary['totalDiscount'], 2) }}</td>
            </tr>
            <tr class="summary-total">
                <td>NET SALES:</td>
                <td>₱{{ number_format($summary['totalSales'], 2) }}</td>
            </tr>
        </table>
    </div>

    <!-- Footer -->
    <div class="footer">
        <div class="signature-box">
            <p>Prepared By:</p>
            <div class="signature-line">{{ auth()->user()?->full_name ?? '_______' }}</div>
        </div>
        <div class="signature-box">
            <p>Checked By:</p>
            <div class="signature-line">_______________________</div>
        </div>
        <div class="signature-box">
            <p>Approved By:</p>
            <div class="signature-line">_______________________</div>
        </div>
    </div>

    <p style="text-align: center; margin-top: 20px; font-size: 9px;">
        Report generated on {{ date('Y-m-d H:i:s') }}
    </p>
</body>
</html>
