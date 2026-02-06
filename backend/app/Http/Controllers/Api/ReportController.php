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

            // Get store info
            $store = null;
            if ($storeId) {
                $store = \App\Models\Store::find($storeId);
            }

            // Query sales for the date
            $query = Sale::with(['user', 'store'])
                ->whereBetween('created_at', [$startDate, $endDate]);

            if ($storeId) {
                $query->where('store_id', $storeId);
            }

            $sales = $query->get();

            // Get all products with inventory
            $products = \App\Models\Product::with(['inventory'])->get();

            // Calculate product details for the report
            $productRows = $this->buildProductReportData($products, $sales, $store, $date);

            // Calculate totals and cash breakdown
            $totals = $this->calculateTotals($sales);
            $paymentBreakdown = $this->getPaymentBreakdown($sales);

            // Generate the new format PDF
            $html = $this->generateInventoryReportHTML(
                $date,
                $store,
                $productRows,
                $totals,
                $paymentBreakdown
            );

            $pdf = Pdf::loadHtml($html);
            $pdf->setPaper('a4', 'portrait');
            $pdf->setOption('margin-top', 5);
            $pdf->setOption('margin-bottom', 5);
            $pdf->setOption('margin-left', 5);
            $pdf->setOption('margin-right', 5);

            return $pdf->download("Daily-Report-{$date}.pdf");
        } catch (\Exception $e) {
            \Log::error('PDF Generation Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to generate PDF: ' . $e->getMessage()], 500);
        }
    }

    private function generateInventoryReportHTML($date, $store, $productRows, $totals, $paymentBreakdown)
    {
        $date_formatted = date('m/d/Y', strtotime($date));
        $storeName = $store ? $store->name : 'All Stores';
        $storeLocation = $store ? $store->location : 'N/A';

        // Build product table rows
        $productTableRows = '';
        $totalAmount = 0;
        $totalKgSales = 0;
        
        foreach ($productRows as $product) {
            $amount = $product['total_sales'];
            $totalAmount += $amount;
            $totalKgSales += $product['kg_sales'];
            
            $productTableRows .= '<tr>';
            $productTableRows .= '<td>' . htmlspecialchars($product['name']) . '</td>';
            $productTableRows .= '<td class="number">' . number_format($product['unit_price'], 2) . '</td>';
            $productTableRows .= '<td class="number">' . $product['wgs'] . '</td>';
            $productTableRows .= '<td class="number">' . $product['stock'] . '</td>';
            $productTableRows .= '<td class="number">' . $product['adg'] . '</td>';
            $productTableRows .= '<td class="number">' . $product['pick'] . '</td>';
            $productTableRows .= '<td class="number">' . $product['return'] . '</td>';
            $productTableRows .= '<td class="number">' . $product['scrap'] . '</td>';
            $productTableRows .= '<td class="number">' . $product['turn'] . '</td>';
            $productTableRows .= '<td class="number">' . $product['wo'] . '</td>';
            $productTableRows .= '<td class="number">' . number_format($product['kg_sales'], 2) . '</td>';
            $productTableRows .= '<td class="number">P ' . number_format($product['total_sales'], 2) . '</td>';
            $productTableRows .= '<td class="number">0</td>';
            $productTableRows .= '<td class="number">0</td>';
            $productTableRows .= '<td class="number">P ' . number_format($amount, 2) . '</td>';
            $productTableRows .= '</tr>';
        }

        // Build payment method rows (denominations)
        $paymentRows = '';
        foreach ($paymentBreakdown as $payment) {
            $paymentRows .= '<tr>';
            $paymentRows .= '<td>' . strtoupper(str_replace('_', ' ', htmlspecialchars($payment['method']))) . '</td>';
            $paymentRows .= '<td class="number">' . $payment['count'] . '</td>';
            $paymentRows .= '<td class="number">P ' . number_format($payment['amount'], 2) . '</td>';
            $paymentRows .= '</tr>';
        }

        $totalSales = $totals['total_sales'];
        $totalDiscount = $totals['total_discount'];
        $grossSales = $totalSales + $totalDiscount;

        $html = <<<'HTML'
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 8px; color: #000; line-height: 1.2; margin: 0; padding: 0; }
        .document-container { border: 3px solid #000; margin: 72px; padding: 20px; }
        .header { text-align: center; margin-bottom: 8px; border-bottom: 2px solid #000; padding-bottom: 5px; }
        .header h1 { font-size: 14px; font-weight: bold; margin-bottom: 3px; }
        .header-info { display: flex; justify-content: space-around; margin-top: 5px; font-size: 8px; }
        .info-item { text-align: left; }
        .info-item strong { display: inline-block; width: 50px; }
        
        table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        th { background-color: #f0f0f0; border: 1px solid #000; padding: 2px; text-align: center; font-weight: bold; font-size: 7px; }
        td { border: 1px solid #000; padding: 2px; text-align: left; font-size: 8px; }
        td.number { text-align: right; padding-right: 4px; }
        
        .products-table { font-size: 7px; }
        .products-table th { padding: 1px; font-size: 7px; }
        .products-table td { padding: 1px 2px; font-size: 7px; }
        
        .total-row { background-color: #ffcc00; font-weight: bold; }
        .total-row td { border: 1px solid #000; }
        
        .section-title { font-size: 8px; font-weight: bold; margin-top: 8px; margin-bottom: 3px; background-color: #f0f0f0; padding: 2px; border: 1px solid #000; text-align: center; }
        .two-column { display: flex; gap: 10px; }
        .column { flex: 1; }
        
        .cash-out-table { width: 100%; }
        .cash-out-table td { padding: 2px; }
        .cash-out-table .label { width: 70%; text-align: left; }
        .cash-out-table .value { width: 30%; text-align: right; }
        
        .signature-box { display: flex; gap: 20px; margin-top: 10px; font-size: 7px; }
        .signature { text-align: center; width: 30%; }
        .signature-line { border-top: 1px solid #000; margin-top: 15px; font-size: 7px; }
    </style>
</head>
<body>
<div class="document-container">
    <div class="header">
        <h1>LZT MEAT PRODUCTS</h1>
        <div class="header-info">
            <div class="info-item"><strong>NAME:</strong> {STORE_NAME}</div>
            <div class="info-item"><strong>LOC:</strong> {STORE_LOCATION}</div>
            <div class="info-item"><strong>DATE:</strong> {DATE}</div>
        </div>
    </div>

    <div class="section-title">PRODUCTS</div>
    <table class="products-table">
        <thead>
            <tr>
                <th>1</th>
                <th>UNIT</th>
                <th>WGS</th>
                <th>STOC</th>
                <th>ADG</th>
                <th>PICK</th>
                <th>RET</th>
                <th>SCRAP</th>
                <th>TURN</th>
                <th>W/O</th>
                <th>KG SALES</th>
                <th>TOTAL SALES</th>
                <th>KG</th>
                <th>DISC</th>
                <th>AMOUNT</th>
            </tr>
        </thead>
        <tbody>
            {PRODUCT_ROWS}
            <tr class="total-row">
                <td colspan="10" style="text-align: right;"><strong>TOTAL</strong></td>
                <td class="number"><strong>{TOTAL_KG_SALES}</strong></td>
                <td class="number"><strong>{TOTAL_SALES}</strong></td>
                <td></td>
                <td></td>
                <td class="number"><strong>{TOTAL_AMOUNT}</strong></td>
            </tr>
        </tbody>
    </table>

    <div class="two-column">
        <div class="column">
            <div class="section-title">CASH OUT</div>
            <table class="cash-out-table">
                <tr><td class="label">PWESTO</td><td class="value">P 0.00</td></tr>
                <tr><td class="label">OTHER</td><td class="value">P 0.00</td></tr>
                <tr><td class="label">KAFF</td><td class="value">P 0.00</td></tr>
                <tr><td class="label" style="border-top: 2px solid #000;"><strong>TOTAL</strong></td><td class="value" style="border-top: 2px solid #000;"><strong>P 0.00</strong></td></tr>
            </table>
        </div>
        <div class="column">
            <div class="section-title">SALES</div>
            <table>
                <tr><th>DEN</th><th>#</th><th>TOTAL</th></tr>
                {PAYMENT_ROWS}
                <tr class="total-row"><td><strong>TOTAL</strong></td><td class="number"><strong>-</strong></td><td class="number"><strong>{SALES_TOTAL}</strong></td></tr>
            </table>
        </div>
    </div>

    <div class="section-title">COMPUTATION</div>
    <table class="cash-out-table">
        <tr><td class="label">TOTAL SALES</td><td class="value">{TOTAL_SALES}</td></tr>
        <tr><td class="label">CASH OUT</td><td class="value">P 0.00</td></tr>
        <tr><td class="label" style="border-top: 2px solid #000; border-bottom: 2px solid #000;"><strong>GROSS SALES</strong></td><td class="value" style="border-top: 2px solid #000; border-bottom: 2px solid #000;"><strong>{GROSS_SALES}</strong></td></tr>
        <tr style="background-color: #ffcc00;"><td class="label"><strong>OVER</strong></td><td class="value"><strong>{OVER}</strong></td></tr>
    </table>

    <div class="section-title">REMARKS</div>
    <div style="border: 1px solid #000; padding: 5px; min-height: 20px; font-size: 8px;"></div>

    <div class="signature-box">
        <div class="signature">
            <p>Prepared By:</p>
            <div class="signature-line">{PREPARED_BY}</div>
        </div>
        <div class="signature">
            <p>Checked By:</p>
            <div class="signature-line">_____________________</div>
        </div>
        <div class="signature">
            <p>Approved By:</p>
            <div class="signature-line">_____________________</div>
        </div>
    </div>

    <p style="text-align: center; margin-top: 8px; font-size: 7px; border-top: 1px solid #000; padding-top: 5px;">
        ATTENTION: Please WRITE a READABLE and CLEAR numbers and points and avoid ALTERATIONS
    </p>
</div>
</body>
</html>
HTML;

        // Replace placeholders
        $html = str_replace('{STORE_NAME}', htmlspecialchars($storeName), $html);
        $html = str_replace('{STORE_LOCATION}', htmlspecialchars($storeLocation), $html);
        $html = str_replace('{DATE}', $date_formatted, $html);
        $html = str_replace('{PRODUCT_ROWS}', $productTableRows, $html);
        $html = str_replace('{PAYMENT_ROWS}', $paymentRows, $html);
        $html = str_replace('{TOTAL_SALES}', 'P ' . number_format($totalSales, 2), $html);
        $html = str_replace('{TOTAL_AMOUNT}', 'P ' . number_format($totalAmount, 2), $html);
        $html = str_replace('{TOTAL_KG_SALES}', number_format($totalKgSales, 2), $html);
        $html = str_replace('{SALES_TOTAL}', 'P ' . number_format($totalSales, 2), $html);
        $html = str_replace('{GROSS_SALES}', 'P ' . number_format($grossSales, 2), $html);
        $html = str_replace('{OVER}', 'P ' . number_format(0, 2), $html);
        $html = str_replace('{PREPARED_BY}', htmlspecialchars(auth()->user()?->full_name ?? '_____________________'), $html);

        return $html;
    }

    private function buildProductReportData($products, $sales, $store, $date)
    {
        $productData = [];
        
        // Group sales by product
        $salesByProduct = [];
        foreach ($sales as $sale) {
            $items = is_string($sale->items) ? json_decode($sale->items, true) : $sale->items;
            
            if (is_array($items)) {
                foreach ($items as $item) {
                    $productName = $item['name'] ?? 'Unknown';
                    $quantity = $item['quantity'] ?? 0;
                    $price = $item['price'] ?? 0;
                    
                    if (!isset($salesByProduct[$productName])) {
                        $salesByProduct[$productName] = [
                            'quantity' => 0,
                            'total_sales' => 0,
                        ];
                    }
                    
                    $salesByProduct[$productName]['quantity'] += $quantity;
                    $salesByProduct[$productName]['total_sales'] += ($quantity * $price);
                }
            }
        }

        // Build product array with inventory data
        foreach ($products as $product) {
            $inventory = $store && $product->inventory ? 
                $product->inventory->where('location', $store->location)->first() : null;
            
            $quantity = isset($salesByProduct[$product->name]) ? $salesByProduct[$product->name]['quantity'] : 0;
            $totalSales = isset($salesByProduct[$product->name]) ? $salesByProduct[$product->name]['total_sales'] : 0;
            
            $productData[] = [
                'id' => $product->id,
                'name' => $product->name,
                'unit_price' => $product->price,
                'wgs' => 0,  // Weight sold - can be calculated if needed
                'stock' => $inventory ? $inventory->quantity : 0,
                'adg' => 0,  // Additional/Damage
                'pick' => $quantity,  // Picked/Sold
                'return' => 0,  // Returned
                'scrap' => 0,  // Scrap
                'turn' => 0,  // Turn
                'wo' => 0,  // Write-off
                'kg_sales' => $quantity,  // KG Sales
                'total_sales' => $totalSales,
            ];
        }

        return $productData;
    }

    private function calculateTotals($sales)
    {
        $totalSales = 0;
        $totalDiscount = 0;
        $transactionCount = $sales->count();

        foreach ($sales as $sale) {
            $totalSales += $sale->total;
            $totalDiscount += $sale->global_discount;
        }

        return [
            'total_sales' => $totalSales,
            'total_discount' => $totalDiscount,
            'transaction_count' => $transactionCount,
            'gross_sales' => $totalSales + $totalDiscount,
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
