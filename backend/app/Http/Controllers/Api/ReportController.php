<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function dailyReport(Request $request)
    {
        try {
            $date = $request->query('date') ?? date('Y-m-d');
            $storeId = $request->query('storeId');

            // Parse the date
            $startDate = Carbon::parse($date)->startOfDay();
            $endDate = Carbon::parse($date)->endOfDay();

            // Query sales for the date
            $query = Sale::with(['user', 'store'])
                ->whereBetween('created_at', [$startDate, $endDate]);

            if ($storeId) {
                $query->where('store_id', $storeId);
            }

            $sales = $query->get();

            // Calculate summary data
            $summary = $this->calculateSummary($sales);

            // Group items by product
            $productSales = $this->groupProductSales($sales);

            // Payment method breakdown
            $paymentBreakdown = $this->getPaymentBreakdown($sales);

            // Generate PDF - Create simple HTML without using Blade view
            $html = $this->generateReportHTML(
                $date,
                $sales->first()?->store?->name ?? 'All Stores',
                $productSales,
                $summary,
                $paymentBreakdown
            );

            $pdf = Pdf::loadHtml($html);
            $pdf->setPaper('a4', 'landscape');

            return $pdf->download("Daily-Report-{$date}.pdf");
        } catch (\Exception $e) {
            \Log::error('PDF Generation Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to generate PDF: ' . $e->getMessage()], 500);
        }
    }

    private function generateReportHTML($date, $storeName, $productSales, $summary, $paymentBreakdown)
    {
        $html = <<<'HTML'
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 10px; color: #000; }
        .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .header h1 { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
        .header-info { display: flex; justify-content: space-between; margin-top: 8px; font-size: 9px; }
        .info-group { text-align: left; }
        .info-group strong { display: inline-block; width: 80px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th { background-color: #f0f0f0; border: 1px solid #000; padding: 4px; text-align: left; font-weight: bold; font-size: 9px; }
        td { border: 1px solid #ccc; padding: 4px; text-align: left; font-size: 9px; }
        td.number { text-align: right; }
        .total-row { background-color: #ffcc00; font-weight: bold; }
        .total-row td { border: 1px solid #000; }
        .section-title { font-size: 10px; font-weight: bold; margin-top: 15px; margin-bottom: 8px; background-color: #f0f0f0; padding: 3px; border: 1px solid #000; }
        .summary-section { margin-bottom: 15px; }
        .summary-section h3 { font-size: 10px; font-weight: bold; margin-bottom: 5px; border-bottom: 1px solid #000; padding-bottom: 3px; }
        .summary-table { width: 100%; margin-bottom: 10px; }
        .summary-table td { border: none; border-bottom: 1px solid #ccc; padding: 3px; }
        .summary-table td:first-child { text-align: left; width: 60%; }
        .summary-table td:last-child { text-align: right; width: 40%; }
        .summary-total { border-top: 2px solid #000 !important; border-bottom: 2px solid #000 !important; font-weight: bold; background-color: #f0f0f0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>LZT MEAT PRODUCTS</h1>
        <p>Daily Sales Report</p>
        <div class="header-info">
            <div class="info-group">
                <strong>Store:</strong> {STORE_NAME}
            </div>
            <div class="info-group">
                <strong>Date:</strong> {DATE}
            </div>
            <div class="info-group">
                <strong>Time:</strong> {TIME}
            </div>
        </div>
    </div>

    <div class="section-title">PRODUCT SALES SUMMARY</div>
    <table>
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
            {PRODUCT_ROWS}
            <tr class="total-row">
                <td colspan="3" style="text-align: right;"><strong>TOTAL</strong></td>
                <td class="number">₱{TOTAL_SALES}</td>
                <td class="number">{TRANSACTION_COUNT}</td>
                <td class="number">100%</td>
            </tr>
        </tbody>
    </table>

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
            {PAYMENT_ROWS}
            <tr class="total-row">
                <td><strong>TOTAL</strong></td>
                <td class="number"><strong>{TRANSACTION_COUNT}</strong></td>
                <td class="number"><strong>₱{TOTAL_SALES}</strong></td>
                <td class="number"><strong>100%</strong></td>
            </tr>
        </tbody>
    </table>

    <div class="summary-section">
        <h3>SALES SUMMARY</h3>
        <table class="summary-table">
            <tr>
                <td>Total Transactions:</td>
                <td>{TRANSACTION_COUNT}</td>
            </tr>
            <tr>
                <td>Gross Sales (before discount):</td>
                <td>₱{GROSS_SALES}</td>
            </tr>
            <tr>
                <td>Total Discount Applied:</td>
                <td>₱{TOTAL_DISCOUNT}</td>
            </tr>
            <tr class="summary-total">
                <td>NET SALES:</td>
                <td>₱{TOTAL_SALES}</td>
            </tr>
        </table>
    </div>

    <p style="text-align: center; margin-top: 20px; font-size: 9px;">
        Report generated on {GENERATED_DATE}
    </p>
</body>
</html>
HTML;

        // Build product rows
        $productRows = '';
        foreach ($productSales as $product) {
            $percentage = $summary['totalSales'] > 0 
                ? number_format(($product['totalSales'] / $summary['totalSales']) * 100, 1) 
                : '0';
            $unitPrice = $product['quantity'] > 0 
                ? $product['totalSales'] / $product['quantity'] 
                : 0;
            
            $productRows .= '<tr>';
            $productRows .= '<td>' . htmlspecialchars($product['name']) . '</td>';
            $productRows .= '<td class="number">' . $product['quantity'] . '</td>';
            $productRows .= '<td class="number">₱' . number_format($unitPrice, 2) . '</td>';
            $productRows .= '<td class="number">₱' . number_format($product['totalSales'], 2) . '</td>';
            $productRows .= '<td class="number">' . $product['transactions'] . '</td>';
            $productRows .= '<td class="number">' . $percentage . '%</td>';
            $productRows .= '</tr>';
        }

        // Build payment rows
        $paymentRows = '';
        foreach ($paymentBreakdown as $payment) {
            $percentage = $summary['totalSales'] > 0 
                ? number_format(($payment['amount'] / $summary['totalSales']) * 100, 1) 
                : '0';
            
            $paymentRows .= '<tr>';
            $paymentRows .= '<td>' . ucfirst(htmlspecialchars($payment['method'])) . '</td>';
            $paymentRows .= '<td class="number">' . $payment['count'] . '</td>';
            $paymentRows .= '<td class="number">₱' . number_format($payment['amount'], 2) . '</td>';
            $paymentRows .= '<td class="number">' . $percentage . '%</td>';
            $paymentRows .= '</tr>';
        }

        // Replace placeholders
        $html = str_replace('{STORE_NAME}', htmlspecialchars($storeName), $html);
        $html = str_replace('{DATE}', htmlspecialchars(date('m/d/Y', strtotime($date))), $html);
        $html = str_replace('{TIME}', date('H:i:s'), $html);
        $html = str_replace('{PRODUCT_ROWS}', $productRows, $html);
        $html = str_replace('{PAYMENT_ROWS}', $paymentRows, $html);
        $html = str_replace('{TOTAL_SALES}', number_format($summary['totalSales'], 2), $html);
        $html = str_replace('{GROSS_SALES}', number_format($summary['grossSales'], 2), $html);
        $html = str_replace('{TOTAL_DISCOUNT}', number_format($summary['totalDiscount'], 2), $html);
        $html = str_replace('{TRANSACTION_COUNT}', $summary['transactionCount'], $html);
        $html = str_replace('{GENERATED_DATE}', date('Y-m-d H:i:s'), $html);

        return $html;
    }

    private function calculateSummary($sales)
    {
        $totalSales = 0;
        $totalDiscount = 0;
        $totalTax = 0;
        $transactionCount = $sales->count();

        foreach ($sales as $sale) {
            $totalSales += $sale->total;
            $totalDiscount += $sale->global_discount;
            $totalTax += $sale->tax;
        }

        return [
            'totalSales' => $totalSales,
            'totalDiscount' => $totalDiscount,
            'totalTax' => $totalTax,
            'transactionCount' => $transactionCount,
            'grossSales' => $totalSales + $totalDiscount,
        ];
    }

    private function groupProductSales($sales)
    {
        $products = [];

        foreach ($sales as $sale) {
            $items = is_string($sale->items) ? json_decode($sale->items, true) : $sale->items;
            
            if (is_array($items)) {
                foreach ($items as $item) {
                    $productName = $item['name'] ?? 'Unknown';
                    $quantity = $item['quantity'] ?? 0;
                    $price = $item['price'] ?? 0;
                    $itemTotal = $quantity * $price;

                    if (!isset($products[$productName])) {
                        $products[$productName] = [
                            'name' => $productName,
                            'quantity' => 0,
                            'totalSales' => 0,
                            'transactions' => 0,
                        ];
                    }

                    $products[$productName]['quantity'] += $quantity;
                    $products[$productName]['totalSales'] += $itemTotal;
                    $products[$productName]['transactions']++;
                }
            }
        }

        // Sort by total sales descending
        uasort($products, function ($a, $b) {
            return $b['totalSales'] <=> $a['totalSales'];
        });

        return array_values($products);
    }

    private function getPaymentBreakdown($sales)
    {
        $breakdown = [];

        foreach ($sales as $sale) {
            $method = $sale->payment_method ?? 'Unknown';
            
            if (!isset($breakdown[$method])) {
                $breakdown[$method] = [
                    'method' => $method,
                    'count' => 0,
                    'amount' => 0,
                ];
            }

            $breakdown[$method]['count']++;
            $breakdown[$method]['amount'] += $sale->total;
        }

        return array_values($breakdown);
    }

    public function exportCSV(Request $request)
    {
        $date = $request->query('date') ?? date('Y-m-d');
        $storeId = $request->query('storeId');

        // Parse the date
        $startDate = Carbon::parse($date)->startOfDay();
        $endDate = Carbon::parse($date)->endOfDay();

        // Query sales for the date
        $query = Sale::with(['user', 'store'])
            ->whereBetween('created_at', [$startDate, $endDate]);

        if ($storeId) {
            $query->where('store_id', $storeId);
        }

        $sales = $query->get();

        $filename = "Daily-Report-{$date}.csv";
        
        header('Content-Type: text/csv');
        header("Content-Disposition: attachment; filename=\"{$filename}\"");

        $output = fopen('php://output', 'w');

        // Header row
        fputcsv($output, [
            'Transaction ID',
            'Date',
            'Time',
            'Cashier',
            'Customer',
            'Store',
            'Items Count',
            'Subtotal',
            'Global Discount',
            'Total',
            'Payment Method',
            'Sales Type',
        ]);

        // Data rows
        foreach ($sales as $sale) {
            $itemsArray = is_string($sale->items) ? json_decode($sale->items, true) : $sale->items;
            $itemsCount = is_array($itemsArray) ? count($itemsArray) : 0;

            fputcsv($output, [
                $sale->transaction_id,
                $sale->created_at->format('Y-m-d'),
                $sale->created_at->format('H:i:s'),
                $sale->user?->full_name ?? 'Unknown',
                $sale->customer['name'] ?? 'Walk-in',
                $sale->store?->name ?? 'Unknown',
                $itemsCount,
                number_format($sale->subtotal, 2),
                number_format($sale->global_discount, 2),
                number_format($sale->total, 2),
                $sale->payment_method,
                $sale->sales_type,
            ]);
        }

        fclose($output);
        exit;
    }
}
