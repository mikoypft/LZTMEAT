<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DiscountSetting;
use Illuminate\Http\Request;

class DiscountSettingController extends Controller
{
    public function show()
    {
        $settings = DiscountSetting::getSettings();
        
        return response()->json([
            'settings' => [
                'id' => $settings->id,
                'wholesaleMinUnits' => $settings->wholesale_min_units,
                'discountType' => $settings->discount_type,
                'wholesaleDiscountPercent' => (float)$settings->wholesale_discount_percent,
                'wholesaleDiscountAmount' => $settings->discount_type === 'fixed_amount' ? (float)$settings->wholesale_discount_amount : null,
            ],
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'wholesaleMinUnits' => 'required|integer|min:1|max:1000',
            'discountType' => 'required|in:percentage,fixed_amount',
            'wholesaleDiscountPercent' => 'nullable|numeric|min:0|max:100|required_if:discountType,percentage',
            'wholesaleDiscountAmount' => 'nullable|numeric|min:0|required_if:discountType,fixed_amount',
        ]);

        $settings = DiscountSetting::getSettings();
        $settings->update([
            'wholesale_min_units' => $validated['wholesaleMinUnits'],
            'discount_type' => $validated['discountType'],
            'wholesale_discount_percent' => $validated['wholesaleDiscountPercent'] ?? 0,
            'wholesale_discount_amount' => $validated['wholesaleDiscountAmount'] ?? null,
        ]);

        return response()->json([
            'message' => 'Discount settings updated successfully',
            'settings' => [
                'id' => $settings->id,
                'wholesaleMinUnits' => $settings->wholesale_min_units,
                'discountType' => $settings->discount_type,
                'wholesaleDiscountPercent' => (float)$settings->wholesale_discount_percent,
                'wholesaleDiscountAmount' => $settings->discount_type === 'fixed_amount' ? (float)$settings->wholesale_discount_amount : null,
            ],
        ]);
    }
}
